from django.contrib import admin
from .models import EmailConfiguration, NotificationLog


# Register your models here.

@admin.register(EmailConfiguration)
class EmailConfigurationAdmin(admin.ModelAdmin):
    list_display = ('backend_choice', 'is_active', 'updated_at')
    list_filter = ('backend_choice', 'is_active')
    search_fields = ('backend_choice',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('backend_choice', 'is_active', 'config')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'subject', 'status', 'backend_used', 'created_at')
    list_filter = ('status', 'backend_used', 'created_at')
    search_fields = ('recipient', 'subject', 'body_text')
    readonly_fields = ('id', 'recipient', 'subject', 'body_text', 'body_html', 
                       'status', 'error_message', 'backend_used', 'sent_at', 'created_at')
    
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
