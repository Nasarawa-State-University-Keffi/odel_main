from django.apps import AppConfig


class AdmissionsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admissions'
    
    def ready(self):
        """Import signals when app is ready"""
        import admissions.signals  # noqa
