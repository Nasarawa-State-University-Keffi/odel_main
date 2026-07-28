import requests
from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.cache import cache

from .services import sync_all

logger = get_task_logger(__name__)

SYNC_LOCK_KEY = 'synchronization:sync_all:running'
SYNC_LOCK_TIMEOUT = 30 * 60


@shared_task(
    bind=True,
    autoretry_for=(requests.ConnectionError, requests.Timeout),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3},
)
def sync_all_task(self):
    task_id = self.request.id
    if not cache.add(SYNC_LOCK_KEY, task_id, timeout=SYNC_LOCK_TIMEOUT):
        active_task_id = cache.get(SYNC_LOCK_KEY)
        logger.info(
            'Synchronization skipped task_id=%s active_task_id=%s reason=already_running',
            task_id,
            active_task_id,
        )
        return {
            'status': 'skipped',
            'reason': 'already_running',
            'active_task_id': active_task_id,
        }

    logger.info('Synchronization started task_id=%s', task_id)
    try:
        result = sync_all()
    except Exception:
        logger.exception('Synchronization failed task_id=%s', task_id)
        raise
    finally:
        if cache.get(SYNC_LOCK_KEY) == task_id:
            cache.delete(SYNC_LOCK_KEY)

    logger.info('Synchronization completed task_id=%s counts=%s', task_id, result)
    return result
