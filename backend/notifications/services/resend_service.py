import requests
from typing import List, Optional, Any
from .base import BaseEmailService, NotificationException


class ResendEmailService(BaseEmailService):
    """
    Email service implementation for Resend.com.
    """
    API_URL = "https://api.resend.com/emails"

    def __init__(self, api_key: Optional[str] = None, from_email: Optional[str] = None):
        self.api_key = api_key
        self.from_email = from_email

    def send_one(
        self,
        recipient: str,
        subject: str,
        message: str,
        html_message: Optional[str] = None,
        from_email: Optional[str] = None,
        **kwargs: Any
    ) -> bool:
        if not self.api_key:
            raise NotificationException("Resend API key is not configured.")

        payload = {
            "from": from_email or self.from_email or "onboarding@resend.dev",
            "to": [recipient],
            "subject": subject,
            "text": message,
        }
        if html_message:
            payload["html"] = html_message

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(self.API_URL, json=payload, headers=headers)
            response.raise_for_status()
            return True
        except Exception as e:
            # Optionally log the error here
            return False

    def send_many(
        self,
        recipients: List[str],
        subject: str,
        message: str,
        html_message: Optional[str] = None,
        from_email: Optional[str] = None,
        **kwargs: Any
    ) -> int:
        # Resend has a bulk sending endpoint but for simplicity we iterate 
        # or use their batching if available. Batching is usually preferred.
        success_count = 0
        for recipient in recipients:
            if self.send_one(recipient, subject, message, html_message, from_email, **kwargs):
                success_count += 1
        return success_count
