"""
Admin interface for LMS learning-content management.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import StorageSettings, LearningContent, ContentAccessLog


@admin.register(StorageSettings)
class StorageSettingsAdmin(admin.ModelAdmin):
    """
    Admin for storage settings.
    
    Note: Credentials (AWS keys, Cloudinary keys, etc.) are configured in the .env file,
    not in the database. This admin only controls which backend is active.
    """
    
    list_display = ['backend', 'is_active', 'created_at', 'updated_at', 'credential_status']
    list_filter = ['backend', 'is_active']
    readonly_fields = ['created_at', 'updated_at', 'credential_info']
    
    fieldsets = (
        ('Storage Backend', {
            'fields': ('backend', 'is_active'),
            'description': 'Select the active storage backend. Credentials must be configured in .env file.'
        }),
        ('Credential Information', {
            'fields': ('credential_info',),
            'description': 'Credentials are loaded from environment variables (.env file), not stored in database.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def credential_status(self, obj):
        """Show if credentials are configured for this backend"""
        import os
        
        if obj.backend == 'local':
            return format_html('<span style="color: green;">✓ No credentials required</span>')
        elif obj.backend == 's3':
            required = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_STORAGE_BUCKET_NAME']
            configured = all(os.getenv(key) for key in required)
            if configured:
                return format_html('<span style="color: green;">✓ Configured in .env</span>')
            else:
                return format_html('<span style="color: red;">✗ Missing in .env</span>')
        elif obj.backend == 'cloudinary':
            required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
            configured = all(os.getenv(key) for key in required)
            if configured:
                return format_html('<span style="color: green;">✓ Configured in .env</span>')
            else:
                return format_html('<span style="color: red;">✗ Missing in .env</span>')
        elif obj.backend == 'youtube':
            configured = os.getenv('YOUTUBE_API_KEY')
            if configured:
                return format_html('<span style="color: green;">✓ Configured in .env</span>')
            else:
                return format_html('<span style="color: red;">✗ Missing in .env</span>')
        
        return '-'
    
    credential_status.short_description = 'Credential Status'
    
    def credential_info(self, obj):
        """Display required environment variables for each backend"""
        info = {
            'local': 'No credentials required. Files stored in media/ directory.',
            's3': '''
                <strong>Required environment variables in .env:</strong><br>
                - AWS_ACCESS_KEY_ID<br>
                - AWS_SECRET_ACCESS_KEY<br>
                - AWS_STORAGE_BUCKET_NAME<br>
                - AWS_S3_REGION_NAME (optional, defaults to us-east-1)
            ''',
            'cloudinary': '''
                <strong>Required environment variables in .env:</strong><br>
                - CLOUDINARY_CLOUD_NAME<br>
                - CLOUDINARY_API_KEY<br>
                - CLOUDINARY_API_SECRET
            ''',
            'youtube': '''
                <strong>Required environment variables in .env:</strong><br>
                - YOUTUBE_API_KEY
            '''
        }
        
        return format_html(info.get(obj.backend, 'Unknown backend'))
    
    credential_info.short_description = 'How to Configure'
    
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
