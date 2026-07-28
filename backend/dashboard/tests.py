from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

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
        self.client = APIClient()
        self.client.force_authenticate(self.staff)

    @patch('dashboard.views.get_or_sync_staff_registered_courses')
    def test_portal_failure_is_returned_as_bad_gateway(self, sync_courses):
        sync_courses.side_effect = PortalLMSUnavailable()

        response = self.client.get(
            '/api/dashboard/instructors/',
            {'programme_type_code': 'UG'},
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data['status'], 'error')
        self.assertEqual(
            str(response.data['detail']),
            'The portal LMS service could not complete the request.',
        )
