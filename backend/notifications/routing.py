from django.urls import re_path
from . import consumers
from learning_resources.content.forum import ForumConsumer
from channels.security.websocket import OriginValidator
from django.conf import settings

forum_origins = ['*'] if getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False) else (
    getattr(settings, 'CSRF_TRUSTED_ORIGINS', []) + getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
)

websocket_urlpatterns = [
    re_path(r'^ws/forums/(?P<pk>[0-9a-f-]{36})/$', OriginValidator(ForumConsumer.as_asgi(), forum_origins)),
    re_path(r'^ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]
