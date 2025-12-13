from django.db import models
from django.contrib.postgres.fields import JSONField as PostgresJSONField

try:
    # Django 3.1+ has built-in JSONField
    from django.db.models import JSONField
except Exception:
    JSONField = PostgresJSONField


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
