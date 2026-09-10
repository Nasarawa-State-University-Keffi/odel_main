from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assessment.models import Assignment, Quiz
from courses.models import (
    AcademicSession,
    CourseCache,
    Semester,
    StudentRegisteredCourse,
)
from portal_auth.exceptions import PortalLMSUnavailable
from portal_auth.models import PortalUser


class InstructorDashboardErrorTests(TestCase):
    def setUp(self):
        self.staff = PortalUser.objects.create(
            external_id='SS0001',
            full_name='Staff User',
            roles=['STAFF'],
            is_staff=True,
        )
        AcademicSession.objects.create(name='2025/2026')
        Semester.objects.create(name='First Semester')
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    @patch('dashboard.views.get_or_sync_staff_registered_courses')
    def test_portal_failure_is_returned_as_bad_gateway(self, sync_courses):
        sync_courses.side_effect = PortalLMSUnavailable()

        response = self.client.get(
            '/api/dashboard/instructors/',
            {
                'programme_type_code': 'UG',
                'session': '2025-2026',
                'semester': 'First-Semester',
            },
        )

        self.assertEqual(response.status_code, 502)
        sync_courses.assert_called_once_with(
            staff_external_id='SS0001',
            programme_type_code='UG',
            session='2025/2026',
            semester='First Semester',
        )
        self.assertEqual(response.data['status'], 'error')
        self.assertEqual(
            str(response.data['detail']),
            'The portal LMS service could not complete the request.',
        )

    @patch('dashboard.views.get_or_sync_staff_registered_courses')
    def test_instructor_routes_require_session_and_semester(self, sync_courses):
        endpoints = (
            '/api/dashboard/instructors/',
            '/api/dashboard/instructors/SS0001/',
        )

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                with self.assertLogs('dashboard.views', level='WARNING') as logs:
                    response = self.client.get(
                        endpoint,
                        {'programme_type_code': 'UG'},
                    )
                self.assertEqual(response.status_code, 400)
                self.assertEqual(
                    str(response.data['detail']),
                    'session and semester are required',
                )
                self.assertIn(
                    "missing_params=['session', 'semester']",
                    logs.output[0],
                )
                self.assertIn(
                    "query_params={'programme_type_code': ['UG']}",
                    logs.output[0],
                )

        sync_courses.assert_not_called()

    @patch('dashboard.views.get_or_sync_student_registered_courses')
    def test_staff_can_fetch_student_dashboard_with_current_model_fields(self, sync_courses):
        student = PortalUser.objects.create(
            external_id='ST0001',
            full_name='Student User',
            roles=['STUDENT'],
        )
        course = CourseCache.objects.create(
            course_external_id=101,
            course_code='CSC101',
            course_title='Computer Science',
        )
        enrollment = StudentRegisteredCourse.objects.create(
            student_external_id=student.external_id,
            course=course,
            session='2025/2026',
            semester='First Semester',
        )
        sync_courses.return_value = [enrollment]
        Quiz.objects.create(
            course=course,
            name='Upcoming quiz',
            is_published=True,
            time_close=timezone.now() + timezone.timedelta(days=1),
        )
        Assignment.objects.create(
            course=course,
            title='Upcoming assignment',
            open_at=timezone.now() - timezone.timedelta(hours=1),
            due_at=timezone.now() + timezone.timedelta(days=1),
            is_published=True,
            created_by=self.staff,
        )

        response = self.client.get(
            f'/api/dashboard/students/{student.external_id}/',
            {'session': '2025/2026', 'semester': 'First Semester'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['course_count'], 1)
        self.assertEqual(response.data['pending_quizzes'][0]['name'], 'Upcoming quiz')
        self.assertEqual(
            response.data['upcoming_assignments'][0]['title'],
            'Upcoming assignment',
        )
