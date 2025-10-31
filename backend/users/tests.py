from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from users.models import Applicant, Student, Staff
from io import BytesIO, StringIO
import csv
from django.core.management import call_command
from django.contrib.auth.models import Group


User = get_user_model()


class CoreAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Ensure groups exist before tests
        try:
            call_command('create_groups')
        except Exception:
            pass

    def test_applicant_signup_and_profile(self):
        resp = self.client.post('/api/auth/signup/applicant/', {'username': 'app1', 'password': 'pass1234', 'email': 'a@x.com'}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['status'], 'success')

        # user should be in Applicants group
        user = get_user_model().objects.get(username='app1')
        self.assertTrue(user.groups.filter(name='Applicants').exists())

        # login
        login = self.client.post('/api/auth/login/', {'username': 'app1', 'password': 'pass1234'}, format='json')
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data['status'], 'success')
        access = login.data['data']['access']

        # use token to access profile
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        profile = self.client.get('/api/auth/applicant/profile/')
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.data['status'], 'success')

    def test_staff_signup_and_list_applicants(self):
        # create some applicants
        u1 = User.objects.create_user(username='a1', password='p1', email='a1@x.com', role='applicant')
        Applicant.objects.create(user=u1)
        u2 = User.objects.create_user(username='a2', password='p2', email='a2@x.com', role='applicant')
        Applicant.objects.create(user=u2)
        # create staff user via serializer flow to ensure group assignment
        resp = self.client.post('/api/auth/signup/staff/', {'username': 'staff1', 'password': 'spass', 'email': 's@x.com', 'role': 'coordinator'}, format='json')
        self.assertEqual(resp.status_code, 201)
        staff_user = User.objects.get(username='staff1')

        # staff user should be in Staff group
        self.assertTrue(staff_user.groups.filter(name='Staff').exists())

        # authenticate as staff
        self.client.force_authenticate(user=staff_user)
        resp = self.client.get('/api/staff/applicants/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'success')
        self.assertGreaterEqual(len(resp.data['data']), 2)

    def test_student_profile_and_admission_upload(self):
        # create applicant users
        auser = User.objects.create_user(username='toadmit', password='p', email='t@x.com', role='applicant')
        app = Applicant.objects.create(user=auser, applicant_id='odel99999')

        # create admission officer via signup endpoint so groups are assigned
        resp_officer = self.client.post('/api/auth/signup/staff/', {'username': 'officer', 'password': 'o', 'email': 'officer@x.com', 'role': 'admission_officer'}, format='json')
        self.assertEqual(resp_officer.status_code, 201)
        officer = User.objects.get(username='officer')

        # prepare CSV to upload (StringIO -> encode to BytesIO for multipart)
        s = StringIO()
        writer = csv.writer(s)
        writer.writerow(['applicant_id', 'matric_no', 'programme'])
        writer.writerow([app.applicant_id, 'MATRIC123', 'Computer Science'])
        s.seek(0)
        output = BytesIO(s.getvalue().encode('utf-8'))

        self.client.force_authenticate(user=officer)
        resp = self.client.post('/api/admissions/upload/admitted/', {'file': output}, format='multipart')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'success')

        # reload applicant
        app.refresh_from_db()
        self.assertEqual(app.status, 'admitted')

        # user should now be student and have student record
        auser.refresh_from_db()
        self.assertEqual(auser.role, 'student')
        self.assertTrue(hasattr(auser, 'student_profile'))

        # student profile access
        self.client.force_authenticate(user=auser)
        sresp = self.client.get('/api/students/profile/')
        self.assertEqual(sresp.status_code, 200)
        self.assertEqual(sresp.data['status'], 'success')

    def test_permission_denied_for_nonstaff_on_staff_endpoints(self):
        # create an applicant user and try to access staff endpoint
        resp = self.client.post('/api/auth/signup/applicant/', {'username': 'plainapp', 'password': 'p', 'email': 'p@x.com'}, format='json')
        self.assertEqual(resp.status_code, 201)
        user = get_user_model().objects.get(username='plainapp')
        # authenticate as applicant
        self.client.force_authenticate(user=user)
        sresp = self.client.get('/api/staff/applicants/')
        # Expect forbidden (403)
        self.assertIn(sresp.status_code, (403, 401))
