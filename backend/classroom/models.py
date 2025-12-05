import uuid
from django.db import models
from django.contrib.postgres.fields import JSONField as PostgresJSONField
from django.conf import settings
from django.utils import timezone

try:
    # Django 3.1+ has built-in JSONField
    from django.db.models import JSONField
except Exception:
    JSONField = PostgresJSONField


def resource_upload_to(instance, filename):
    return settings.CLASSROOM_RESOURCE_UPLOAD_TO + filename


def submission_upload_to(instance, filename):
    return settings.CLASSROOM_SUBMISSION_UPLOAD_TO + filename


class CourseCache(models.Model):
    external_id = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=512)
    code = models.CharField(max_length=128, blank=True, null=True)
    data = JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.code or self.title}"


class EnrollmentCache(models.Model):
    ROLE_CHOICES = (('student', 'Student'), ('instructor', 'Instructor'))

    user_external_id = models.CharField(max_length=255)
    course = models.ForeignKey(CourseCache, on_delete=models.CASCADE, related_name='enrollments')
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    data = JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('user_external_id', 'course'),)
        indexes = [models.Index(fields=['user_external_id']), models.Index(fields=['course'])]

    def __str__(self):
        return f"{self.user_external_id} -> {self.course} ({self.role})"


class Classroom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(CourseCache, on_delete=models.CASCADE, related_name='classrooms')
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    created_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Session(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('ended', 'Ended'),
        ('cancelled', 'Cancelled'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=512)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='scheduled')
    live_provider = models.CharField(max_length=64, default='zoom')
    external_meeting_id = models.CharField(max_length=255, blank=True, null=True)
    join_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.title} ({self.classroom})"


class Resource(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='resources')
    title = models.CharField(max_length=512)
    file = models.FileField(upload_to=resource_upload_to)
    uploaded_by = models.CharField(max_length=255)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class Assignment(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    due_at = models.DateTimeField()
    created_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student_external_id = models.CharField(max_length=255)
    file = models.FileField(upload_to=submission_upload_to)
    marks = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']


class ZoomEventLog(models.Model):
    event_id = models.CharField(max_length=255, unique=True)
    raw = JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.event_id
