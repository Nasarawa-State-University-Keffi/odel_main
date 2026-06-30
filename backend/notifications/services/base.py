from abc import ABC, abstractmethod
from typing import List, Optional, Any


class BaseEmailService(ABC):
    """
    Abstract base class for all email notification services.
    Provides a unified interface for sending single and bulk emails.
    """

    @abstractmethod
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
        Send a single email.
        
        Args:
            recipient: Recipient email address
            subject: Email subject
            message: Plain text message body
            html_message: Optional HTML message body
            from_email: Optional custom sender address
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        pass

    @abstractmethod
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
        Send emails to multiple recipients.
        
        Args:
            recipients: List of recipient email addresses
            subject: Email subject
            message: Plain text message body
            html_message: Optional HTML message body
            from_email: Optional custom sender address
            
        Returns:
            int: Number of emails successfully sent
        """
        pass


class NotificationException(Exception):
    """Exception raised when notification operations fail."""
    pass