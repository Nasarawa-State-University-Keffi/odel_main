from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from assessment.models import Assessment, AssessmentAttempt, Assignment, Quiz, QuizAttempt
from courses.models import (
    AcademicSession,
    CourseCache,
    CourseOffering,
    Semester,
    StaffAssignedCourse,
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


class AdminDashboardTests(TestCase):
    def setUp(self):
        self.admin = PortalUser.objects.create(
            external_id='admin001', full_name='Portal Admin', roles=['PORTAL_ADMINS'], is_staff=True,
        )
        self.staff = PortalUser.objects.create(
            external_id='staff001', full_name='Lecturer One', roles=['PORTAL_STAFF'], is_staff=True,
        )
        self.student = PortalUser.objects.create(
            external_id='student001', full_name='Student One', roles=['PORTAL_STUDENTS'], level='200',
        )
        self.session = AcademicSession.objects.create(name='2025/2026')
        self.semester = Semester.objects.create(name='First Semester')
        self.course = CourseCache.objects.create(course_external_id=501, course_code='CSC501', course_title='Admin Metrics')
        self.offering = CourseOffering.objects.create(
            course=self.course, session=self.session, semester=self.semester, programme_type_code='ODEL', status='active',
        )
        StaffAssignedCourse.objects.create(
            staff_external_id=self.staff.external_id, course=self.course, course_offering=self.offering,
            programme_type_code='ODEL', role='instructor',
        )
        StudentRegisteredCourse.objects.create(
            student_external=self.student, course=self.course, course_offering=self.offering,
            session=self.session.name, semester=self.semester.name,
        )
        self.quiz = Quiz.objects.create(course=self.course, name='Term quiz', is_published=True)
        self.assessment = Assessment.objects.create(
            course=self.course, course_offering=self.offering, name='Term assessment', is_published=True,
        )
        QuizAttempt.objects.create(
            quiz=self.quiz, user_external_id=self.student.external_id, attempt_number=1,
            state='finished', total_score='78.00',
        )
        AssessmentAttempt.objects.create(
            assessment=self.assessment, user_external_id=self.student.external_id, attempt_number=1,
            state='finished', total_score='84.00',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_admin_overview_returns_term_scoped_metrics(self):
        response = self.client.get('/api/dashboard/admin/overview/', {
            'session': '2025/2026', 'semester': 'First Semester',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['people']['staff'], 1)
        self.assertEqual(response.data['people']['students'], 1)
        self.assertEqual(response.data['people']['active_staff'], 1)
        self.assertEqual(response.data['people']['active_students'], 1)
        self.assertEqual(response.data['quizzes']['published'], 1)
        self.assertEqual(response.data['quizzes']['completed_attempts'], 1)
        self.assertEqual(response.data['assessments']['published'], 1)
        self.assertEqual(response.data['assessments']['average_score'], 84.0)

    def test_admin_directories_are_separate_and_paginated(self):
        staff_response = self.client.get('/api/dashboard/admin/staff/', {'page': 1, 'page_size': 1})
        student_response = self.client.get('/api/dashboard/admin/students/', {'search': 'student'})

        self.assertEqual(staff_response.status_code, 200)
        self.assertEqual(staff_response.data['count'], 1)
        self.assertEqual(staff_response.data['results'][0]['external_id'], self.staff.external_id)
        self.assertEqual(student_response.status_code, 200)
        self.assertEqual(student_response.data['count'], 1)
        self.assertEqual(student_response.data['results'][0]['external_id'], self.student.external_id)

    def test_non_admin_cannot_access_admin_dashboard_data(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/dashboard/admin/overview/')

        self.assertEqual(response.status_code, 403)
