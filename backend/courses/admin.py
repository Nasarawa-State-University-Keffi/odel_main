from django.contrib import admin
from .models import CourseCache, StaffAssignedCourse, StudentRegisteredCourse


@admin.register(CourseCache)
class CourseCacheAdmin(admin.ModelAdmin):
    list_display = ('course_external_id', 'course_title', 'course_code',"department_name", 'updated_at')
    search_fields = ('course_external_id', 'course_title', 'course_code', 'department_name')
    list_filter = ('updated_at',)


@admin.register(StaffAssignedCourse)
class StaffRegisteredCourseAdmin(admin.ModelAdmin):
    list_display = ('staff_external_id', 'course', 'role', 'created_at')
    search_fields = ('staff_external_id', 'course__course_title')
    list_filter = ('role', 'created_at')

@admin.register(StudentRegisteredCourse)
class StudentRegisteredCourseAdmin(admin.ModelAdmin):
    list_display = ('student_external_id', 'course', 'session_id', 'semester_id')
    search_fields = ('student_external_id', 'course__course_title')
    list_filter = ('session_id', 'semester_id')
