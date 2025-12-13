from django.apps import AppConfig


class CoursesConfig(AppConfig):
    name = 'courses'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        # Import signals
        try:
            import courses.signals  # noqa: F401
        except Exception:
            pass
