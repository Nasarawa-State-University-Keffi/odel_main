from django.contrib import admin
from .models import AcademicSession, CourseCache, CourseOffering, Semester, StaffAssignedCourse, StudentRegisteredCourse


@admin.register(AcademicSession)
class AcademicSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(CourseCache)
class CourseCacheAdmin(admin.ModelAdmin):
    list_display = ('course_external_id', 'course_title', 'course_code',"department_name", 'updated_at')
    search_fields = ('course_external_id', 'course_title', 'course_code', 'department_name')
    list_filter = ('updated_at',)


@admin.register(StaffAssignedCourse)
class StaffRegisteredCourseAdmin(admin.ModelAdmin):
    list_display = ('staff_external_id', 'course', 'course_offering', 'programme_type_code', 'role', 'created_at')
    search_fields = ('staff_external_id', 'course__course_title')
    list_filter = ('programme_type_code', 'role', 'created_at')


@admin.register(CourseOffering)
class CourseOfferingAdmin(admin.ModelAdmin):
    list_display = ('course', 'session', 'semester', 'programme_type_code', 'status', 'last_synced_at')
    list_filter = ('session', 'semester', 'programme_type_code', 'status')
    search_fields = ('course__course_code', 'course__course_title')

@admin.register(StudentRegisteredCourse)
class StudentRegisteredCourseAdmin(admin.ModelAdmin):
    list_display = ('student_external_id', 'course', 'session', 'semester')
    search_fields = ('student_external__external_id', 'course__course_title')
    list_filter = ('session', 'semester')
