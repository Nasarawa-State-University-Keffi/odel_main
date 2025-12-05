from django.contrib import admin
from .models import CourseCache, EnrollmentCache, Classroom, Session, Resource, Assignment, Submission, ZoomEventLog


@admin.register(CourseCache)
class CourseCacheAdmin(admin.ModelAdmin):
    list_display = ('external_id', 'title', 'code', 'updated_at')


@admin.register(EnrollmentCache)
class EnrollmentCacheAdmin(admin.ModelAdmin):
    list_display = ('user_external_id', 'course', 'role', 'created_at')


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'course', 'created_by', 'created_at')


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'classroom', 'start_time', 'status')


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'classroom', 'uploaded_by', 'created_at')


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'classroom', 'due_at')


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'assignment', 'student_external_id', 'created_at')


@admin.register(ZoomEventLog)
class ZoomEventLogAdmin(admin.ModelAdmin):
    list_display = ('event_id', 'created_at')
