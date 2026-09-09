from django.db import models
from django.db.models.functions import Lower

from portal_auth.models import PortalUser


class AcademicSession(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(Lower('name'), name='unique_academic_session_name_ci'),
        ]

    def __str__(self):
        return self.name


class Semester(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']
        constraints = [
            models.UniqueConstraint(Lower('name'), name='unique_semester_name_ci'),
        ]

    def __str__(self):
        return self.name


class CourseCache(models.Model):
    id = models.BigAutoField(primary_key=True)

    course_external_id = models.PositiveIntegerField(unique=True, db_index=True)
    course_title = models.CharField(max_length=512)
    course_code = models.CharField(max_length=128)

    credit_unit = models.FloatField(null=True, blank=True)
    level = models.CharField(max_length=50, db_index=True, null=True, blank=True)

    department_id = models.IntegerField(db_index=True, null=True, blank=True)
    department_code = models.CharField(max_length=20, db_index=True, null=True, blank=True)
    department_name = models.CharField(max_length=255, null=True, blank=True)

    last_synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["course_title"]

    def __str__(self):
        return f"{self.course_code} - {self.course_title}"


class CourseOffering(models.Model):
    """A term-specific delivery of a portal course inside the LMS."""

    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('archived', 'Archived'),
    )

    id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey(
        CourseCache,
        on_delete=models.CASCADE,
        related_name='offerings',
    )
    session = models.ForeignKey(
        AcademicSession,
        on_delete=models.PROTECT,
        related_name='course_offerings',
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.PROTECT,
        related_name='course_offerings',
    )
    programme_type_code = models.CharField(max_length=100, db_index=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True,
    )
    last_synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-session__name', 'semester__name', 'course__course_code']
        constraints = [
            models.UniqueConstraint(
                fields=['course', 'session', 'semester', 'programme_type_code'],
                name='unique_course_offering_context',
            ),
        ]
        indexes = [
            models.Index(
                fields=['session', 'semester', 'programme_type_code', 'status'],
                name='course_offering_context_idx',
            ),
        ]

    def __str__(self):
        return (
            f"{self.course.course_code} - {self.session.name} / "
            f"{self.semester.name} ({self.programme_type_code})"
        )
    
class StudentRegisteredCourse(models.Model):
    student_external = models.ForeignKey(
        PortalUser,
        to_field='external_id',
        db_column='student_external_id',
        on_delete=models.PROTECT,
        related_name='registered_courses',
    )
    course = models.ForeignKey(CourseCache, on_delete=models.CASCADE,
                                related_name='student_enrollments', db_index=True)
    session = models.CharField(max_length=50, db_index=True)
    semester = models.CharField(max_length=100, db_index=True)

    class Meta:
        unique_together = ('student_external', 'course', 'session', 'semester')
        ordering = ['-course__course_title']
        

class StaffAssignedCourse(models.Model):
    staff_external_id = models.CharField(max_length=255, db_index=True)
    course = models.ForeignKey(CourseCache, on_delete=models.CASCADE, related_name='staff_enrollments', db_index=True)
    course_offering = models.ForeignKey(
        CourseOffering,
        on_delete=models.CASCADE,
        related_name='teaching_assignments',
        null=True,
        blank=True,
        help_text='Term-specific course context. Null is retained for legacy records.',
    )
    programme_type_code = models.CharField(max_length=100, db_index=True, default='UNKNOWN')
    role = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['staff_external_id', 'course_offering'],
                condition=models.Q(course_offering__isnull=False),
                name='unique_staff_course_offering',
            ),
            models.UniqueConstraint(
                fields=['staff_external_id', 'course', 'programme_type_code'],
                condition=models.Q(course_offering__isnull=True),
                name='unique_legacy_staff_course',
            ),
        ]
        indexes = [
            models.Index(fields=['staff_external_id']),
            models.Index(fields=['course']),
            models.Index(
                fields=['staff_external_id', 'course_offering'],
                name='staff_course_offering_idx',
            ),
        ]

    def __str__(self):
        return f"{self.staff_external_id} -> {self.course} ({self.role})"
