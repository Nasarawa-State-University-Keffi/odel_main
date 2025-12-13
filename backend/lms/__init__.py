# lms package

# Import Celery app so Django can discover it
from .celery import app as celery_app

__all__ = ('celery_app',)
