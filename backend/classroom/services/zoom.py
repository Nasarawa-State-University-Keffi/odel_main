"""Zoom integration utilities: JWT generation and meeting creation."""
from __future__ import annotations
import time
import jwt
import requests
from typing import Tuple, Dict, Any
from django.conf import settings


def _generate_jwt() -> str:
    key = settings.ZOOM_API_KEY
    secret = settings.ZOOM_API_SECRET
    if not key or not secret:
        raise RuntimeError('Zoom API key/secret not configured')

    payload = {
        'iss': key,
        'exp': int(time.time()) + 60,
    }
    token = jwt.encode(payload, secret, algorithm='HS256')
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def create_meeting(instructor_email: str, topic: str, start_time: str, duration: int = 60) -> Tuple[str, str]:
    """Create a Zoom meeting and return (meeting_id, join_url).

    start_time should be ISO-8601 string (UTC) or Zoom-acceptable time.
    """
    token = _generate_jwt()
    url = 'https://api.zoom.us/v2/users/{user}/meetings'.format(user=instructor_email)
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
    }
    payload = {
        'topic': topic,
        'type': 2,  # scheduled meeting
        'start_time': start_time,
        'duration': duration,
        'settings': {
            'join_before_host': False,
            'approval_type': 0,
            'waiting_room': True,
        }
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        resp.raise_for_status()
    except Exception as exc:
        raise RuntimeError(f'Zoom API error: {exc}')

    data = resp.json()
    meeting_id = str(data.get('id'))
    join_url = data.get('join_url') or data.get('start_url')
    return meeting_id, join_url
