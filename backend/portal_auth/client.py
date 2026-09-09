import requests
from django.conf import settings
import logging
from urllib.parse import quote

from .exceptions import PortalLMSUnavailable

logger = logging.getLogger(__name__)


def _response_body_for_log(response, limit: int = 2000) -> str:
    if response is None:
        return "<no response>"
    try:
        body = response.text
    except Exception:
        return "<unavailable>"
    if not isinstance(body, str):
        return "<unavailable>"
    if len(body) > limit:
        return f"{body[:limit]}... <truncated {len(body) - limit} characters>"
    return body


class PortalClient:
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
        prepared_url = requests.Request("GET", url, params=params).prepare().url
        logger.info(
            "Portal LMS request starting method=GET url=%s params=%s timeout_seconds=10",
            prepared_url,
            params,
        )
        try:
            response = requests.get(
                url,
                headers=self._external_headers(),
                params=params,
                timeout=10,
            )
            response.raise_for_status()
        except requests.Timeout as exc:
            logger.warning(
                "Portal LMS request timed out method=GET url=%s params=%s "
                "timeout_seconds=10 error=%s",
                prepared_url,
                params,
                exc,
            )
            raise PortalLMSUnavailable("The portal LMS service timed out.") from exc
        except requests.RequestException as exc:
            upstream_response = exc.response
            upstream_status = (
                upstream_response.status_code
                if upstream_response is not None
                else None
            )
            logger.warning(
                "Portal LMS request failed method=GET url=%s params=%s status=%s "
                "response_body=%r error=%s",
                prepared_url,
                params,
                upstream_status,
                _response_body_for_log(upstream_response),
                exc,
            )
            raise PortalLMSUnavailable() from exc

        logger.info(
            "Portal LMS request completed method=GET url=%s status=%s",
            prepared_url,
            response.status_code,
        )
        try:
            payload = response.json()
        except requests.JSONDecodeError as exc:
            logger.warning(
                "Portal LMS returned invalid JSON method=GET url=%s status=%s "
                "response_body=%r error=%s",
                prepared_url,
                response.status_code,
                _response_body_for_log(response),
                exc,
            )
            raise PortalLMSUnavailable("The portal LMS service returned an invalid response.") from exc

        data = payload.get("data") if isinstance(payload, dict) else None
        if not isinstance(data, list):
            logger.warning(
                "Portal LMS response did not contain a data list method=GET url=%s "
                "status=%s payload_type=%s response_body=%r",
                prepared_url,
                response.status_code,
                type(payload).__name__,
                _response_body_for_log(response),
            )
            raise PortalLMSUnavailable("The portal LMS service returned an invalid response.")
        logger.info(
            "Portal LMS response parsed method=GET url=%s status=%s data_count=%d",
            prepared_url,
            response.status_code,
            len(data),
        )
        return data

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
        session: str,
        semester: str,
    ) -> list:
        params = {
            "userId": staff_external_id,
            "programmeTypeCode": programme_type_code,
            "session": session,
            "semester": semester,
        }
        return self._get_lms_data("/staff/courses", params)
