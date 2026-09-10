"""Background maintenance tasks for assessment attempts."""

from celery import shared_task
from django.utils import timezone

from .models import QuizAttempt
from .services import QuizService


@shared_task(name='assessment.expire_due_quiz_attempts')
def expire_due_quiz_attempts():
    """Finalize active attempts whose quiz close time or personal limit has elapsed."""
    now = timezone.now()
    expired_count = 0
    attempts = QuizAttempt.objects.filter(state='in_progress').select_related('quiz')
    for attempt in attempts.iterator():
        if QuizService.expire_attempt_if_needed(attempt, now=now):
            expired_count += 1
    return expired_count
