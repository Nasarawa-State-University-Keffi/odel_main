import logging
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from assessment.models import Assignment
from notifications.services.in_app import (
    dispatch_assignment_posted_sync,
    dispatch_deadline_extended_sync
)

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Assignment)
def cache_previous_assignment_state(sender, instance, **kwargs):
    """
    Caches previous `is_published` and `due_at` values before save
    to detect state transitions in post_save.
    """
    if instance.pk:
        try:
            old_instance = Assignment.objects.get(pk=instance.pk)
            instance._old_is_published = old_instance.is_published
            instance._old_due_at = old_instance.due_at
        except Assignment.DoesNotExist:
            instance._old_is_published = False
            instance._old_due_at = None
    else:
        instance._old_is_published = False
        instance._old_due_at = None


@receiver(post_save, sender=Assignment)
def trigger_assignment_notifications(sender, instance, created, **kwargs):
    """
    Triggers synchronous in-app notifications and WebSocket real-time broadcasts
    when an assignment is posted or when its deadline is extended.
    """
    old_is_published = getattr(instance, '_old_is_published', False)
    old_due_at = getattr(instance, '_old_due_at', None)

    try:
        # Case 1: Assignment newly published
        if instance.is_published and not old_is_published:
            count = dispatch_assignment_posted_sync(instance)
            logger.info(f"Dispatched {count} assignment posted notifications for assignment '{instance.title}' ({instance.id}).")

        # Case 2: Deadline extended for an already published assignment
        elif instance.is_published and old_due_at and instance.due_at > old_due_at:
            count = dispatch_deadline_extended_sync(instance, old_due_at)
            logger.info(f"Dispatched {count} deadline extended notifications for assignment '{instance.title}' ({instance.id}).")

    except Exception as e:
        logger.error(f"Error dispatching assignment notifications for assignment {instance.id}: {e}", exc_info=True)
