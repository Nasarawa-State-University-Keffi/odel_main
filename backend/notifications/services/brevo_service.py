import requests
from typing import List, Optional, Any
from .base import BaseEmailService, NotificationException


class BrevoEmailService(BaseEmailService):
    """
    Email service implementation for Brevo (formerly Sendinblue).
    """
    API_URL = "https://api.brevo.com/v3/smtp/email"

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
            raise NotificationException("Brevo API key is not configured.")

        payload = {
            "sender": {"email": from_email or self.from_email or "onboarding@brevo.com"},
            "to": [{"email": recipient}],
            "subject": subject,
            "textContent": message,
        }
        if html_message:
            payload["htmlContent"] = html_message

        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        try:
            response = requests.post(self.API_URL, json=payload, headers=headers)
            response.raise_for_status()
            return True
        except Exception as e:
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
        success_count = 0
        for recipient in recipients:
            if self.send_one(recipient, subject, message, html_message, from_email, **kwargs):
                success_count += 1
        return success_count
