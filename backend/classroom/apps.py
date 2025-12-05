from django.apps import AppConfig


class ClassroomConfig(AppConfig):
    name = 'classroom'

    def ready(self):
        # Import signals
        try:
            import classroom.signals  # noqa: F401
        except Exception:
            pass
