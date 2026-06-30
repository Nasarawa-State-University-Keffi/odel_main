from typing import List, Optional, Any
from .base import BaseEmailService


class ConsoleEmailService(BaseEmailService):
    """
    Console implementation of the notification service.
    Useful for development and testing.
    """

    def send_one(
        self,
        recipient: str,
        subject: str,
        message: str,
        html_message: Optional[str] = None,
        from_email: Optional[str] = None,
        **kwargs: Any
    ) -> bool:
        print("--- SENDING EMAIL (ONE) ---")
        print(f"To: {recipient}")
        print(f"From: {from_email or 'DEFAULT'}")
        print(f"Subject: {subject}")
        print(f"Body: {message}")
        if html_message:
            print(f"HTML Content: Provided (length: {len(html_message)})")
        print("---------------------------")
        return True

    def send_many(
        self,
        recipients: List[str],
        subject: str,
        message: str,
        html_message: Optional[str] = None,
        from_email: Optional[str] = None,
        **kwargs: Any
    ) -> int:
        print(f"--- SENDING BULK EMAIL ({len(recipients)} recipients) ---")
        print(f"From: {from_email or 'DEFAULT'}")
        print(f"Subject: {subject}")
        print(f"Body: {message}")
        for recipient in recipients:
            print(f"  -> Sending to: {recipient}")
        print("-------------------------------------------------")
        return len(recipients)
