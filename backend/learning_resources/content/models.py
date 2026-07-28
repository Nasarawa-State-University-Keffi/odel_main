"""
Models for LMS learning-content management.
Implements Moodle-style file areas and storage abstraction.
"""

import uuid
import hashlib
from django.db import models
from django.contrib.auth.models import User

from courses.models import CourseCache
from portal_auth.models import PortalUser


class StorageSettings(models.Model):
    """
    Storage backend configuration.
    Only ONE StorageSettings entry can be active at any given time.
    
    NOTE: Credentials are loaded from environment variables (.env file), not stored in database.
    This model only controls which backend is active.
    """

    BACKEND_CHOICES = (
        ('local', 'Local Filesystem'),
        ('s3', 'Amazon S3'),
        ('cloudinary', 'Cloudinary'),
        ('youtube', 'YouTube'),
    )

    backend = models.CharField(
        max_length=20,
        choices=BACKEND_CHOICES,
        default='local',
        unique=True,
        help_text='Active storage backend. Credentials are loaded from environment variables.'
    )

    is_active = models.BooleanField(
        default=True,
        help_text='Only one configuration can be active.'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Storage Settings'
        verbose_name_plural = 'Storage Settings'

    def save(self, *args, **kwargs):
        """Ensure only one configuration stays active."""
        if self.is_active:
            StorageSettings.objects.exclude(pk=self.pk).update(is_active=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_backend_display()} ({'Active' if self.is_active else 'Inactive'})"


class LearningContent(models.Model):
    """
    LMS Learning Content model with Moodle-like file handling.
    Stores metadata; the actual file lives in the storage backend.
    """

    CONTENT_TYPE_CHOICES = (
        ('note', 'Lecture Note'),
        ('video', 'Video Lecture'),
        ('resource', 'Resource'),
        ('assignment', 'Assignment'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    component = models.CharField(
        max_length=100,
        default='learning_content',
        help_text='Component name (similar to Moodle components).'
    )

    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        db_index=True
    )

    course = models.ForeignKey(
        CourseCache,
        on_delete=models.CASCADE,
        related_name='learning_contents'
    )

    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)

    # Storage info
    storage_path = models.CharField(max_length=512, db_index=True)
    original_filename = models.CharField(max_length=512)
    file_size = models.BigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)

    storage_backend = models.CharField(
        max_length=20,
        default='local',
        help_text='Backend where file is stored.'
    )

    content_hash = models.CharField(
        max_length=64,
        db_index=True,
        blank=True,
        help_text='SHA-256 hash for deduplication.'
    )

    uploaded_by = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_contents'
    )

    is_published = models.BooleanField(default=True)
    download_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course', 'content_type']),
            models.Index(fields=['content_hash']),
            models.Index(fields=['course', 'content_type', 'is_published']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_content_type_display()})"

    # ------- URL RESOLUTION -------
    @property
    def url(self):
        """
        Resolve public URL via storage backend router.
        """
        from learning_resources.storage import get_storage_engine
        try:
            storage = get_storage_engine(self.storage_backend)
            return storage.url(self.storage_path)
        except Exception:
            return ""

    # ------- Utility helpers -------
    @property
    def file_extension(self):
        if '.' in self.original_filename:
            return self.original_filename.rsplit('.', 1)[1].lower()
        return ''

    @property
    def is_video(self):
        return self.content_type == 'video' or self.storage_backend == 'youtube'

    @property
    def is_document(self):
        return self.file_extension.lower() in [
            'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'
        ]

    def increment_downloads(self):
        self.download_count = models.F('download_count') + 1
        self.save(update_fields=['download_count'])

    # ------- Safe deletion -------
    def delete(self, *args, **kwargs):
        """
        Delete file from storage backend and then DB entry.
        """
        from learning_resources.storage import get_storage_engine

        try:
            engine = get_storage_engine(self.storage_backend)
            engine.delete(self.storage_path)
        except Exception:
            # You may log this exception for debugging.
            pass

        super().delete(*args, **kwargs)


class ContentAccessLog(models.Model):
    """
    Track content access for analytics.
    Similar to Moodle logging.
    """

    content = models.ForeignKey(
        LearningContent,
        on_delete=models.CASCADE,
        related_name='access_logs'
    )

    user = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True
    )

    action = models.CharField(
        max_length=20,
        choices=(('view', 'View'), ('download', 'Download')),
    )

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    accessed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['content', 'accessed_at']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action} - {self.content.title}"
