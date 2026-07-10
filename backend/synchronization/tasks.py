import requests
from celery import shared_task

from .services import sync_all


@shared_task(
    autoretry_for=(requests.ConnectionError, requests.Timeout),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3},
)
def sync_all_task():
    return sync_all()
