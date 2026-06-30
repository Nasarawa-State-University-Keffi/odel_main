import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


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
    
    # Configuration details (keys, host, etc.) stored in JSON
    # This allows flexibility for different backend requirements
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Configuration parameters like API keys, SMTP host, etc.")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Email Configuration")
        verbose_name_plural = _("Email Configurations")

    def __str__(self):
        return f"{self.get_backend_choice_display()} ({'Active' if self.is_active else 'Inactive'})"

    def save(self, *args, **kwargs):
        if self.is_active:
            # Ensure no other configuration is active
            EmailConfiguration.objects.filter(is_active=True).exclude(id=self.id).update(is_active=False)
        super().save(*args, **kwargs)


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
