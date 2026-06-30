from typing import List, Optional, Any
from django.utils import timezone
from .services.router import get_email_service


def send_one(
    recipient: str,
    subject: str,
    message: str,
    html_message: Optional[str] = None,
    from_email: Optional[str] = None,
    backend: Optional[str] = None,
    **kwargs: Any
) -> bool:
    """
    Utility function to send a single email using the configured backend.
    Automatically logs the attempt.
    """
    from .models import NotificationLog
    
    # Get service first to know which backend is being used
    service = get_email_service(backend)
    backend_name = getattr(service, '__class__', {}).__name__ if service else str(backend)
    
    # Create log entry
    log = NotificationLog.objects.create(
        recipient=recipient,
        subject=subject,
        body_text=message,
        body_html=html_message,
        status='pending',
        backend_used=backend_name
    )
    
    try:
        success = service.send_one(
            recipient=recipient,
            subject=subject,
            message=message,
            html_message=html_message,
            from_email=from_email,
            **kwargs
        )
        
        if success:
            log.status = 'sent'
            log.sent_at = timezone.now()
        else:
            log.status = 'failed'
            log.error_message = "Service returned False (unknown error)"
            
        log.save()
        return success
        
    except Exception as e:
        log.status = 'failed'
        log.error_message = str(e)
        log.save()
        return False


def send_many(
    recipients: List[str],
    subject: str,
    message: str,
    html_message: Optional[str] = None,
    from_email: Optional[str] = None,
    backend: Optional[str] = None,
    **kwargs: Any
) -> int:
    """
    Utility function to send bulk emails using the configured backend.
    Note: Bulk delivery creates individual logs for each recipient.
    """
    # For simplicity and accurate logging, we wrap send_one for each recipient
    # in this synchronous version. If the backend supports true mass mail,
    # it might be more efficient to handle it differently, but individual logs are better.
    success_count = 0
    for recipient in recipients:
        if send_one(
            recipient=recipient,
            subject=subject,
            message=message,
            html_message=html_message,
            from_email=from_email,
            backend=backend,
            **kwargs
        ):
            success_count += 1
    return success_count
