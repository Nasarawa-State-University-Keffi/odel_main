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


class StudentDashboardAvailabilityTests(TestCase):
    def setUp(self):
        self.student = PortalUser.objects.create(
            external_id='ST0002',
            full_name='Dashboard Student',
            roles=['STUDENT'],
        )
        self.course = CourseCache.objects.create(
            course_external_id=102,
            course_code='CSC102',
            course_title='Dashboard Course',
        )
        self.enrollment = StudentRegisteredCourse.objects.create(
            student_external_id=self.student.external_id,
            course=self.course,
            session='2025/2026',
            semester='First Semester',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.student)

    @patch('dashboard.views.get_or_sync_student_registered_courses')
    def test_dashboard_only_returns_work_open_to_the_enrolled_student(self, sync_courses):
        sync_courses.return_value = [self.enrollment]
        now = timezone.now()

        Quiz.objects.create(
            course=self.course,
            name='Open-ended quiz',
            is_published=True,
        )
        Quiz.objects.create(
            course=self.course,
            name='Future quiz',
            is_published=True,
            time_open=now + timezone.timedelta(hours=1),
            time_close=now + timezone.timedelta(days=1),
        )
        Quiz.objects.create(
            course=self.course,
            name='Closed quiz',
            is_published=True,
            time_close=now - timezone.timedelta(minutes=1),
        )
        Assignment.objects.create(
            course=self.course,
            title='Open assignment',
            open_at=now - timezone.timedelta(hours=1),
            due_at=now + timezone.timedelta(days=1),
            created_by=self.student,
            is_published=True,
        )
        Assignment.objects.create(
            course=self.course,
            title='Future assignment',
            open_at=now + timezone.timedelta(hours=1),
            due_at=now + timezone.timedelta(days=1),
            created_by=self.student,
            is_published=True,
        )
        Assignment.objects.create(
            course=self.course,
            title='Late-window assignment',
            open_at=now - timezone.timedelta(days=2),
            due_at=now - timezone.timedelta(hours=1),
            close_at=now + timezone.timedelta(days=1),
            allow_late_submission=True,
            created_by=self.student,
            is_published=True,
        )

        response = self.client.get(
            '/api/dashboard/students/',
            {'session': '2025/2026', 'semester': 'First Semester'},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            {quiz['name'] for quiz in response.data['pending_quizzes']},
            {'Open-ended quiz'},
        )
        self.assertEqual(
            {assignment['title'] for assignment in response.data['upcoming_assignments']},
            {'Open assignment', 'Late-window assignment'},
        )
