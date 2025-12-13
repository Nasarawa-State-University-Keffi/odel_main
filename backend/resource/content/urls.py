"""
URL configuration for content API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .api import (
    LearningContentViewSet,
    StorageSettingsViewSet,
    ContentAccessLogViewSet
)

# Create router
router = DefaultRouter()
router.register(r'content', LearningContentViewSet, basename='content')
router.register(r'storage-settings', StorageSettingsViewSet, basename='storage-settings')
router.register(r'content-logs', ContentAccessLogViewSet, basename='content-logs')

urlpatterns = [
    path('', include(router.urls)),
]
