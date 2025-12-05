"""Signal handlers for classroom models."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Session


@receiver(post_save, sender=Session)
def session_post_save(sender, instance: Session, created: bool, **kwargs):
    """Trigger Zoom meeting creation when a new Session is created.
    
    Uses Celery task queue for reliable async processing with retries.
    """
    if created and instance.live_provider == 'zoom' and not instance.external_meeting_id:
        # Import here to avoid circular imports
        from .tasks import create_zoom_meeting_task
        
        # Queue task for async execution
        create_zoom_meeting_task.delay(str(instance.pk))
