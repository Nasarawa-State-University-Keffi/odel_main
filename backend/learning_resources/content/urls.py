"""
URL configuration for the LMS content API.
"""

from django.urls import path

from .api import (
    LearningContentListAPIView,
    LearningContentDetailAPIView,
    LearningContentUploadAPIView,
    YouTubeVideoAddAPIView,
    LearningContentLogAccessAPIView,
    LearningContentStatsAPIView,
    StorageSettingsListCreateAPIView,
    StorageSettingsDetailAPIView,
    ActiveStorageSettingsAPIView,
    AvailableBackendsAPIView,
    ContentAccessLogListAPIView,
    CourseContentAPIView
)

urlpatterns = [
    # Learning Content
    path('', LearningContentListAPIView.as_view(), name='content-list'),
    path('upload/', LearningContentUploadAPIView.as_view(), name='content-upload'),
    path('add-youtube/', YouTubeVideoAddAPIView.as_view(), name='content-add-youtube'),
    path('statistics/', LearningContentStatsAPIView.as_view(), name='content-statistics'),
    path('course/<str:course_id>/', CourseContentAPIView.as_view(), name='course-content-list'),
    path('<uuid:pk>/', LearningContentDetailAPIView.as_view(), name='content-detail'),
    path('<uuid:pk>/log-access/', LearningContentLogAccessAPIView.as_view(), name='content-log-access'),

    # Storage Settings
    path('storage-settings/', StorageSettingsListCreateAPIView.as_view(), name='storage-settings-list'),
    path('storage-settings/active/', ActiveStorageSettingsAPIView.as_view(), name='storage-settings-active'),
    path('storage-settings/backends/', AvailableBackendsAPIView.as_view(), name='storage-settings-backends'),
    path('storage-settings/<int:pk>/', StorageSettingsDetailAPIView.as_view(), name='storage-settings-detail'),

    # Access Logs
    path('content-logs/', ContentAccessLogListAPIView.as_view(), name='content-logs-list'),
]
