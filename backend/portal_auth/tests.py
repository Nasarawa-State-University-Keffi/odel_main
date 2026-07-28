from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
import jwt
import requests
from rest_framework.test import APIClient

from .models import PortalUser
from .client import PortalClient
from .exceptions import PortalLMSUnavailable
from .oidc import OIDC_SESSION_KEY, sync_user_from_claims
from .services import get_or_sync_student_registered_courses
from courses.models import CourseCache, StudentRegisteredCourse


@override_settings(
    AUTHENTIK_ISSUER_URL="https://auth.example.edu.ng/application/o/lms/",
    AUTHENTIK_CLIENT_ID="lms-client",
    AUTHENTIK_CLIENT_SECRET="secret",
    AUTHENTIK_REDIRECT_URI="https://lms.example.edu.ng/auth/oidc/callback",
    OIDC_LOGIN_REDIRECT_URL="/dashboard",
)
class OIDCAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("portal_auth.oidc.get_provider_metadata")
    def test_login_redirects_to_authentik_and_stores_login_state(self, metadata):
        metadata.return_value = {
            "authorization_endpoint": "https://auth.example.edu.ng/application/o/authorize/",
            "token_endpoint": "https://auth.example.edu.ng/application/o/token/",
            "jwks_uri": "https://auth.example.edu.ng/application/o/lms/jwks/",
        }

        response = self.client.get("/auth/login")

        self.assertEqual(response.status_code, 302)
        self.assertIn("https://auth.example.edu.ng/application/o/authorize/", response["Location"])
        self.assertIn("client_id=lms-client", response["Location"])
        self.assertIn("scope=openid+profile+email", response["Location"])
        self.assertIn("code_challenge_method=S256", response["Location"])
        self.assertIn(OIDC_SESSION_KEY, self.client.session)
        self.assertIn("state", self.client.session[OIDC_SESSION_KEY])
        self.assertIn("nonce", self.client.session[OIDC_SESSION_KEY])

    def test_callback_rejects_invalid_state(self):
        session = self.client.session
        session[OIDC_SESSION_KEY] = {"state": "expected", "nonce": "nonce", "code_verifier": "verifier"}
        session.save()

        response = self.client.get("/auth/oidc/callback?code=abc&state=wrong")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Invalid OIDC state")

    @patch("portal_auth.views.validate_id_token")
    @patch("portal_auth.views.exchange_code_for_tokens")
    def test_callback_syncs_user_sets_session_and_redirects(self, exchange_code, validate_id_token):
        session = self.client.session
        session[OIDC_SESSION_KEY] = {"state": "expected", "nonce": "nonce", "code_verifier": "verifier"}
        session.save()
        exchange_code.return_value = {"id_token": "header.payload.signature"}
        validate_id_token.return_value = {
            "sub": "authentik-subject",
            "preferred_username": "staff001",
            "email": "staff@example.edu.ng",
            "given_name": "John",
            "family_name": "Doe",
            "name": "John Doe",
            "groups": ["PORTAL_STAFF", "teacher"],
            "nonce": "nonce",
            "exp": 4102444800,
        }

        response = self.client.get("/auth/oidc/callback?code=abc&state=expected")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/dashboard")

        user = PortalUser.objects.get(external_id="staff001")
        self.assertEqual(user.email, "staff@example.edu.ng")
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")
        self.assertEqual(user.roles, ["STAFF", "teacher"])
        self.assertTrue(user.is_staff)
        self.assertEqual(self.client.session["portal_user_id"], user.id)
        self.assertNotIn(OIDC_SESSION_KEY, self.client.session)

    def test_me_returns_session_user(self):
        user = PortalUser.objects.create(
            external_id="staff001",
            full_name="John Doe",
            first_name="John",
            last_name="Doe",
            email="staff@example.edu.ng",
            roles=["teacher"],
            is_staff=True,
        )
        session = self.client.session
        session["portal_user_id"] = user.id
        session.save()

        response = self.client.get("/auth/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], user.id)
        self.assertEqual(response.json()["username"], "staff001")
        self.assertEqual(response.json()["firstName"], "John")
        self.assertEqual(response.json()["lastName"], "Doe")
        self.assertEqual(response.json()["roles"], ["teacher"])
        self.assertTrue(response.json()["csrfToken"])

    def test_logout_clears_session(self):
        user = PortalUser.objects.create(external_id="staff001", full_name="John Doe")
        session = self.client.session
        session["portal_user_id"] = user.id
        session.save()

        response = self.client.post("/auth/logout")

        self.assertEqual(response.status_code, 204)
        self.assertNotIn("portal_user_id", self.client.session)

    def test_logout_requires_csrf_for_session_authentication(self):
        user = PortalUser.objects.create(external_id="staff001", full_name="John Doe")
        client = APIClient(enforce_csrf_checks=True)
        session = client.session
        session["portal_user_id"] = user.id
        session.save()

        response = client.post("/auth/logout")

        self.assertEqual(response.status_code, 403)

    def test_logout_accepts_csrf_token_from_me_response(self):
        user = PortalUser.objects.create(external_id="staff001", full_name="John Doe")
        client = APIClient(enforce_csrf_checks=True)
        session = client.session
        session["portal_user_id"] = user.id
        session.save()

        me_response = client.get("/auth/me")
        csrf_token = me_response.json()["csrfToken"]

        response = client.post("/auth/logout", HTTP_X_CSRFTOKEN=csrf_token)

        self.assertEqual(response.status_code, 204)
        self.assertNotIn("portal_user_id", client.session)

    @patch("portal_auth.views.validate_id_token")
    @patch("portal_auth.views.exchange_code_for_tokens")
    def test_callback_rejects_invalid_id_token_and_clears_login_state(self, exchange_code, validate_id_token):
        session = self.client.session
        session[OIDC_SESSION_KEY] = {"state": "expected", "nonce": "nonce", "code_verifier": "verifier"}
        session.save()
        exchange_code.return_value = {"id_token": "header.payload.signature"}
        validate_id_token.side_effect = jwt.InvalidTokenError("bad token")

        response = self.client.get("/auth/oidc/callback?code=abc&state=expected")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid OIDC ID token")
        self.assertNotIn(OIDC_SESSION_KEY, self.client.session)


class OIDCUserMappingTests(TestCase):
    def test_sync_user_from_claims_maps_authentik_group_aliases(self):
        user = sync_user_from_claims({
            "preferred_username": "admin001",
            "name": "Portal Admin",
            "groups": [
                "PORTAL_USERS",
                "PORTAL_ADMINS",
                "PORTAL_STAFF",
                "PORTAL_ADMINS",
            ],
        })

        self.assertEqual(user.roles, ["PORTAL_USERS", "ADMIN", "STAFF"])
        self.assertTrue(user.is_staff)

    def test_sync_user_from_claims_prefers_preferred_username(self):
        user = sync_user_from_claims({
            "sub": "stable-subject",
            "preferred_username": "student001",
            "email": "student@example.edu.ng",
            "given_name": "Jane",
            "family_name": "Doe",
            "groups": ["STUDENT"],
        })

        self.assertEqual(user.external_id, "student001")
        self.assertEqual(user.full_name, "Jane Doe")
        self.assertEqual(user.email, "student@example.edu.ng")
        self.assertEqual(user.first_name, "Jane")
        self.assertEqual(user.last_name, "Doe")
        self.assertEqual(user.roles, ["STUDENT"])
        self.assertFalse(user.is_staff)


@override_settings(
    PORTAL_SYNC_BASE_URL="https://portal.example.edu.ng",
    PORTAL_SYNC_PUBLIC_KEY="lms-client",
    PORTAL_SYNC_PRIVATE_KEY="external-secret",
)
class PortalLMSClientTests(TestCase):
    @patch("portal_auth.client.requests.get")
    def test_student_courses_use_external_credentials_and_response_envelope(self, get):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {
            "data": [{"id": 42, "courseCode": "CSC401", "title": "Software Engineering", "alias": None}]
        }
        get.return_value = response

        courses = PortalClient().get_student_registered_courses(
            student_external_id="NSU/2025/1234",
            session="2025/2026",
            semester="First Semester",
        )

        self.assertEqual(courses[0]["id"], 42)
        get.assert_called_once_with(
            "https://portal.example.edu.ng/api/lms/students/NSU%2F2025%2F1234/courses",
            headers={
                "Identity": "lms-client",
                "Secret": "external-secret",
                "Accept": "application/json",
            },
            params={"session": "2025/2026", "semester": "First Semester"},
            timeout=10,
        )

    @patch("portal_auth.client.requests.get")
    def test_staff_courses_use_external_credentials_and_expected_route(self, get):
        response = Mock()
        response.raise_for_status.return_value = None
        response.json.return_value = {
            "data": [{"id": 42, "courseCode": "CSC401", "title": "Software Engineering"}]
        }
        get.return_value = response

        courses = PortalClient().get_staff_assigned_courses(
            staff_external_id="SS0001",
            programme_type_code="UG",
            session="2025/2026",
            semester="First Semester",
        )

        self.assertEqual(courses[0]["id"], 42)
        get.assert_called_once_with(
            "https://portal.example.edu.ng/api/lms/staff/courses",
            headers={
                "Identity": "lms-client",
                "Secret": "external-secret",
                "Accept": "application/json",
            },
            params={
                "userId": "SS0001",
                "programmeTypeCode": "UG",
                "session": "2025/2026",
                "semester": "First Semester",
            },
            timeout=10,
        )

    @patch("portal_auth.client.requests.get")
    def test_upstream_http_error_becomes_bad_gateway_exception(self, get):
        response = Mock(status_code=404)
        response.raise_for_status.side_effect = requests.HTTPError(response=response)
        get.return_value = response

        with self.assertRaises(PortalLMSUnavailable) as raised:
            PortalClient().get_staff_assigned_courses(
                staff_external_id="SS0001",
                programme_type_code="UG",
                session="2025/2026",
                semester="First Semester",
            )

        self.assertEqual(raised.exception.status_code, 502)
        self.assertNotIn("SS0001", str(raised.exception.detail))

    @patch("portal_auth.services.PortalClient.get_student_registered_courses")
    def test_student_course_sync_uses_names_and_removes_stale_enrollments(self, get_courses):
        stale_course = CourseCache.objects.create(
            course_external_id=1,
            course_code="OLD101",
            course_title="Old Course",
        )
        StudentRegisteredCourse.objects.create(
            student_external_id="student001",
            course=stale_course,
            session="2025/2026",
            semester="First Semester",
        )
        get_courses.return_value = [
            {"id": 42, "courseCode": "CSC401", "title": "Software Engineering", "alias": None}
        ]

        enrollments = get_or_sync_student_registered_courses(
            student_external_id="student001",
            session="2025-2026",
            semester="First-Semester",
        )

        self.assertEqual(len(enrollments), 1)
        self.assertEqual(enrollments[0].session, "2025/2026")
        self.assertEqual(enrollments[0].semester, "First Semester")
        self.assertFalse(StudentRegisteredCourse.objects.filter(course=stale_course).exists())


class HealthCheckTests(TestCase):
    @override_settings(
        SECURE_SSL_REDIRECT=True,
        SECURE_REDIRECT_EXEMPT=[r'^health/$'],
    )
    def test_health_check_is_not_redirected_in_production(self):
        response = APIClient().get('/health/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})
