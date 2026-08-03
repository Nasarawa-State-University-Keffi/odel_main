from typing import List, Optional, Any
from django.core.mail import send_mail, send_mass_mail
from django.conf import settings

from .base import BaseEmailService, NotificationException


class SMTPEmailService(BaseEmailService):
    """
    SMTP implementation of the notification service using Django's core mail utilities.
    """

    def __init__(self, from_email: Optional[str] = None):
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
        """
        Send a single email using Django's send_mail.
        """
        try:
            sent_count = send_mail(
                subject=subject,
                message=message,
                from_email=from_email or self.from_email or settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient],
                html_message=html_message,
                fail_silently=False,
                **kwargs
            )
            return sent_count > 0
        except Exception as exc:
            raise NotificationException(f'SMTP delivery failed: {exc}') from exc

    def send_many(
        self,
        recipients: List[str],
        subject: str,
        message: str,
        html_message: Optional[str] = None,
        from_email: Optional[str] = None,
        **kwargs: Any
    ) -> int:
        """
        Send emails to multiple recipients using Django's send_mass_mail.
        Note: send_mass_mail is optimized for multiple emails over a single connection.
        """
        # If html_message is provided, send_mass_mail doesn't support it directly.
        # We handle this by sending individual emails or using more complex mass mail logic.
        if html_message:
            success_count = 0
            for recipient in recipients:
                if self.send_one(recipient, subject, message, html_message, from_email, **kwargs):
                    success_count += 1
            return success_count

        # Standard text-only mass mail
        sender = from_email or self.from_email or settings.DEFAULT_FROM_EMAIL
        messages = [(subject, message, sender, [recipient]) for recipient in recipients]
        
        try:
            return send_mass_mail(tuple(messages), fail_silently=False)
        except Exception as exc:
            raise NotificationException(f'SMTP bulk delivery failed: {exc}') from exc
