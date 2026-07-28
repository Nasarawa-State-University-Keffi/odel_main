from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from portal_auth.models import PortalUser
from portal_auth.oidc import sync_user_from_claims

from .client import UpstreamSynchronizationClient
from .models import Department, Faculty, Programme, ProgrammeType
from .services import sync_all


class FakeUpstreamClient:
    def programme_types(self):
        return [{'id': 1, 'name': 'Undergraduate', 'code': 'UG'}]

    def faculties(self):
        return [{'id': 10, 'name': 'Faculty of Science', 'code': 'SCI'}]

    def departments(self):
        return [
            {'id': 20, 'name': 'Computer Science', 'code': 'CS', 'faculty': {'name': 'Faculty of Science'}},
            {'id': 21, 'name': 'Unknown', 'code': 'UNK', 'faculty': {'name': 'Missing'}},
        ]

    def programmes(self, programme_type_code):
        return [
            {'id': 100, 'name': 'B.Sc. Computer Science', 'code': 'BSC-CS', 'department': 'CS'},
            {'id': 101, 'name': 'Missing Department', 'code': 'MISS', 'department': 'NONE'},
        ]


class SynchronizationServiceTests(TestCase):
    @patch('synchronization.services.UpstreamSynchronizationClient', return_value=FakeUpstreamClient())
    def test_sync_all_upserts_dependencies_and_skips_unresolved_records(self, _client):
        first = sync_all()
        second = sync_all()

        self.assertEqual(first['departments'], 1)
        self.assertEqual(first['programmes'], 1)
        self.assertEqual(first['skipped_departments'], 1)
        self.assertEqual(first['skipped_programmes'], 1)
        self.assertEqual(second['programme_types'], 1)
        self.assertEqual(ProgrammeType.objects.count(), 1)
        self.assertEqual(Faculty.objects.count(), 1)
        self.assertEqual(Department.objects.count(), 1)
        self.assertEqual(Programme.objects.count(), 1)

    @override_settings(
        PORTAL_SYNC_BASE_URL='https://portal.example.edu',
        PORTAL_SYNC_PUBLIC_KEY='identity',
        PORTAL_SYNC_PRIVATE_KEY='secret',
    )
    @patch('synchronization.client.requests.get')
    def test_client_sends_environment_credentials(self, request_get):
        response = Mock()
        response.json.return_value = []
        response.raise_for_status.return_value = None
        request_get.return_value = response

        UpstreamSynchronizationClient().faculties()

        request_get.assert_called_once_with(
            'https://portal.example.edu/api/v1/attendance/faculties/all',
            headers={'Identity': 'identity', 'Secret': 'secret'},
            params=None,
            timeout=30,
        )


class SynchronizationApiTests(TestCase):
    def setUp(self):
        self.admin = PortalUser.objects.create(
            external_id='admin', full_name='Admin', roles=['ADMIN'], is_staff=True
        )
        self.staff = PortalUser.objects.create(
            external_id='staff', full_name='Staff', roles=['STAFF'], is_staff=True
        )
        self.student = PortalUser.objects.create(external_id='student', full_name='Student', roles=['STUDENT'])
        self.client = APIClient()

    @patch('synchronization.views.sync_all_task.delay')
    def test_admin_can_queue_sync(self, delay):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/synchronize/sync-all')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        delay.assert_called_once_with()

    @patch('synchronization.views.sync_all_task.delay')
    def test_regular_staff_cannot_queue_sync(self, delay):
        self.client.force_authenticate(self.staff)
        response = self.client.post('/api/synchronize/sync-all')

        self.assertEqual(response.status_code, 403)
        delay.assert_not_called()

    def test_read_endpoint_searches_without_domain_filter(self):
        Faculty.objects.create(up_stream_id=1, name='Engineering', code='ENG')
        Faculty.objects.create(up_stream_id=2, name='Science', code='SCI')
        self.client.force_authenticate(self.student)

        response = self.client.get('/api/faculty/search?query=eng')

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item['code'] for item in response.data['data']], ['ENG'])

    def test_all_read_endpoints_clone_their_class_level_querysets(self):
        programme_type = ProgrammeType.objects.create(
            up_stream_id=1, name='Undergraduate', code='UG'
        )
        faculty = Faculty.objects.create(up_stream_id=10, name='Science', code='SCI')
        department = Department.objects.create(
            up_stream_id=20, name='Computer Science', code='CS', faculty=faculty
        )
        Programme.objects.create(
            up_stream_id=100,
            name='B.Sc. Computer Science',
            code='BSC-CS',
            department=department,
            programme_type=programme_type,
        )
        self.client.force_authenticate(self.student)

        endpoints = (
            '/api/program-type/',
            '/api/faculty/all',
            '/api/faculty/search?query=science',
            f'/api/department/all?faculty={faculty.id}',
            '/api/department/search?query=computer',
            f'/api/programme/?programme_type={programme_type.id}',
            '/api/programme/search?query=B.Sc.',
        )

        for endpoint in endpoints:
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(len(response.data['data']), 1)


class OidcProgrammeSynchronizationTests(TestCase):
    def test_oidc_links_student_to_synced_programme_by_code(self):
        programme_type = ProgrammeType.objects.create(up_stream_id=1, name='Undergraduate', code='UG')
        faculty = Faculty.objects.create(up_stream_id=10, name='Science', code='SCI')
        department = Department.objects.create(
            up_stream_id=20, name='Computer Science', code='CS', faculty=faculty
        )
        programme = Programme.objects.create(
            up_stream_id=100,
            name='B.Sc. Computer Science',
            code='BSC-CS',
            department=department,
            programme_type=programme_type,
        )

        user = sync_user_from_claims({
            'preferred_username': 'student001',
            'name': 'Student One',
            'groups': ['STUDENT'],
            'programme_code': 'BSC-CS',
        })

        self.assertEqual(user.programme, programme)
