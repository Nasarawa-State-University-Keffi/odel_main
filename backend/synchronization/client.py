from urllib.parse import urljoin

import requests
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class UpstreamSynchronizationClient:
    def __init__(self):
        self.base_url = settings.PORTAL_SYNC_BASE_URL
        self.public_key = settings.PORTAL_SYNC_PUBLIC_KEY
        self.private_key = settings.PORTAL_SYNC_PRIVATE_KEY
        if not all((self.base_url, self.public_key, self.private_key)):
            raise ImproperlyConfigured(
                'PORTAL_SYNC_BASE_URL, PORTAL_SYNC_PUBLIC_KEY, and '
                'PORTAL_SYNC_PRIVATE_KEY must be configured'
            )

    def get(self, path, params=None):
        url = urljoin(f'{self.base_url.rstrip("/")}/', path.lstrip('/'))
        response = requests.get(
            url,
            headers={'Identity': self.public_key, 'Secret': self.private_key},
            params=params,
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, list):
            raise ValueError(f'Expected an array from {path}')
        return data

    def programme_types(self):
        return self.get('/api/v1/attendance/programme_types/all')

    def faculties(self):
        return self.get('/api/v1/attendance/faculties/all')

    def departments(self):
        return self.get('/api/v1/attendance/departments/all')

    def programmes(self, programme_type_code):
        return self.get(
            '/api/v1/attendance/programmes/all',
            params={'programme_type': programme_type_code},
        )
