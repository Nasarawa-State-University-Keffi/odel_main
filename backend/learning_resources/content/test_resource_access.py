"""Regressions for resource visibility, teaching assignments, and local delivery."""

import tempfile
from datetime import timedelta
from pathlib import Path

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient

from courses.models import (
    AcademicSession,
    CourseCache,
    CourseOffering,
    Semester,
    StaffAssignedCourse,
    StudentRegisteredCourse,
)
from portal_auth.models import PortalUser
from learning_resources.content.models import CourseModule, LearningContent


class ResourceAccessTests(APITestCase):
    def setUp(self):
        self.staff = PortalUser.objects.create(
            external_id='teacher', full_name='Teacher', is_staff=True, roles=['STAFF']
        )
        self.other_staff = PortalUser.objects.create(
            external_id='other-teacher',
            full_name='Other teacher',
            is_staff=True,
            roles=['STAFF'],
        )
        self.student = PortalUser.objects.create(
            external_id='student', full_name='Student', roles=['STUDENT']
        )
        self.outsider = PortalUser.objects.create(
            external_id='outsider', full_name='Outsider', roles=['STUDENT']
        )
        self.admin = PortalUser.objects.create(
            external_id='admin', full_name='Admin', is_staff=True, roles=['ADMIN']
        )
        self.course = CourseCache.objects.create(
            course_external_id=987, course_code='RES987', course_title='Resources'
        )
        self.session = AcademicSession.objects.create(name='2025/2026')
        self.old_session = AcademicSession.objects.create(name='2024/2025')
        self.semester = Semester.objects.create(name='First')
        self.offering = CourseOffering.objects.create(
            course=self.course,
            session=self.session,
            semester=self.semester,
            programme_type_code='ODEL',
        )
        StudentRegisteredCourse.objects.create(
            student_external=self.student,
            course=self.course,
            course_offering=self.offering,
            session=self.session.name,
            semester=self.semester.name,
        )
        StaffAssignedCourse.objects.create(
            staff_external_id=self.staff.external_id,
            course=self.course,
            course_offering=self.offering,
            programme_type_code='ODEL',
            role='LECTURER',
        )
        self.module = self.make_module()
        self.lesson = self.make_lesson(self.module)
        self.period = {'session': self.session.name, 'semester': self.semester.name}
        self.client.force_authenticate(self.student)

    def make_module(self, **overrides):
        values = dict(
            course=self.course,
            programme_type_code='ODEL',
            session=self.session.name,
            semester=self.semester.name,
            title='Module',
            is_published=True,
            created_by=self.staff,
        )
        values.update(overrides)
        return CourseModule.objects.create(**values)

    def make_lesson(self, module, **overrides):
        values = dict(
            course=self.course,
            module=module,
            title='Lesson',
            text_content='Notes',
            storage_backend='text',
            storage_path='',
            original_filename='lesson',
            is_published=True,
            uploaded_by=self.staff,
        )
        values.update(overrides)
        return LearningContent.objects.create(**values)

    def test_unenrolled_student_cannot_read_published_or_draft_lessons(self):
        draft = self.make_lesson(self.module, is_published=False)
        self.client.force_authenticate(self.outsider)
        for lesson in (self.lesson, draft):
            self.assertEqual(
                self.client.get(f'/api/content/{lesson.id}/').status_code, 404
            )
        response = self.client.get(
            f'/api/content/course/{self.course.course_external_id}/'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 0)

    def test_library_enforces_module_period_programme_and_availability(self):
        for overrides in (
            {'session': self.old_session.name},
            {'programme_type_code': 'REGULAR'},
            {'is_published': False},
            {'available_from': timezone.now() + timedelta(days=1)},
            {'available_until': timezone.now() - timedelta(days=1)},
        ):
            self.make_lesson(self.make_module(**overrides), title='Restricted')
        self.make_lesson(self.module, is_published=False, title='Draft lesson')
        legacy = self.make_lesson(
            self.make_module(programme_type_code='', session='', semester=''),
            title='Legacy',
        )
        ungrouped = self.make_lesson(None, title='Ungrouped')
        response = self.client.get('/api/content/', self.period)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {row['id'] for row in response.data['results']},
            {str(self.lesson.id), str(legacy.id), str(ungrouped.id)},
        )

    def test_direct_reader_discussion_and_logs_enforce_visibility(self):
        for overrides in (
            {'is_published': False},
            {'session': self.old_session.name},
            {'programme_type_code': 'REGULAR'},
            {'available_from': timezone.now() + timedelta(days=1)},
        ):
            lesson = self.make_lesson(self.make_module(**overrides))
            self.assertEqual(
                self.client.get(f'/api/content/{lesson.id}/').status_code, 404
            )
            self.assertEqual(
                self.client.get(f'/api/content/{lesson.id}/discussion/').status_code,
                404,
            )
            self.assertEqual(
                self.client.post(f'/api/content/{lesson.id}/log-access/').status_code,
                404,
            )
        self.assertEqual(
            self.client.get(f'/api/content/{self.lesson.id}/').status_code, 200
        )

    def test_module_endpoint_without_period_still_checks_exact_enrollment(self):
        self.make_module(session=self.old_session.name)
        self.make_module(programme_type_code='REGULAR')
        response = self.client.get(
            f'/api/content/course/{self.course.course_external_id}/modules/'
        )
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.module.id))

    def test_unresolved_registration_only_sees_legacy_material(self):
        StudentRegisteredCourse.objects.filter(student_external=self.student).update(
            course_offering=None
        )
        response = self.client.get('/api/content/', self.period)
        self.assertEqual(response.data['count'], 0)
        self.make_lesson(
            self.make_module(programme_type_code='', session='', semester='')
        )
        self.assertEqual(self.client.get('/api/content/', self.period).data['count'], 1)

    def test_unassigned_staff_cannot_create_update_delete_or_upload(self):
        self.client.force_authenticate(self.other_staff)
        module_url = f'/api/content/modules/{self.module.id}/'
        lesson_url = f'/api/content/{self.lesson.id}/'
        self.assertEqual(
            self.client.patch(
                module_url, {'title': 'Changed'}, format='json'
            ).status_code,
            403,
        )
        self.assertEqual(self.client.delete(module_url).status_code, 403)
        self.assertEqual(
            self.client.patch(
                lesson_url, {'title': 'Changed'}, format='json'
            ).status_code,
            403,
        )
        self.assertEqual(self.client.delete(lesson_url).status_code, 403)
        self.assertEqual(
            self.client.post(
                '/api/content/',
                {
                    'course_id': self.course.course_external_id,
                    'module_id': str(self.module.id),
                    'title': 'Added',
                    'text_content': 'Notes',
                },
                format='json',
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.post(
                '/api/content/modules/',
                {
                    'course_id': self.course.course_external_id,
                    'title': 'Added',
                    'programme_type_code': 'ODEL',
                    **self.period,
                },
                format='json',
            ).status_code,
            403,
        )

    def test_assigned_staff_can_manage_current_period_but_not_other_periods(self):
        self.client.force_authenticate(self.staff)
        self.assertEqual(
            self.client.patch(
                f'/api/content/modules/{self.module.id}/',
                {'title': 'Updated'},
                format='json',
            ).status_code,
            200,
        )
        old_module = self.make_module(session=self.old_session.name)
        self.assertEqual(
            self.client.patch(
                f'/api/content/modules/{old_module.id}/',
                {'title': 'Changed'},
                format='json',
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/content/modules/{self.module.id}/',
                {'session': self.old_session.name},
                format='json',
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/content/{self.lesson.id}/',
                {'module': str(old_module.id)},
                format='json',
            ).status_code,
            403,
        )

    def test_administrators_can_manage_resources_without_teaching_assignment(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.patch(
                f'/api/content/modules/{self.module.id}/',
                {'title': 'Admin update'},
                format='json',
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.patch(
                f'/api/content/{self.lesson.id}/',
                {'title': 'Admin update'},
                format='json',
            ).status_code,
            200,
        )

    def test_copy_requires_target_assignment_and_keeps_source_reusable(self):
        self.module.delete()
        source = self.make_module(
            session=self.old_session.name, created_by=self.other_staff
        )
        self.make_lesson(source)
        payload = dict(
            course_id=self.course.course_external_id,
            programme_type_code='ODEL',
            source_programme_type_code='ODEL',
            source_session=self.old_session.name,
            source_semester=self.semester.name,
            **self.period,
        )
        self.client.force_authenticate(self.other_staff)
        self.assertEqual(
            self.client.post(
                '/api/content/modules/copy/', payload, format='json'
            ).status_code,
            403,
        )
        self.client.force_authenticate(self.staff)
        response = self.client.post(
            '/api/content/modules/copy/', payload, format='json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['content_count'], 1)

    def test_anonymous_media_is_rejected_and_safe_documents_remain_inline(self):
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            Path(directory, 'lesson.pdf').write_bytes(b'%PDF-1.4')
            self.lesson.storage_backend = 'local'
            self.lesson.storage_path = 'lesson.pdf'
            self.lesson.save()
            self.assertEqual(APIClient().get('/media/lesson.pdf').status_code, 401)
            response = self.client.get('/media/lesson.pdf')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['Content-Type'], 'application/pdf')
            self.assertTrue(response['Content-Disposition'].startswith('inline;'))
            self.assertEqual(response['Cache-Control'], 'private, no-store')
            response.close()
            self.client.force_authenticate(self.outsider)
            self.assertEqual(self.client.get('/media/lesson.pdf').status_code, 404)

    def test_media_rechecks_publication_and_blocks_active_content(self):
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            Path(directory, 'lesson.html').write_text('<script>alert(1)</script>')
            self.lesson.storage_backend = 'local'
            self.lesson.storage_path = 'lesson.html'
            self.lesson.save()
            response = self.client.get('/media/lesson.html')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['Content-Type'], 'application/octet-stream')
            self.assertTrue(response['Content-Disposition'].startswith('attachment;'))
            self.assertEqual(response['X-Content-Type-Options'], 'nosniff')
            response.close()
            self.module.is_published = False
            self.module.save()
            self.assertEqual(self.client.get('/media/lesson.html').status_code, 404)

    def test_shared_file_is_visible_when_one_copy_is_available(self):
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            Path(directory, 'shared.pdf').write_bytes(b'%PDF-1.4')
            hidden = self.make_module(is_published=False)
            self.make_lesson(hidden, storage_backend='local', storage_path='shared.pdf')
            self.make_lesson(
                self.module, storage_backend='local', storage_path='shared.pdf'
            )
            response = self.client.get('/media/shared.pdf')
            self.assertEqual(response.status_code, 200)
            response.close()

    def test_mixed_lesson_preserves_file_and_external_link(self):
        self.client.force_authenticate(self.staff)
        from django.core.files.uploadedfile import SimpleUploadedFile
        from unittest.mock import patch, MagicMock

        with patch('learning_resources.content.services.get_storage_engine') as engine:
            engine.return_value = MagicMock()
            engine.return_value.save.return_value = 'note.pdf'
            response = self.client.post(
                '/api/content/',
                dict(
                    course_id=self.course.course_external_id,
                    module_id=str(self.module.id),
                    title='Mixed',
                    text_content='Notes',
                    url='https://example.edu/reference',
                    file=SimpleUploadedFile('note.pdf', b'%PDF'),
                ),
                format='multipart',
            )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['url'].endswith('/media/note.pdf'))
        self.assertEqual(response.data['external_url'], 'https://example.edu/reference')

    def test_module_api_exposes_all_pages(self):
        for index in range(24):
            self.make_module(title=f'Module {index}', order=index + 1)
        url = f'/api/content/course/{self.course.course_external_id}/modules/'
        first = self.client.get(url, self.period)
        second = self.client.get(url, {**self.period, 'page': 2})
        self.assertEqual(first.data['count'], 25)
        self.assertIsNotNone(first.data['next'])
        self.assertEqual(len(first.data['results']) + len(second.data['results']), 25)

    def test_media_works_with_the_real_portal_session(self):
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            Path(directory, 'session.pdf').write_bytes(b'%PDF-1.4')
            self.make_lesson(
                self.module, storage_backend='local', storage_path='session.pdf'
            )
            client = APIClient()
            session = client.session
            session['portal_user_id'] = self.student.id
            session.save()
            response = client.get('/media/session.pdf')
            self.assertEqual(response.status_code, 200)
            response.close()

    def test_legacy_enrollment_can_resolve_programme_from_student_profile(self):
        from synchronization.models import ProgrammeType, Faculty, Department, Programme

        programme_type = ProgrammeType.objects.create(
            up_stream_id=1, name='Distance', code='ODEL'
        )
        faculty = Faculty.objects.create(up_stream_id=1, name='Science', code='SCI')
        department = Department.objects.create(
            up_stream_id=1, name='Computing', code='CSC', faculty=faculty
        )
        programme = Programme.objects.create(
            up_stream_id=1,
            name='Computing',
            code='CSC',
            department=department,
            programme_type=programme_type,
        )
        self.student.programme = programme
        self.student.save()
        StudentRegisteredCourse.objects.filter(student_external=self.student).update(
            course_offering=None
        )
        self.make_lesson(
            self.make_module(programme_type_code='REGULAR'), title='Another programme'
        )
        response = self.client.get('/api/content/', self.period)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.lesson.id))

    def test_group_and_forum_files_keep_their_membership_boundaries(self):
        from learning_resources.content.models import (
            StudyGroup,
            StudyGroupMaterial,
            StudyGroupMembership,
            Forum,
            ForumPost,
            ForumMembership,
        )

        group = StudyGroup.objects.create(
            course=self.course,
            session=self.session.name,
            semester=self.semester.name,
            name='Study',
            join_code='RESOURCE',
        )
        StudyGroupMembership.objects.create(
            group=group, user=self.student, role='owner'
        )
        StudyGroupMaterial.objects.create(
            group=group,
            title='Shared',
            storage_path='group.pdf',
            storage_backend='local',
        )
        forum = Forum.objects.create(name='Forum', created_by=self.staff)
        ForumMembership.objects.create(forum=forum, user=self.student)
        ForumPost.objects.create(
            forum=forum,
            author=self.student,
            body='Shared',
            storage_path='forum.pdf',
            storage_backend='local',
        )
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            for filename in ('group.pdf', 'forum.pdf'):
                Path(directory, filename).write_bytes(b'%PDF-1.4')
                response = self.client.get('/media/' + filename)
                self.assertEqual(response.status_code, 200)
                response.close()
            self.client.force_authenticate(self.outsider)
            self.assertEqual(self.client.get('/media/group.pdf').status_code, 404)
            self.assertEqual(self.client.get('/media/forum.pdf').status_code, 404)
            self.client.force_authenticate(self.student)
            StudentRegisteredCourse.objects.filter(
                student_external=self.student
            ).delete()
            self.assertEqual(self.client.get('/media/group.pdf').status_code, 404)

    def test_assignment_files_and_submissions_keep_their_access_boundaries(self):
        from assessment.models import (
            Assignment,
            AssignmentContent,
            AssignmentSubmission,
            AssignmentSubmissionFile,
        )

        assignment = Assignment.objects.create(
            course=self.course,
            title='Work',
            open_at=timezone.now(),
            due_at=timezone.now() + timedelta(days=1),
            created_by=self.staff,
            is_published=True,
        )
        attachment = AssignmentContent.objects.create(
            assignment=assignment,
            content_type='instruction',
            title='Instructions',
            storage_path='instructions.pdf',
            original_filename='instructions.pdf',
        )
        submission = AssignmentSubmission.objects.create(
            assignment=assignment, student_external=self.student, attempt_number=1
        )
        AssignmentSubmissionFile.objects.create(
            submission=submission,
            storage_path='submission.pdf',
            original_filename='submission.pdf',
            file_size=8,
            mime_type='application/pdf',
        )
        with tempfile.TemporaryDirectory() as directory, override_settings(
            MEDIA_ROOT=directory
        ):
            for filename in ('instructions.pdf', 'submission.pdf'):
                Path(directory, filename).write_bytes(b'%PDF-1.4')
                for user in (self.student, self.staff):
                    self.client.force_authenticate(user)
                    response = self.client.get('/media/' + filename)
                    self.assertEqual(response.status_code, 200)
                    response.close()
                self.client.force_authenticate(self.outsider)
                self.assertEqual(self.client.get('/media/' + filename).status_code, 404)
            self.client.force_authenticate(self.student)
            attachment.is_published = False
            attachment.save()
            self.assertEqual(
                self.client.get('/media/instructions.pdf').status_code, 404
            )

    def test_file_and_youtube_upload_endpoints_require_assignment(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.force_authenticate(self.other_staff)
        response = self.client.post(
            '/api/content/upload/',
            {
                'course_id': self.course.course_external_id,
                'module_id': str(self.module.id),
                'file': SimpleUploadedFile('file.pdf', b'%PDF'),
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, 403)
        response = self.client.post(
            '/api/content/add-youtube/',
            {
                'course_id': self.course.course_external_id,
                'module_id': str(self.module.id),
                'video_url': 'dQw4w9WgXcQ',
                'title': 'Video',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_teaching_period_context_cannot_be_removed_from_existing_material(self):
        self.client.force_authenticate(self.staff)
        legacy = self.make_module(programme_type_code='', session='', semester='')
        for target in (None, str(legacy.id)):
            response = self.client.patch(
                f'/api/content/{self.lesson.id}/',
                {'module': target},
                format='json',
            )
            self.assertEqual(response.status_code, 400)
        response = self.client.patch(
            f'/api/content/modules/{self.module.id}/',
            {'programme_type_code': '', 'session': '', 'semester': ''},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_deleting_a_module_cannot_turn_scoped_lessons_into_global_material(self):
        self.client.force_authenticate(self.staff)
        response = self.client.delete(f'/api/content/modules/{self.module.id}/')
        self.assertEqual(response.status_code, 400)
        self.lesson.refresh_from_db()
        self.assertEqual(self.lesson.module_id, self.module.id)
        self.lesson.delete()
        self.assertEqual(
            self.client.delete(f'/api/content/modules/{self.module.id}/').status_code,
            204,
        )
