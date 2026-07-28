import requests
from django.conf import settings
import logging
from urllib.parse import quote

from .exceptions import PortalLMSUnavailable

logger = logging.getLogger(__name__)


class PortalClient:
    def __init__(self, token: str | None = None):
        self.token = token

    @staticmethod
    def _lms_base_url() -> str:
        base_url = settings.PORTAL_SYNC_BASE_URL.rstrip("/")
        if base_url.endswith("/api/lms"):
            return base_url
        if base_url.endswith("/api"):
            return f"{base_url}/lms"
        return f"{base_url}/api/lms"

    @staticmethod
    def _external_headers() -> dict:
        identity = getattr(settings, "PORTAL_SYNC_PUBLIC_KEY", "")
        secret = getattr(settings, "PORTAL_SYNC_PRIVATE_KEY", "")
        if not identity or not secret:
            raise RuntimeError("Portal external-client credentials are not configured")
        return {
            "Identity": identity,
            "Secret": secret,
            "Accept": "application/json",
        }

    def _get_lms_data(self, path: str, params: dict) -> list:
        url = f"{self._lms_base_url()}{path}"
        try:
            response = requests.get(
                url,
                headers=self._external_headers(),
                params=params,
                timeout=10,
            )
            response.raise_for_status()
        except requests.Timeout as exc:
            logger.warning("Portal LMS request timed out for path %s", path)
            raise PortalLMSUnavailable("The portal LMS service timed out.") from exc
        except requests.RequestException as exc:
            upstream_status = exc.response.status_code if exc.response is not None else None
            logger.warning(
                "Portal LMS request failed for path %s with status %s",
                path,
                upstream_status,
            )
            raise PortalLMSUnavailable() from exc

        try:
            payload = response.json()
        except requests.JSONDecodeError as exc:
            logger.warning("Portal LMS returned invalid JSON for path %s", path)
            raise PortalLMSUnavailable("The portal LMS service returned an invalid response.") from exc

        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, list):
            logger.warning("Portal LMS response for path %s did not contain a data list", path)
            raise PortalLMSUnavailable("The portal LMS service returned an invalid response.")
        return data

    def get_current_user(self) -> dict:
        url = f"{settings.PORTAL_API_BASE_URL.rstrip('/')}/api/get-current-user"
        headers = {"Authorization": f"Bearer {self.token}"}

        try:
            resp = requests.get(url, headers=headers, timeout=10)

            if resp.status_code in (401, 403):
                raise PermissionError("Unauthorized or forbidden from portal")

            resp.raise_for_status()
            data = resp.json()

            if "user" not in data:
                raise ValueError("Invalid portal response: missing 'user'")

            return data["user"]

        except requests.Timeout:
            raise TimeoutError("Portal request timed out")
        except requests.RequestException as e:
            raise RuntimeError(f"Portal error: {e}")
        
    def get_student_registered_courses(
        self,
        *,
        student_external_id: str,
        session: str,
        semester: str,
    ) -> list:
        matric_number = quote(student_external_id, safe="")
        return self._get_lms_data(
            f"/students/{matric_number}/courses",
            {"session": session, "semester": semester},
        )

    def get_staff_assigned_courses(
        self,
        *,
        staff_external_id: str,
        programme_type_code: str,
        session: str | None = None,
        semester: str | None = None,
    ) -> list:
        params = {
            "userId": staff_external_id,
            "programmeTypeCode": programme_type_code,
        }
        if session and semester:
            params.update({"session": session, "semester": semester})
        return self._get_lms_data("/staff/courses", params)
