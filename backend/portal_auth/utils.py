import logging

from django.core.cache import cache

logger = logging.getLogger(__name__)


def fetch_from_portal(cache_key: str, fetcher: callable, ttl: int = 300):
    data = cache.get(cache_key)
    if data is not None:
        logger.info(
            "Portal cache hit cache_key=%s item_count=%s",
            cache_key,
            len(data) if hasattr(data, "__len__") else "unknown",
        )
        return data
    logger.info("Portal cache miss cache_key=%s", cache_key)
    data = fetcher()
    cache.set(cache_key, data, ttl)
    logger.info(
        "Portal cache stored cache_key=%s ttl_seconds=%d item_count=%s",
        cache_key,
        ttl,
        len(data) if hasattr(data, "__len__") else "unknown",
    )
    return data
