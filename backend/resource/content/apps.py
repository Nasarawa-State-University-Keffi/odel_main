"""
Content app configuration.
"""

from django.apps import AppConfig


class ContentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'resource.content'
    verbose_name = 'Learning Content Management'
