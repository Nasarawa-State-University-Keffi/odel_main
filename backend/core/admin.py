from django.contrib import admin
from django.utils.html import format_html
from .models import AppSetting


@admin.register(AppSetting)
class AppSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'display_value', 'value_type', 'updated_at', 'updated_by')
    list_filter = ('value_type', 'updated_at')
    search_fields = ('key', 'description', 'value')
    readonly_fields = ('created_at', 'updated_at', 'updated_by')
    
    fieldsets = (
        ('Setting Information', {
            'fields': ('key', 'value', 'value_type', 'description')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def display_value(self, obj):
        """Display formatted value with type indicator"""
        value = obj.get_value()
        if obj.value_type == 'boolean':
            icon = '✅' if value else '❌'
            color = 'green' if value else 'red'
            return format_html(
                '<span style="color: {};">{} {}</span>',
                color, icon, value
            )
        elif len(str(value)) > 50:
            return format_html(
                '<span title="{}">{}</span>',
                value, str(value)[:50] + '...'
            )
        return value
    
    display_value.short_description = 'Value'
    
    def save_model(self, request, obj, form, change):
        """Automatically set updated_by to current user"""
        if not change or not obj.updated_by:
            obj.updated_by = request.user
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Make key readonly when editing existing settings"""
        if obj:  # Editing existing object
            return self.readonly_fields + ('key',)
        return self.readonly_fields
    
    class Media:
        css = {
            'all': ('admin/css/forms.css',)
        }
