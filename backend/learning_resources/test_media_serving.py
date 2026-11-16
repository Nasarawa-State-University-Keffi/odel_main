import os
import tempfile
from pathlib import Path
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate
from courses.models import CourseCache
from portal_auth.models import PortalUser
from learning_resources.content.models import LearningContent

from learning_resources.media_views import serve_media


class MediaServeViewTestCase(TestCase):
    """Test suite for media serving view."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = PortalUser.objects.create(external_id='media-staff', full_name='Staff', is_staff=True)
        self.course = CourseCache.objects.create(course_external_id=808, course_code='MEDIA', course_title='Media')
        self.temp_dir = tempfile.TemporaryDirectory()
        self.media_root = Path(self.temp_dir.name)

    def request(self, url):
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        return request

    def add_content(self, path):
        LearningContent.objects.create(
            course=self.course, title='Media', storage_backend='local',
            storage_path=path, original_filename=Path(path).name,
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_serve_pdf_returns_inline_and_application_pdf(self):
        """Test that PDF files are served with Content-Disposition: inline and Content-Type: application/pdf."""
        pdf_file = self.media_root / "courses" / "sample_lecture.pdf"
        pdf_file.parent.mkdir(parents=True, exist_ok=True)
        pdf_file.write_bytes(b"%PDF-1.4 sample pdf content")
        self.add_content("courses/sample_lecture.pdf")

        with override_settings(MEDIA_ROOT=str(self.media_root)):
            request = self.request("/media/courses/sample_lecture.pdf")
            response = serve_media(request, "courses/sample_lecture.pdf", document_root=str(self.media_root))

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "application/pdf")
            self.assertEqual(response["Content-Disposition"], 'inline; filename="sample_lecture.pdf"')
            self.assertIn(b"%PDF-1.4", b"".join(response.streaming_content))
            response.close()

    def test_serve_image_returns_inline_and_image_content_type(self):
        """Test that images are served inline with image MIME type."""
        img_file = self.media_root / "test.png"
        img_file.write_bytes(b"\x89PNG\r\n\x1a\n")
        self.add_content("test.png")

        with override_settings(MEDIA_ROOT=str(self.media_root)):
            request = self.request("/media/test.png")
            response = serve_media(request, "test.png", document_root=str(self.media_root))

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "image/png")
            self.assertEqual(response["Content-Disposition"], 'inline; filename="test.png"')
            response.close()

    def test_missing_file_raises_404(self):
        """Test that requesting a nonexistent file raises Http404."""
        with override_settings(MEDIA_ROOT=str(self.media_root)):
            request = self.request("/media/nonexistent.pdf")
            response = serve_media(request, "nonexistent.pdf", document_root=str(self.media_root))
            self.assertEqual(response.status_code, 404)

    def test_directory_traversal_blocked(self):
        """Test that directory traversal attempts raise Http404."""
        with override_settings(MEDIA_ROOT=str(self.media_root)):
            request = self.request("/media/../../secret.txt")
            response = serve_media(request, "../../secret.txt", document_root=str(self.media_root))
            self.assertEqual(response.status_code, 404)
