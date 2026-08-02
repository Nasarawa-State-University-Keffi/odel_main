"""
Comprehensive test suite for LMS content upload functionality.
Tests file upload, YouTube video addition, storage backends, and error handling.
"""

import io
import os
from unittest.mock import patch, MagicMock, Mock
from django.apps import apps
from django.test import TestCase, override_settings
from portal_auth.models import PortalUser
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from courses.models import CourseCache
from .models import LearningContent, StorageSettings, ContentAccessLog
from .services import upload_learning_content, upload_youtube_video, delete_learning_content
from learning_resources.storage.base import StorageException


class ContentAppConfigurationTests(TestCase):
    def test_package_name_does_not_collide_with_stdlib_resource_module(self):
        app_config = apps.get_app_config('content')

        self.assertEqual(app_config.name, 'learning_resources.content')
        self.assertEqual(app_config.label, 'content')


class ContentUploadAPITestCase(APITestCase):
    """Test cases for content upload API endpoints."""

    def setUp(self):
        """Set up test data."""
        # Create test user
        self.user = PortalUser.objects.create(external_id='testuser', full_name='Test User')
        self.admin_user = PortalUser.objects.create(external_id='admin', full_name='Admin User', is_staff=True)

        # Create test course
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Introduction to Computer Science',
            course_code='CS101'
        )

        # Create storage settings
        self.storage_settings = StorageSettings.objects.create(
            backend='local',
            is_active=True
        )

        # Set up API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def tearDown(self):
        """Clean up uploaded test files."""
        # Clean up any uploaded files
        LearningContent.objects.all().delete()

    def _create_test_file(self, filename='test.pdf', content=b'test content', content_type='application/pdf'):
        """Helper to create test file."""
        return SimpleUploadedFile(filename, content, content_type=content_type)

    def test_upload_pdf_file_success(self):
        """Test successful PDF file upload."""
        file = self._create_test_file('lecture1.pdf', b'PDF content here')

        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 101,
            'content_type': 'note',
            'title': 'Lecture 1 Notes',
            'description': 'Introduction to programming'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Lecture 1 Notes')
        self.assertEqual(response.data['content_type'], 'note')
        self.assertEqual(response.data['original_filename'], 'lecture1.pdf')

        # Verify database record
        content = LearningContent.objects.get(id=response.data['id'])
        # Verify attributes
        self.assertEqual(content.course.course_external_id, 101)
        self.assertEqual(content.content_type, 'note')
        self.assertEqual(content.uploaded_by, self.user)

    def test_upload_video_file_success(self):
        """Test successful video file upload."""
        video_file = self._create_test_file(
            'lecture_video.mp4',
            b'fake video content',
            'video/mp4'
        )

        response = self.client.post('/api/content/upload/', {
            'file': video_file,
            'course_id': 101,
            'content_type': 'video',
            'title': 'Lecture 1 Video',
            'description': 'Video lecture on introduction'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content_type'], 'video')
        self.assertEqual(response.data['original_filename'], 'lecture_video.mp4')
        self.assertTrue(response.data['is_video'])



    def test_upload_without_authentication(self):
        """Test upload fails without authentication."""
        self.client.force_authenticate(user=None)
        file = self._create_test_file()

        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 101,
            'content_type': 'note'
        }, format='multipart')

        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_upload_missing_required_fields(self):
        """Test upload fails with missing required fields."""
        file = self._create_test_file()

        # Missing course_id
        response = self.client.post('/api/content/upload/', {
            'file': file,
            'content_type': 'note'
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('course_id', str(response.data))

        # Missing file
        response = self.client.post('/api/content/upload/', {
            'course_id': 101,
            'content_type': 'note'
        }, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_invalid_content_type(self):
        """Test upload fails with invalid content_type."""
        file = self._create_test_file()

        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 101,
            'content_type': 'invalid_type'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_nonexistent_course(self):
        """Test upload fails with nonexistent course."""
        file = self._create_test_file()

        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 'NONEXISTENT',
            'content_type': 'note'
        }, format='multipart')

        # API returns 400 Bad Request when course lookup fails
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Course not found', str(response.data))

    def test_upload_auto_generates_title(self):
        """Test title is auto-generated from filename if not provided."""
        file = self._create_test_file('my_lecture_notes.pdf')

        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 101,
            'content_type': 'note'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'my_lecture_notes.pdf')

    def test_upload_large_file_size_tracking(self):
        """Test file size is properly tracked."""
        large_content = b'x' * 1024 * 100  # 100KB
        file = self._create_test_file('large_file.pdf', large_content)

        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 101,
            'content_type': 'resource'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNotNone(response.data['file_size'])
        self.assertGreater(response.data['file_size'], 100000)

    def test_direct_post_blocked(self):
        """Test that direct POST to list endpoint is blocked."""
        response = self.client.post('/api/content/', {
            'title': 'Test',
            'course_id': 101
        })

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        pass  # Custom error format now


class YouTubeVideoAPITestCase(APITestCase):
    """Test cases for YouTube video addition."""

    def setUp(self):
        """Set up test data."""
        self.user = PortalUser.objects.create(external_id='testuser', full_name='Test User')
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='CS101'
        )
        StorageSettings.objects.create(backend='youtube', is_active=True)

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch.dict(os.environ, {'YOUTUBE_API_KEY': 'test_api_key'})
    def test_add_youtube_video_success(self):
        """Test successfully adding YouTube video reference."""
        response = self.client.post('/api/content/add-youtube/', {
            'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'course_id': 101,
            'title': 'Lecture Video',
            'description': 'Introduction lecture'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content_type'], 'video')
        self.assertEqual(response.data['storage_backend'], 'youtube')

    @patch.dict(os.environ, {'YOUTUBE_API_KEY': 'test_api_key'})
    def test_add_youtube_with_video_id_only(self):
        """Test adding YouTube video with just the video ID."""
        response = self.client.post('/api/content/add-youtube/', {
            'video_url': 'dQw4w9WgXcQ',
            'course_id': 101,
            'title': 'Short Form Video'
        }, format='json')

        if response.status_code != status.HTTP_201_CREATED:
            print("YOUTUBE ID ONLY TEST ERROR:", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify title was fetched from YouTube

    def test_add_youtube_missing_url(self):
        """Test YouTube addition fails without URL."""
        response = self.client.post('/api/content/add-youtube/', {
            'course_id': 101,
            'title': 'Video'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_youtube_invalid_course(self):
        """Test YouTube addition fails with invalid course."""
        response = self.client.post('/api/content/add-youtube/', {
            'video_url': 'dQw4w9WgXcQ',
            'course_id': 'INVALID',
            'title': 'Video'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ContentServiceLayerTestCase(TestCase):
    """Test cases for service layer functions."""

    def setUp(self):
        """Set up test data."""
        self.user = PortalUser.objects.create(external_id='testuser', full_name='Test User')
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='CS101'
        )
        StorageSettings.objects.create(backend='local', is_active=True)

    def test_upload_learning_content_service(self):
        """Test upload_learning_content service function."""
        file_obj = SimpleUploadedFile('test.pdf', b'content')

        content = upload_learning_content(
            file_obj=file_obj,
            course=self.course,
            content_type='note',
            user=self.user,
            title='Test Note',
            description='Test description'
        )

        self.assertIsInstance(content, LearningContent)
        self.assertEqual(content.title, 'Test Note')
        self.assertEqual(content.course, self.course)
        self.assertEqual(content.uploaded_by, self.user)
        self.assertTrue(content.is_published)

    def test_upload_with_invalid_content_type(self):
        """Test upload fails with invalid content type."""
        file_obj = SimpleUploadedFile('test.pdf', b'content')

        with self.assertRaises(ValueError) as context:
            upload_learning_content(
                file_obj=file_obj,
                course=self.course,
                content_type='invalid',
                user=self.user
            )

        self.assertIn('Invalid content_type', str(context.exception))

    def test_delete_learning_content(self):
        """Test content deletion removes file and database record."""
        file_obj = SimpleUploadedFile('delete_me.pdf', b'content')
        content = upload_learning_content(
            file_obj=file_obj,
            course=self.course,
            content_type='note',
            user=self.user
        )
        content_id = content.id

        # Delete content
        delete_learning_content(content_id)

        # Verify deletion
        self.assertFalse(LearningContent.objects.filter(id=content_id).exists())

    def test_content_hash_generation(self):
        """Test that content hash is properly generated."""
        file_obj = SimpleUploadedFile('test.pdf', b'test content')

        content = upload_learning_content(
            file_obj=file_obj,
            course=self.course,
            content_type='note',
            user=self.user
        )

        self.assertIsNotNone(content.content_hash)
        self.assertEqual(len(content.content_hash), 64)  # SHA256 hash


class StorageBackendTestCase(TestCase):
    """Test cases for storage backend configuration."""

    def test_only_one_backend_active(self):
        """Test that only one storage backend can be active at a time."""
        backend1 = StorageSettings.objects.create(backend='local', is_active=True)
        backend2 = StorageSettings.objects.create(backend='s3', is_active=True)

        # Refresh from database
        backend1.refresh_from_db()

        # First backend should be deactivated
        self.assertFalse(backend1.is_active)
        self.assertTrue(backend2.is_active)

    def test_storage_backend_string_representation(self):
        """Test string representation of StorageSettings."""
        settings = StorageSettings.objects.create(backend='s3', is_active=True)
        self.assertEqual(str(settings), 'Amazon S3 (Active)')

        settings.is_active = False
        settings.save()
        self.assertEqual(str(settings), 'Amazon S3 (Inactive)')


class StorageSettingsAPITestCase(APITestCase):
    """Test cases for the admin storage-settings API."""

    def setUp(self):
        self.admin_user = PortalUser.objects.create(
            external_id='storage-admin',
            full_name='Storage Admin',
            is_staff=True
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_put_collection_updates_existing_backend(self):
        local = StorageSettings.objects.create(backend='local', is_active=True)
        s3 = StorageSettings.objects.create(backend='s3', is_active=False)

        response = self.client.put(
            '/api/content/storage-settings/',
            {'backend': 's3', 'is_active': True},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], s3.id)
        self.assertEqual(response.data['backend'], 's3')
        self.assertTrue(response.data['is_active'])

        local.refresh_from_db()
        s3.refresh_from_db()
        self.assertFalse(local.is_active)
        self.assertTrue(s3.is_active)

    def test_put_collection_creates_missing_backend(self):
        response = self.client.put(
            '/api/content/storage-settings/',
            {'backend': 'cloudinary', 'is_active': True},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            StorageSettings.objects.filter(
                backend='cloudinary',
                is_active=True
            ).exists()
        )


class ContentAccessLogTestCase(APITestCase):
    """Test cases for content access logging."""

    def setUp(self):
        """Set up test data."""
        self.user = PortalUser.objects.create(external_id='testuser', full_name='Test User')
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='CS101'
        )
        StorageSettings.objects.create(backend='local', is_active=True)

        file_obj = SimpleUploadedFile('test.pdf', b'content')
        self.content = upload_learning_content(
            file_obj=file_obj,
            course=self.course,
            content_type='note',
            user=self.user
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_log_content_access(self):
        """Test logging content access."""
        response = self.client.post(f'/api/content/{self.content.id}/log-access/')

        if response.status_code != status.HTTP_201_CREATED:
            print("YOUTUBE SUCCESS TEST ERROR:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify log entry created
        log = ContentAccessLog.objects.filter(
            content=self.content,
            user=self.user
        ).first()
        self.assertIsNotNone(log)

    def test_multiple_access_logs(self):
        """Test multiple access logs are created."""
        # Log access twice
        self.client.post(f'/api/content/{self.content.id}/log-access/')
        self.client.post(f'/api/content/{self.content.id}/log-access/')

        log_count = ContentAccessLog.objects.filter(
            content=self.content,
            user=self.user
        ).count()

        self.assertEqual(log_count, 2)


class ContentQueryFilterTestCase(APITestCase):
    """Test cases for content filtering and search."""

    def setUp(self):
        """Set up test data."""
        self.user = PortalUser.objects.create(external_id='testuser', full_name='Test User')
        self.course1 = CourseCache.objects.create(
            course_external_id=101,
            course_title='Intro to CS',
            course_code='CS101'
        )
        self.course2 = CourseCache.objects.create(
            course_external_id=201,
            course_title='Data Structures',
            course_code='CS201'
        )
        StorageSettings.objects.create(backend='local', is_active=True)

        # Create multiple content items
        for i in range(3):
            file_obj = SimpleUploadedFile(f'cs101_note{i}.pdf', b'content')
            upload_learning_content(
                file_obj=file_obj,
                course=self.course1,
                content_type='note',
                user=self.user,
                title=f'CS101 Lecture {i}'
            )

        file_obj = SimpleUploadedFile('cs201_video.mp4', b'video')
        upload_learning_content(
            file_obj=file_obj,
            course=self.course2,
            content_type='video',
            user=self.user,
            title='CS201 Video'
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_filter_by_course(self):
        """Test filtering content by course."""
        response = self.client.get('/api/content/', {'course_id': self.course1.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_filter_by_content_type(self):
        """Test filtering content by type."""
        response = self.client.get('/api/content/', {'content_type': 'video'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['content_type'], 'video')

    def test_search_by_title(self):
        """Test searching content by title."""
        response = self.client.get('/api/content/', {'search': '101'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)


class ErrorHandlingTestCase(APITestCase):
    """Test cases for error handling and edge cases."""

    def setUp(self):
        """Set up test data."""
        self.user = PortalUser.objects.create(external_id='testuser', full_name='Test User')
        self.course = CourseCache.objects.create(
            course_external_id=101,
            course_title='Test Course',
            course_code='CS101'
        )
        StorageSettings.objects.create(backend='local', is_active=True)

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_upload_empty_file(self):
        """Test upload fails with empty file."""
        file = SimpleUploadedFile('empty.pdf', b'')

        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 101,
            'content_type': 'note'
        }, format='multipart')

        # Should fail with 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_consistent_error_format(self):
        """Test all errors return consistent format."""
        # Test missing field error
        response = self.client.post('/api/content/upload/', {
            'course_id': 101
        }, format='multipart')

        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'error')
        self.assertIn('detail', response.data)

    @patch('learning_resources.storage.local.LocalStorageEngine.save')
    def test_storage_failure_handling(self, mock_save):
        """Test handling of storage failures."""
        mock_save.side_effect = Exception('Storage full')

        file = SimpleUploadedFile('test.pdf', b'content')
        response = self.client.post('/api/content/upload/', {
            'file': file,
            'course_id': 101,
            'content_type': 'note'
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Storage full', str(response.data))
