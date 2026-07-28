from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from courses.models import AcademicSession, Semester
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
