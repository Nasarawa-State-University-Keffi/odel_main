"""
Admin interface for learning content management.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import StorageSettings, LearningContent, ContentAccessLog


@admin.register(StorageSettings)
class StorageSettingsAdmin(admin.ModelAdmin):
    """Admin for storage settings."""
    
    list_display = ['backend', 'is_active', 'created_at', 'updated_at']
    list_filter = ['backend', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('General', {
            'fields': ('backend', 'is_active')
        }),
        ('AWS S3 Configuration', {
            'fields': (
                'aws_access_key_id',
                'aws_secret_access_key',
                'aws_storage_bucket_name',
                'aws_s3_region_name'
            ),
            'classes': ('collapse',)
        }),
        ('Cloudinary Configuration', {
            'fields': (
                'cloudinary_cloud_name',
                'cloudinary_api_key',
                'cloudinary_api_secret'
            ),
            'classes': ('collapse',)
        }),
        ('YouTube Configuration', {
            'fields': ('youtube_api_key',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def save_model(self, request, obj, form, change):
        """Clear cache when settings are saved."""
        super().save_model(request, obj, form, change)
        
        # Clear storage engine cache
        from django.core.cache import cache
        cache.delete(f'storage_engine_{obj.backend}')


@admin.register(LearningContent)
class LearningContentAdmin(admin.ModelAdmin):
    """Admin for learning content."""
    
    list_display = [
        'title',
        'content_type',
        'course_link',
        'storage_backend',
        'file_size_display',
        'download_count',
        'is_published',
        'uploaded_by',
        'created_at'
    ]
    
    list_filter = [
        'content_type',
        'storage_backend',
        'is_published',
        'created_at'
    ]
    
    search_fields = [
        'title',
        'description',
        'original_filename',
        'course__title'
    ]
    
    readonly_fields = [
        'id',
        'storage_path',
        'content_hash',
        'file_size',
        'mime_type',
        'download_count',
        'file_url',
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Content Information', {
            'fields': (
                'title',
                'description',
                'content_type',
                'course',
                'is_published'
            )
        }),
        ('File Information', {
            'fields': (
                'original_filename',
                'file_size',
                'mime_type',
                'file_url'
            )
        }),
        ('Storage Information', {
            'fields': (
                'storage_backend',
                'storage_path',
                'content_hash'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': (
                'id',
                'uploaded_by',
                'download_count',
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    def course_link(self, obj):
        """Display course as link."""
        url = reverse('admin:courses_coursecache_change', args=[obj.course.id])
        return format_html('<a href="{}">{}</a>', url, obj.course.title)
    course_link.short_description = 'Course'
    
    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        if not obj.file_size:
            return '-'
        
        # Convert bytes to human-readable
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    file_size_display.short_description = 'File Size'
    
    def file_url(self, obj):
        """Display clickable file URL."""
        url = obj.url
        if url:
            return format_html(
                '<a href="{}" target="_blank">View File</a>',
                url
            )
        return '-'
    file_url.short_description = 'File URL'
    
    actions = ['publish_contents', 'unpublish_contents', 'delete_selected_contents']
    
    def publish_contents(self, request, queryset):
        """Bulk publish contents."""
        updated = queryset.update(is_published=True)
        self.message_user(request, f'{updated} content(s) published successfully.')
    publish_contents.short_description = 'Publish selected contents'
    
    def unpublish_contents(self, request, queryset):
        """Bulk unpublish contents."""
        updated = queryset.update(is_published=False)
        self.message_user(request, f'{updated} content(s) unpublished successfully.')
    unpublish_contents.short_description = 'Unpublish selected contents'
    
    def delete_selected_contents(self, request, queryset):
        """Delete contents and their files from storage."""
        count = queryset.count()
        for content in queryset:
            content.delete()  # This will trigger storage cleanup
        self.message_user(request, f'{count} content(s) deleted successfully.')
    delete_selected_contents.short_description = 'Delete selected contents'


@admin.register(ContentAccessLog)
class ContentAccessLogAdmin(admin.ModelAdmin):
    """Admin for content access logs."""
    
    list_display = [
        'content',
        'user',
        'action',
        'ip_address',
        'accessed_at'
    ]
    
    list_filter = [
        'action',
        'accessed_at'
    ]
    
    search_fields = [
        'content__title',
        'user__username',
        'ip_address'
    ]
    
    readonly_fields = [
        'content',
        'user',
        'action',
        'ip_address',
        'user_agent',
        'accessed_at'
    ]
    
    def has_add_permission(self, request):
        """Disable manual log creation."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Make logs read-only."""
        return False
