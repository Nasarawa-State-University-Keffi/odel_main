from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import Applicant
from .models import Application
from core.utils import get_setting
from core.logging import get_logger

logger = get_logger(__name__)


@receiver(post_save, sender=Applicant)
def create_application_for_applicant(sender, instance, created, **kwargs):
    """
    Auto-create a draft Application when Applicant profile is created
    """
    if created:
        # Get current session from settings
        current_session = get_setting(
            'CURRENT_ADMISSION_SESSION',
            default='2024/2025'
        )
        
        # Create draft application with mode_of_entry from applicant
        application = Application.objects.create(
            applicant=instance,
            session=current_session,
            mode_of_entry=instance.mode_of_entry,  # Use mode_of_entry from applicant profile
            sitting_type='one',  # Default to one sitting
            status='draft'
        )
        
        logger.info(
            f"Auto-created draft application (ID: {application.id}) "
            f"for applicant {instance.applicant_id} with mode_of_entry={instance.mode_of_entry}"
        )
