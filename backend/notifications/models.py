import uuid

from django.db import models, transaction
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from django.conf import settings

from .config import validate_email_configuration


class EmailConfiguration(models.Model):
    """
    Admin-controlled configuration for the active email backend.
    """
    BACKEND_CHOICES = [
        ('smtp', 'SMTP (Standard)'),
        ('resend', 'Resend API'),
        ('brevo', 'Brevo (Sendinblue) API'),
        ('console', 'Console (Development)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    backend_choice = models.CharField(
        max_length=20,
        choices=BACKEND_CHOICES,
        default='console',
        help_text=_("The active email delivery service.")
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_("Only one configuration should be active at a time.")
    )
    
    # Flexible non-sensitive configuration. Provider credentials stay in the
    # process environment and are never accepted through this model.
    config = models.JSONField(
        default=dict,
        blank=True,
        validators=[validate_email_configuration],
        help_text=_("Non-sensitive configuration such as the default sender address.")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Email Configuration")
        verbose_name_plural = _("Email Configurations")
        constraints = [
            models.UniqueConstraint(
                fields=['is_active'],
                condition=Q(is_active=True),
                name='notifications_one_active_email_configuration',
            ),
        ]

    def __str__(self):
        return f"{self.get_backend_choice_display()} ({'Active' if self.is_active else 'Inactive'})"

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.is_active:
                # The database constraint is the final guard; this update preserves
                # the convenient "activating one deactivates the rest" behavior.
                EmailConfiguration.objects.filter(is_active=True).exclude(id=self.id).update(is_active=False)
            super().save(*args, **kwargs)

        from .services.router import clear_email_service_cache
        clear_email_service_cache()

    def delete(self, *args, **kwargs):
        result = super().delete(*args, **kwargs)
        from .services.router import clear_email_service_cache
        clear_email_service_cache()
        return result


class NotificationLog(models.Model):
    """
    Log of all sent notifications for auditing and troubleshooting.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    body_text = models.TextField()
    body_html = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(null=True, blank=True)
    backend_used = models.CharField(max_length=50)
    
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Notification Log")
        verbose_name_plural = _("Notification Logs")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient} - {self.subject} ({self.status})"


class NotificationType(models.TextChoices):
    ASSIGNMENT_POSTED = 'ASSIGNMENT_POSTED', _('Assignment Posted')
    DEADLINE_EXTENDED = 'DEADLINE_EXTENDED', _('Deadline Extended')
    GENERAL = 'GENERAL', _('General Notification')


class InAppNotification(models.Model):
    """
    In-App notifications for users (students and staff).
    Stores notifications for offline viewing and tracking read state.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        'portal_auth.PortalUser',
        on_delete=models.CASCADE,
        related_name='in_app_notifications'
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL
    )
    title = models.CharField(max_length=255)
    message = models.TextField()

    assignment_id = models.UUIDField(null=True, blank=True)
    course_id = models.BigIntegerField(null=True, blank=True)
    action_url = models.CharField(max_length=512, null=True, blank=True)

    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("In-App Notification")
        verbose_name_plural = _("In-App Notifications")
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
        ]

    def __str__(self):
        return f"{self.notification_type} -> {self.recipient}: {self.title}"

