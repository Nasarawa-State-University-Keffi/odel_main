from django.core.cache import cache

def fetch_from_portal(cache_key: str, fetcher: callable, ttl: int = 300):
    data = cache.get(cache_key)
    if data is not None:
        return data
    data = fetcher()
    cache.set(cache_key, data, ttl)
    return data
