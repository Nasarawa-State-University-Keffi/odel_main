from django.db import models
from django.conf import settings
from django.core.cache import cache


class AppSetting(models.Model):
    """
    Database-driven dynamic settings for the application.
    Supports caching for performance.
    """
    TYPE_CHOICES = (
        ('string', 'String'),
        ('boolean', 'Boolean'),
        ('integer', 'Integer'),
        ('json', 'JSON'),
    )
    
    key = models.CharField(max_length=255, unique=True, db_index=True, 
                          help_text="Unique setting key (e.g., REQUIRE_EMAIL_VERIFICATION)")
    value = models.TextField(help_text="Setting value (stored as text, converted based on type)")
    value_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='string',
                                  help_text="Data type for proper conversion")
    description = models.TextField(blank=True, 
                                   help_text="Description of what this setting controls")
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='updated_settings')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'App Setting'
        verbose_name_plural = 'App Settings'
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key} = {self.value}"
    
    def get_value(self):
        """Convert stored value to appropriate type"""
        import json
        
        if self.value_type == 'boolean':
            return self.value.lower() in ('true', '1', 'yes', 'on')
        elif self.value_type == 'integer':
            try:
                return int(self.value)
            except (ValueError, TypeError):
                return 0
        elif self.value_type == 'json':
            try:
                return json.loads(self.value)
            except json.JSONDecodeError:
                return {}
        else:  # string
            return self.value
    
    def save(self, *args, **kwargs):
        """Invalidate cache when setting is saved"""
        super().save(*args, **kwargs)
        self.invalidate_cache()
    
    def delete(self, *args, **kwargs):
        """Invalidate cache when setting is deleted"""
        self.invalidate_cache()
        super().delete(*args, **kwargs)
    
    def invalidate_cache(self):
        """Remove this setting from cache"""
        cache_key = f'app_setting_{self.key}'
        cache.delete(cache_key)
    
    @classmethod
    def clear_all_cache(cls):
        """Clear all app settings from cache"""
        # This requires cache backend that supports pattern deletion
        # For simple cases, we track keys
        cache.delete_many([f'app_setting_{key}' for key in cls.objects.values_list('key', flat=True)])
