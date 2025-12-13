from django.contrib import admin
from .models import CourseCache, EnrollmentCache


@admin.register(CourseCache)
class CourseCacheAdmin(admin.ModelAdmin):
    list_display = ('external_id', 'title', 'code', 'updated_at')
    search_fields = ('external_id', 'title', 'code')
    list_filter = ('updated_at',)


@admin.register(EnrollmentCache)
class EnrollmentCacheAdmin(admin.ModelAdmin):
    list_display = ('user_external_id', 'course', 'role', 'created_at')
    search_fields = ('user_external_id', 'course__title')
    list_filter = ('role', 'created_at')
