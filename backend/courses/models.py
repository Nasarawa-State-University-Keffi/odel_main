from django.db import models


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

    programme_id = models.IntegerField(null=True, blank=True)
    semester_id = models.IntegerField(null=True, blank=True)
    session_id = models.IntegerField(null=True, blank=True)

    last_synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["course_title"]
        
    def __str__(self):
        return f"{self.course_code} - {self.course_title}"
    
class StudentRegisteredCourse(models.Model):
    student_external_id = models.CharField(max_length=255, db_index=True)
    course = models.ForeignKey(CourseCache, on_delete=models.CASCADE,
                                related_name='student_enrollments', db_index=True)
    session_id = models.PositiveIntegerField(db_index=True)
    semester_id = models.PositiveIntegerField(db_index=True)

    class Meta:
        unique_together = ('student_external_id', 'course', 'session_id', 'semester_id')
        ordering = ['-course__course_title']
        

class StaffRegisteredCourse(models.Model):
    staff_external_id = models.CharField(max_length=255, db_index=True)
    course = models.ForeignKey(CourseCache, on_delete=models.CASCADE, related_name='staff_enrollments', db_index=True)
    role = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('staff_external_id', 'course'),)
        indexes = [models.Index(fields=['staff_external_id']), models.Index(fields=['course'])]

    def __str__(self):
        return f"{self.staff_external_id} -> {self.course} ({self.role})"
