"""Celery tasks for classroom app."""
from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def create_zoom_meeting_task(self, session_id: str):
    """Create Zoom meeting for a session asynchronously.
    
    Args:
        session_id: UUID of the Session instance
        
    Returns:
        dict with meeting_id and join_url on success
    """
    try:
        from .models import Session
        from .services.zoom import create_meeting
        
        session = Session.objects.get(pk=session_id)
        
        # Skip if already has meeting or not Zoom provider
        if session.live_provider != 'zoom' or session.external_meeting_id:
            logger.info(f"Session {session_id} already has meeting or not Zoom provider")
            return {'status': 'skipped'}
        
        # Get instructor email from created_by field
        instructor_email = session.classroom.created_by
        
        # Create meeting with Zoom API
        start_time = session.start_time.isoformat()
        duration = int((session.end_time - session.start_time).total_seconds() / 60) if session.end_time else 60
        
        meeting_id, join_url = create_meeting(
            instructor_email=instructor_email,
            topic=session.title,
            start_time=start_time,
            duration=duration
        )
        
        # Update session with meeting details
        session.external_meeting_id = meeting_id
        session.join_url = join_url
        session.status = 'scheduled'
        session.save(update_fields=['external_meeting_id', 'join_url', 'status'])
        
        logger.info(f"Created Zoom meeting {meeting_id} for session {session_id}")
        return {
            'status': 'success',
            'meeting_id': meeting_id,
            'join_url': join_url
        }
        
    except Exception as exc:
        logger.error(f"Failed to create Zoom meeting for session {session_id}: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc)
