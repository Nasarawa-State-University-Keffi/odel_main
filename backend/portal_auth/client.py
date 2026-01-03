import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class PortalClient:
    def __init__(self, token: str):
        self.token = token

    def get_current_user(self) -> dict:
        url = f"{settings.PORTAL_API_BASE_URL}/get-current-user"
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
        session_id: int,
        semester_id: int,
    ) -> list:

        url = f"{settings.PORTAL_API_BASE_URL}/students/get-registered-course"
        headers = {"Authorization": f"Bearer {self.token}"}
        params = {
            "student": student_external_id,
            "session": session_id,
            "semester": semester_id,
        }
        print(f"Fetching registered courses with params: {params} {headers}")
        logger.info(f"Fetching registered courses with params: {params} {headers}")
        try:
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=10,
            )

            # Portal-side error — DO NOT crash LMS
            if response.status_code >= 500:
                logger.error(
                    "Portal 5xx error",
                    extra={"url": url, "params": params, "status": response.status_code},
                )
                return []  # graceful fallback

            if response.status_code in (401, 403):
                raise PermissionError("Unauthorized or forbidden from portal")

            response.raise_for_status()

            data = response.json()
            return data or []

        except requests.Timeout:
            logger.warning("Portal timeout", extra={"url": url})
            return []

        except requests.RequestException as e:
            logger.exception("Portal request failed")
            return []

    def get_staff_assigned_courses(
            self,
            *,
            staff_external_id: str,
            programme_id: int,
        ) -> list:

            url = f"{settings.PORTAL_API_BASE_URL}/staff/get-assigned-courses/{programme_id}/{staff_external_id}"
            headers = {"Authorization": f"Bearer {self.token}"}
            # params = {
            #     "staffId": staff_external_id,
            #     "programmeType": programme_id,
            # }
            logger.info(f"Fetching assigned courses with params: {headers}")
            try:
                response = requests.get(
                    url,
                    headers=headers,
                    # params=params,
                    timeout=10,
                )

                # Portal-side error — DO NOT crash LMS
                if response.status_code >= 500:
                    logger.error(
                        "Portal 5xx error",
                        extra={"url": url, "status": response.status_code},
                    )
                    return []  # graceful fallback

                if response.status_code in (401, 403):
                    raise PermissionError("Unauthorized or forbidden from portal")

                response.raise_for_status()

                data = response.json()
                return data or []

            except requests.Timeout:
                logger.warning("Portal timeout", extra={"url": url})
                return []

            except requests.RequestException as e:
                logger.exception("Portal request failed")
                return []
