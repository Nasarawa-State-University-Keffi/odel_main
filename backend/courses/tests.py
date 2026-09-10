from django.contrib import admin
from django.test import TestCase
from rest_framework.test import APIClient

from dashboard.views import resolve_academic_period
from portal_auth.models import PortalUser

from .models import AcademicSession, CourseCache, Semester


class AcademicPeriodTests(TestCase):
    def setUp(self):
        self.session = AcademicSession.objects.create(name='2025/2026')
        self.semester = Semester.objects.create(name='First Semester')
        self.user = PortalUser.objects.create(
            external_id='student001',
            full_name='Student One',
            roles=['STUDENT'],
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_academic_period_models_are_registered_in_admin(self):
        self.assertIn(AcademicSession, admin.site._registry)
        self.assertIn(Semester, admin.site._registry)

    def test_frontend_can_list_sessions_and_semesters(self):
        sessions_response = self.client.get('/api/sessions/')
        semesters_response = self.client.get('/api/semesters/')

        self.assertEqual(sessions_response.status_code, 200)
        self.assertEqual(semesters_response.status_code, 200)
        self.assertEqual(
            sessions_response.json()['results'],
            [{'id': self.session.id, 'name': '2025/2026'}],
        )
        self.assertEqual(
            semesters_response.json()['results'],
            [{'id': self.semester.id, 'name': 'First Semester'}],
        )

    def test_frontend_can_retrieve_course_by_portal_id(self):
        course = CourseCache.objects.create(
            course_external_id=4242,
            course_code='CSC 401',
            course_title='Software Engineering',
            department_name='Computer Science',
        )

        response = self.client.get(f'/api/courses/{course.course_external_id}/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['course_external_id'], 4242)
        self.assertEqual(response.json()['course_code'], 'CSC 401')

    def test_dashboard_period_resolution_uses_canonical_names(self):
        session, semester = resolve_academic_period('2025-2026', 'first-semester')

        self.assertEqual(session, '2025/2026')
        self.assertEqual(semester, 'First Semester')

    def test_non_admin_cannot_manage_academic_periods(self):
        response = self.client.post('/api/sessions/', {'name': '2026/2027'}, format='json')

        self.assertEqual(response.status_code, 403)

    def test_portal_admin_can_create_update_and_delete_academic_periods(self):
        admin_user = PortalUser.objects.create(
            external_id='admin001',
            full_name='Portal Admin',
            roles=['PORTAL_ADMIN'],
        )
        self.client.force_authenticate(admin_user)

        create_response = self.client.post(
            '/api/sessions/',
            {'name': '2026/2027'},
            format='json',
        )
        self.assertEqual(create_response.status_code, 201)

        update_response = self.client.patch(
            f'/api/semesters/{self.semester.id}/',
            {'name': 'Second Semester'},
            format='json',
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.json()['name'], 'Second Semester')

        delete_response = self.client.delete(
            f"/api/sessions/{create_response.json()['id']}/"
        )
        self.assertEqual(delete_response.status_code, 204)
