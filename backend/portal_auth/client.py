import requests
from django.conf import settings


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
