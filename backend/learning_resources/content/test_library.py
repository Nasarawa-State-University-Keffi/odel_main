"""Shared library behavior through its real HTTP endpoints and storage adapters."""

import io
import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APIClient, APITestCase

from courses.models import CourseCache, StaffAssignedCourse
from portal_auth.models import PortalUser
from .library_storage import open_remote_file, store_file
from .models import LibraryResource, ResourceCategory


class LibraryAPITests(APITestCase):
    base = '/api/resource-library/'

    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.override = override_settings(MEDIA_ROOT=self.directory.name)
        self.override.enable()
        self.addCleanup(self.override.disable)
        cache.clear()
        self.addCleanup(cache.clear)
        self.staff = PortalUser.objects.create(
            external_id='library-teacher',
            full_name='Teacher',
            is_staff=True,
            roles=['STAFF'],
        )
        self.other_staff = PortalUser.objects.create(
            external_id='library-other',
            full_name='Other Teacher',
            is_staff=True,
            roles=['STAFF'],
        )
        self.admin = PortalUser.objects.create(
            external_id='library-admin',
            full_name='Admin',
            is_staff=True,
            roles=['ADMIN'],
        )
        self.student = PortalUser.objects.create(
            external_id='library-student', full_name='Student', roles=['STUDENT']
        )
        self.category = ResourceCategory.objects.create(name='Study Skills')
        self.published = self.make_resource(title='Academic writing', is_published=True)
        self.draft = self.make_resource(title='Draft guide')
        self.client.force_authenticate(self.admin)

    def make_resource(self, **values):
        defaults = dict(
            title='General handbook',
            external_url='https://example.edu/guide',
            created_by=self.admin,
            category=self.category,
        )
        defaults.update(values)
        return LibraryResource.objects.create(**defaults)

    def url(self, resource):
        return f'{self.base}resources/{resource.pk}/'

    def test_admin_can_create_a_resource_without_course_or_period(self):
        response = self.client.post(
            self.base + 'resources/',
            {
                'title': 'General research handbook',
                'description': 'For every learner',
                'external_url': 'https://example.edu/research',
                'tags': [' Research ', 'research'],
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertIsNone(response.data['course'])
        self.assertFalse(response.data['is_published'])
        self.assertEqual(response.data['tags'], ['research'])
        self.assertEqual(response.data['created_by'], self.admin.pk)
        self.assertTrue(response.data['can_manage'])

    def test_unenrolled_student_can_browse_only_published_resources(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.base + 'resources/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.published.pk))
        self.assertFalse(response.data['results'][0]['can_manage'])
        self.assertEqual(self.client.get(self.url(self.published)).status_code, 200)
        self.assertEqual(self.client.get(self.url(self.draft)).status_code, 404)

    def test_students_cannot_create_update_delete_or_manage_categories(self):
        self.client.force_authenticate(self.student)
        self.assertEqual(
            self.client.post(
                self.base + 'resources/', {'title': 'Bad'}, format='json'
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.patch(
                self.url(self.published), {'title': 'Bad'}, format='json'
            ).status_code,
            403,
        )
        self.assertEqual(self.client.delete(self.url(self.published)).status_code, 403)
        self.assertEqual(
            self.client.post(
                self.base + 'categories/', {'name': 'Bad'}, format='json'
            ).status_code,
            403,
        )

    def test_anonymous_and_non_lms_accounts_are_rejected(self):
        self.assertEqual(APIClient().get(self.base + 'resources/').status_code, 401)
        applicant = PortalUser.objects.create(
            external_id='library-applicant', full_name='Applicant', roles=['APPLICANT']
        )
        self.client.force_authenticate(applicant)
        self.assertEqual(self.client.get(self.base + 'resources/').status_code, 403)

    def test_staff_cannot_change_others_resources_or_see_their_drafts(self):
        self.client.force_authenticate(self.other_staff)
        self.assertEqual(self.client.get(self.url(self.draft)).status_code, 404)
        self.assertEqual(
            self.client.patch(
                self.url(self.published), {'title': 'Bad'}, format='json'
            ).status_code,
            403,
        )
        self.assertEqual(self.client.delete(self.url(self.published)).status_code, 403)
        self.assertFalse(self.client.get(self.url(self.published)).data['can_manage'])

    def test_admin_can_manage_every_resource(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(self.base + 'resources/').data['count'], 2)
        response = self.client.patch(
            self.url(self.draft),
            {'title': 'Reviewed guide', 'is_published': True},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Reviewed guide')
        self.assertTrue(response.data['can_manage'])

    def test_publishing_and_unpublishing_changes_student_access(self):
        self.assertEqual(
            self.client.patch(
                self.url(self.draft), {'is_published': True}, format='json'
            ).status_code,
            200,
        )
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url(self.draft)).status_code, 200)
        self.client.force_authenticate(self.admin)
        self.client.patch(self.url(self.draft), {'is_published': False}, format='json')
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url(self.draft)).status_code, 404)

    def test_admin_cannot_spoof_owner_or_storage_metadata(self):
        response = self.client.post(
            self.base + 'resources/',
            {
                'title': 'Owned',
                'external_url': 'https://example.edu/resource',
                'created_by': self.staff.pk,
                'storage_path': '../../secret',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        resource = LibraryResource.objects.get(pk=response.data['id'])
        self.assertEqual(resource.created_by, self.admin)
        self.assertEqual(resource.storage_path, '')
        self.assertNotIn('storage_path', response.data)

    def test_optional_course_is_informational_and_requires_no_assignment(self):
        course = CourseCache.objects.create(
            course_external_id=4455, course_code='LIB', course_title='Library course'
        )
        payload = {
            'title': 'Optional course link',
            'external_url': 'https://example.edu/guide',
            'course': course.pk,
            'is_published': True,
        }
        response = self.client.post(self.base + 'resources/', payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.client.force_authenticate(self.student)
        self.assertEqual(
            self.client.get(f"{self.base}resources/{response.data['id']}/").status_code,
            200,
        )
        course.delete()
        self.assertIsNone(LibraryResource.objects.get(pk=response.data['id']).course_id)

    def test_admin_can_edit_a_resource_with_an_optional_course(self):
        course = CourseCache.objects.create(
            course_external_id=5566, course_code='LIB2', course_title='Former course'
        )
        self.draft.course = course
        self.draft.save()
        response = self.client.patch(
            self.url(self.draft),
            {'title': 'Updated independent guide', 'course': course.pk},
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['course'], course.pk)

    def test_search_category_type_status_scope_and_pagination(self):
        other = ResourceCategory.objects.create(name='Research')
        self.make_resource(
            title='Different title',
            tags=['citations'],
            category=other,
            is_published=True,
        )
        response = self.client.get(
            self.base + 'resources/',
            {
                'search': 'citations',
                'category': other.pk,
                'resource_type': 'link',
                'status': 'published',
            },
        )
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['title'], 'Different title')
        self.make_resource(created_by=self.other_staff, is_published=True)
        mine = self.client.get(
            self.base + 'resources/', {'scope': 'mine', 'status': 'draft'}
        )
        self.assertEqual(mine.data['count'], 1)
        for number in range(23):
            self.make_resource(title=f'Paginated resource {number}', is_published=True)
        first = self.client.get(self.base + 'resources/', {'status': 'published'})
        second = self.client.get(
            self.base + 'resources/', {'status': 'published', 'page': 2}
        )
        self.assertEqual(first.data['count'], 26)
        self.assertIsNotNone(first.data['next'])
        self.assertEqual(len(first.data['results']) + len(second.data['results']), 26)

    def test_invalid_queries_return_validation_errors(self):
        for params in (
            {'category': 'broken'},
            {'status': 'anything'},
            {'resource_type': 'script'},
        ):
            self.assertEqual(
                self.client.get(self.base + 'resources/', params).status_code, 400
            )

    def test_categories_are_case_insensitive_and_admin_managed(self):
        response = self.client.post(
            self.base + 'categories/', {'name': 'Research'}, format='json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            self.client.post(
                self.base + 'categories/', {'name': ' research '}, format='json'
            ).status_code,
            400,
        )
        category_url = f"{self.base}categories/{response.data['id']}/"
        self.client.force_authenticate(self.staff)
        self.assertEqual(
            self.client.patch(
                category_url, {'name': 'Rename'}, format='json'
            ).status_code,
            403,
        )
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.patch(
                category_url, {'name': 'References'}, format='json'
            ).status_code,
            200,
        )
        resource_category_url = f'{self.base}categories/{self.category.pk}/'
        self.assertEqual(self.client.delete(resource_category_url).status_code, 204)
        self.published.refresh_from_db()
        self.assertIsNone(self.published.category_id)

    def test_category_counts_do_not_reveal_private_drafts(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.base + 'categories/')
        self.assertEqual(response.data[0]['resource_count'], 1)
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.get(self.base + 'categories/').data[0]['resource_count'], 2
        )

    def test_validation_requires_content_and_checks_tags_and_urls(self):
        for payload in (
            {'title': 'Empty'},
            {'title': 'Unsafe', 'external_url': 'javascript:alert(1)'},
            {
                'title': 'Tags',
                'external_url': 'https://example.edu',
                'tags': ['x' * 41],
            },
            {
                'title': 'Tags',
                'external_url': 'https://example.edu',
                'tags': ['a'] * 11,
            },
        ):
            self.assertEqual(
                self.client.post(
                    self.base + 'resources/', payload, format='json'
                ).status_code,
                400,
            )

    def upload(self, filename='guide.pdf', published=False):
        response = self.client.post(
            self.base + 'resources/',
            {
                'title': 'File guide',
                'description': 'General resource',
                'category': '',
                'course': '',
                'tags': json.dumps(['research', 'study skills']),
                'is_published': str(published).lower(),
                'external_url': 'https://example.edu/reference',
                'file': SimpleUploadedFile(
                    filename, b'%PDF-1.4 resource file', content_type='application/pdf'
                ),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 201, response.data)
        return LibraryResource.objects.get(pk=response.data['id']), response.data

    def test_file_upload_preview_download_and_mixed_content(self):
        resource, data = self.upload(published=True)
        self.assertEqual(data['tags'], ['research', 'study skills'])
        self.assertEqual(data['external_url'], 'https://example.edu/reference')
        self.assertIn('/api/resource-library/resources/', data['file_url'])
        self.assertNotIn(resource.storage_path, data['file_url'])
        self.client.force_authenticate(self.student)
        response = self.client.get(self.url(resource) + 'file/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(response['Content-Disposition'].startswith('inline;'))
        self.assertNotIn('X-Frame-Options', response)
        self.assertIn(b'%PDF', b''.join(response.streaming_content))
        response.close()
        response = self.client.get(self.url(resource) + 'file/?download=1')
        self.assertTrue(response['Content-Disposition'].startswith('attachment;'))
        response.close()

    def test_private_files_and_raw_media_urls_enforce_the_same_access(self):
        resource, _ = self.upload()
        raw_url = '/media/' + resource.storage_path
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url(resource) + 'file/').status_code, 404)
        self.assertEqual(self.client.get(raw_url).status_code, 404)
        self.assertEqual(APIClient().get(raw_url).status_code, 401)
        self.client.force_authenticate(self.admin)
        response = self.client.get(raw_url)
        self.assertEqual(response.status_code, 200)
        response.close()
        self.client.patch(self.url(resource), {'is_published': True}, format='json')
        self.client.force_authenticate(self.student)
        response = self.client.get(raw_url)
        self.assertEqual(response.status_code, 200)
        response.close()

    def test_active_content_is_downloaded_instead_of_executed(self):
        resource, _ = self.upload(filename='guide.html', published=True)
        self.client.force_authenticate(self.student)
        response = self.client.get(self.url(resource) + 'file/')
        self.assertEqual(response['Content-Type'], 'application/octet-stream')
        self.assertTrue(response['Content-Disposition'].startswith('attachment;'))
        self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
        response.close()

    def test_replacement_and_delete_clean_up_storage_after_commit(self):
        resource, _ = self.upload()
        original = Path(self.directory.name, resource.storage_path)
        self.assertTrue(original.exists())
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.patch(
                self.url(resource),
                {
                    'file': SimpleUploadedFile('replacement.pdf', b'%PDF replacement'),
                },
                format='multipart',
            )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertFalse(original.exists())
        resource.refresh_from_db()
        replacement = Path(self.directory.name, resource.storage_path)
        self.assertTrue(replacement.exists())
        with self.captureOnCommitCallbacks(execute=True):
            self.assertEqual(self.client.delete(self.url(resource)).status_code, 204)
        self.assertFalse(replacement.exists())

    def test_failed_database_save_cleans_up_the_new_upload(self):
        with patch.object(
            LibraryResource, 'save', side_effect=RuntimeError('Database failure')
        ):
            with self.assertLogs('learning_resources.content.library', level='ERROR'):
                response = self.client.post(
                    self.base + 'resources/',
                    {
                        'title': 'Failed',
                        'file': SimpleUploadedFile('failed.pdf', b'%PDF'),
                    },
                    format='multipart',
                )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(list(Path(self.directory.name).rglob('*.pdf')), [])
        self.assertFalse(LibraryResource.objects.filter(title='Failed').exists())

    @override_settings(RESOURCE_LIBRARY_MAX_UPLOAD_SIZE_BYTES=3)
    def test_upload_size_limit_is_enforced_on_the_server(self):
        response = self.client.post(
            self.base + 'resources/',
            {
                'title': 'Oversized',
                'file': SimpleUploadedFile('large.pdf', b'too large'),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 400)

    def test_link_only_resources_and_youtube_references(self):
        response = self.client.post(
            self.base + 'resources/',
            {
                'title': 'Video reference',
                'external_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['resource_type'], 'video')
        self.assertIsNone(response.data['file_url'])
        self.assertEqual(
            self.client.get(
                f"{self.base}resources/{response.data['id']}/file/"
            ).status_code,
            404,
        )

    def test_unsupported_upload_backend_has_a_clear_error(self):
        with patch(
            'learning_resources.content.library_storage._get_configured_backend',
            return_value='youtube',
        ):
            response = self.client.post(
                self.base + 'resources/',
                {
                    'title': 'File',
                    'file': SimpleUploadedFile('guide.pdf', b'%PDF'),
                },
                format='multipart',
            )
        self.assertEqual(response.status_code, 400)
        self.assertIn('storage', str(response.data))

    def test_remote_storage_uses_private_uploads_and_authenticated_reads(self):
        storage = MagicMock()
        file_obj = SimpleUploadedFile('guide.pdf', b'%PDF')
        with patch(
            'learning_resources.content.library_storage._get_configured_backend',
            return_value='s3',
        ), patch(
            'learning_resources.content.library_storage.get_storage_engine',
            return_value=storage,
        ):
            uploaded = store_file(file_obj)
            arguments = storage._get_client.return_value.upload_fileobj.call_args
            self.assertNotIn('ACL', arguments.kwargs['ExtraArgs'])
            self.assertEqual(uploaded['storage_backend'], 's3')
            resource = self.make_resource(**uploaded)
            storage._get_client.return_value.get_object.return_value = {
                'Body': io.BytesIO(b'%PDF')
            }
            self.assertEqual(open_remote_file(resource).read(), b'%PDF')
        with patch(
            'learning_resources.content.library_storage._get_configured_backend',
            return_value='cloudinary',
        ), patch(
            'learning_resources.content.library_storage.get_storage_engine',
            return_value=storage,
        ), patch(
            'cloudinary.uploader.upload',
            return_value={'public_id': 'private/guide.pdf'},
        ) as upload:
            uploaded = store_file(SimpleUploadedFile('guide.pdf', b'%PDF'))
            self.assertEqual(upload.call_args.kwargs['type'], 'private')
            self.assertEqual(upload.call_args.kwargs['resource_type'], 'raw')
            self.assertEqual(uploaded['storage_path'], 'private/guide.pdf')

    def test_partial_updates_keep_nullable_metadata_in_the_response(self):
        resource = self.make_resource(category=None, course=None)
        response = self.client.patch(
            self.url(resource), {'is_published': True}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        for field in ('category_name', 'course_code', 'course_title'):
            self.assertIn(field, response.data)
            self.assertIsNone(response.data[field])
        resource.created_by = None
        resource.save()
        self.client.force_authenticate(self.admin)
        response = self.client.patch(
            self.url(resource), {'title': 'Reviewed'}, format='json'
        )
        self.assertEqual(response.data['created_by_name'], 'Former staff member')

    def test_cloudinary_reads_use_short_lived_private_urls(self):
        resource = self.make_resource(
            storage_backend='cloudinary', storage_path='library/guide.pdf'
        )
        response = MagicMock()
        response.raw = io.BytesIO(b'%PDF private')
        with patch(
            'learning_resources.content.library_storage.get_storage_engine'
        ), patch(
            'cloudinary.utils.private_download_url',
            return_value='https://example.test/signed',
        ) as signed, patch(
            'requests.get', return_value=response
        ) as get, patch(
            'learning_resources.content.library_storage.time.time', return_value=1000
        ):
            self.assertEqual(open_remote_file(resource).read(), b'%PDF private')
            signed.assert_called_once_with(
                'library/guide.pdf',
                None,
                resource_type='raw',
                type='private',
                expires_at=1060,
            )
            get.assert_called_once_with(
                'https://example.test/signed', stream=True, timeout=(5, 60)
            )
            response.raise_for_status.assert_called_once()

    def test_django_admin_single_and_bulk_deletes_remove_uploaded_files(self):
        from django.contrib import admin
        from .admin import LibraryResourceAdmin

        model_admin = LibraryResourceAdmin(LibraryResource, admin.site)
        for bulk in (False, True):
            response = self.client.post(
                self.base + 'resources/',
                {
                    'title': 'Admin cleanup',
                    'file': SimpleUploadedFile('guide.pdf', b'%PDF'),
                },
                format='multipart',
            )
            self.assertEqual(response.status_code, 201, response.data)
            resource = LibraryResource.objects.get(pk=response.data['id'])
            path = Path(self.directory.name, resource.storage_path)
            with self.captureOnCommitCallbacks(execute=True):
                if bulk:
                    model_admin.delete_queryset(
                        None, LibraryResource.objects.filter(pk=resource.pk)
                    )
                else:
                    model_admin.delete_model(None, resource)
            self.assertFalse(path.exists())

    def test_staff_cannot_manage_library_even_with_assignment_and_ownership(self):
        resource, _ = self.upload()
        resource.created_by = self.staff
        resource.save()
        course = CourseCache.objects.create(
            course_external_id=9900, course_code='LIB', course_title='Assigned course'
        )
        StaffAssignedCourse.objects.create(
            course=course,
            staff_external_id=self.staff.external_id,
            programme_type_code='ODEL',
            role='LECTURER',
        )
        self.client.force_authenticate(self.staff)
        self.assertEqual(self.client.get(self.base + 'resources/').data['count'], 1)
        self.assertFalse(self.client.get(self.url(self.published)).data['can_manage'])
        for private in (resource, self.draft):
            self.assertEqual(self.client.get(self.url(private)).status_code, 404)
        self.assertEqual(self.client.get(self.url(resource) + 'file/').status_code, 404)
        self.assertEqual(
            self.client.get('/media/' + resource.storage_path).status_code, 404
        )
        attempts = [
            self.client.post(
                self.base + 'resources/',
                {
                    'title': 'Forbidden',
                    'external_url': 'https://example.edu',
                    'course': course.pk,
                },
                format='json',
            ),
            self.client.post(
                self.base + 'resources/',
                {
                    'title': 'Forbidden file',
                    'file': SimpleUploadedFile('forbidden.pdf', b'%PDF'),
                },
                format='multipart',
            ),
            self.client.patch(
                self.url(self.published), {'title': 'Forbidden edit'}, format='json'
            ),
            self.client.patch(
                self.url(resource), {'is_published': True}, format='json'
            ),
            self.client.delete(self.url(self.published)),
            self.client.post(
                self.base + 'categories/', {'name': 'Forbidden'}, format='json'
            ),
            self.client.patch(
                f'{self.base}categories/{self.category.pk}/',
                {'name': 'Forbidden'},
                format='json',
            ),
            self.client.delete(f'{self.base}categories/{self.category.pk}/'),
        ]
        self.assertTrue(
            all(response.status_code == 403 for response in attempts),
            [response.status_code for response in attempts],
        )
        self.assertTrue(LibraryResource.objects.filter(pk=self.published.pk).exists())
        self.assertTrue(ResourceCategory.objects.filter(pk=self.category.pk).exists())
        self.assertFalse(
            LibraryResource.objects.filter(title__startswith='Forbidden').exists()
        )

    def test_library_staff_can_manage_the_shared_collection_without_admin_access(self):
        from portal_auth.oidc import sync_user_from_claims
        from .access import is_resource_admin

        library_staff = sync_user_from_claims(
            {
                'portal_user_id': 'library-officer',
                'name': 'Library Officer',
                'groups': ['PORTAL_USERS', 'PORTAL_STAFF', 'PORTAL_LIBRARY'],
            }
        )
        self.assertFalse(is_resource_admin(library_staff))
        self.client.force_authenticate(library_staff)
        self.assertEqual(self.client.get(self.base + 'resources/').data['count'], 2)
        detail = self.client.get(self.url(self.draft))
        self.assertEqual(detail.status_code, 200)
        self.assertTrue(detail.data['can_manage'])
        self.assertEqual(
            self.client.patch(
                self.url(self.draft), {'is_published': True}, format='json'
            ).status_code,
            200,
        )
        resource, _ = self.upload()
        self.assertEqual(resource.created_by, library_staff)
        response = self.client.get('/media/' + resource.storage_path)
        self.assertEqual(response.status_code, 200)
        response.close()
        category = self.client.post(
            self.base + 'categories/', {'name': 'Library references'}, format='json'
        )
        self.assertEqual(category.status_code, 201)
        category_url = f"{self.base}categories/{category.data['id']}/"
        self.assertEqual(
            self.client.patch(
                category_url, {'name': 'Reference guides'}, format='json'
            ).status_code,
            200,
        )
        self.assertEqual(self.client.delete(category_url).status_code, 204)
        self.assertEqual(self.client.delete(self.url(self.draft)).status_code, 204)

    def test_library_role_on_a_non_staff_account_does_not_allow_management(self):
        self.student.roles.append('LIBRARY')
        self.student.save()
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get(self.url(self.draft)).status_code, 404)
        self.assertFalse(self.client.get(self.url(self.published)).data['can_manage'])
        self.assertEqual(
            self.client.post(
                self.base + 'resources/',
                {'title': 'Forbidden', 'external_url': 'https://example.edu'},
                format='json',
            ).status_code,
            403,
        )

    def test_revoking_library_role_removes_draft_file_and_write_access(self):
        resource, _ = self.upload()
        self.staff.roles.append('LIBRARY')
        self.staff.save()
        self.client.force_authenticate(self.staff)
        response = self.client.get(self.url(resource) + 'file/')
        self.assertEqual(response.status_code, 200)
        response.close()
        self.staff.roles.remove('LIBRARY')
        self.staff.save()
        self.assertEqual(self.client.get(self.url(resource)).status_code, 404)
        self.assertEqual(self.client.get(self.url(resource) + 'file/').status_code, 404)
        self.assertEqual(
            self.client.get('/media/' + resource.storage_path).status_code, 404
        )
        self.assertEqual(
            self.client.patch(
                self.url(resource), {'is_published': True}, format='json'
            ).status_code,
            403,
        )
