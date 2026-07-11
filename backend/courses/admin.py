from django.contrib import admin
from .models import CourseCache, StaffAssignedCourse, StudentRegisteredCourse


@admin.register(CourseCache)
class CourseCacheAdmin(admin.ModelAdmin):
    list_display = ('course_external_id', 'course_title', 'course_code',"department_name", 'updated_at')
    search_fields = ('course_external_id', 'course_title', 'course_code', 'department_name')
    list_filter = ('updated_at',)


@admin.register(StaffAssignedCourse)
class StaffRegisteredCourseAdmin(admin.ModelAdmin):
    list_display = ('staff_external_id', 'course', 'programme_type_code', 'role', 'created_at')
    search_fields = ('staff_external_id', 'course__course_title')
    list_filter = ('programme_type_code', 'role', 'created_at')

@admin.register(StudentRegisteredCourse)
class StudentRegisteredCourseAdmin(admin.ModelAdmin):
    list_display = ('student_external_id', 'course', 'session', 'semester')
    search_fields = ('student_external_id', 'course__course_title')
    list_filter = ('session', 'semester')
