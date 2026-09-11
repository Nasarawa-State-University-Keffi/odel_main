"""
URL configuration for the LMS content API.
"""

from django.urls import path

from .api import (
    CourseModuleListCreateAPIView,
    CourseModuleDetailAPIView,
    StudentCourseModulesAPIView,
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
    CourseContentAPIView,
    LessonDiscussionAPIView,
    StudyGroupListCreateAPIView,
    StudyGroupDetailAPIView,
    StudyGroupJoinAPIView,
    StudyGroupMaterialListCreateAPIView,
    StudyGroupCommentListCreateAPIView,
)

urlpatterns = [
    # Course modules
    path('modules/', CourseModuleListCreateAPIView.as_view(), name='course-module-list'),
    path('modules/<uuid:pk>/', CourseModuleDetailAPIView.as_view(), name='course-module-detail'),

    # Learning Content
    path('', LearningContentListAPIView.as_view(), name='content-list'),
    path('upload/', LearningContentUploadAPIView.as_view(), name='content-upload'),
    path('add-youtube/', YouTubeVideoAddAPIView.as_view(), name='content-add-youtube'),
    path('statistics/', LearningContentStatsAPIView.as_view(), name='content-statistics'),
    path('course/<str:course_id>/', CourseContentAPIView.as_view(), name='course-content-list'),
    path('course/<str:course_id>/modules/', StudentCourseModulesAPIView.as_view(), name='student-course-modules'),
    path('<uuid:pk>/', LearningContentDetailAPIView.as_view(), name='content-detail'),
    path('<uuid:pk>/log-access/', LearningContentLogAccessAPIView.as_view(), name='content-log-access'),
    path('<uuid:pk>/discussion/', LessonDiscussionAPIView.as_view(), name='lesson-discussion'),

    # Student study groups
    path('study-groups/', StudyGroupListCreateAPIView.as_view(), name='study-group-list-create'),
    path('study-groups/<uuid:pk>/', StudyGroupDetailAPIView.as_view(), name='study-group-detail'),
    path('study-groups/<uuid:pk>/join/', StudyGroupJoinAPIView.as_view(), name='study-group-join'),
    path('study-groups/<uuid:pk>/materials/', StudyGroupMaterialListCreateAPIView.as_view(), name='study-group-materials'),
    path('study-groups/<uuid:pk>/comments/', StudyGroupCommentListCreateAPIView.as_view(), name='study-group-comments'),

    # Storage Settings
    path('storage-settings/', StorageSettingsListCreateAPIView.as_view(), name='storage-settings-list'),
    path('storage-settings/active/', ActiveStorageSettingsAPIView.as_view(), name='storage-settings-active'),
    path('storage-settings/backends/', AvailableBackendsAPIView.as_view(), name='storage-settings-backends'),
    path('storage-settings/<int:pk>/', StorageSettingsDetailAPIView.as_view(), name='storage-settings-detail'),

    # Access Logs
    path('content-logs/', ContentAccessLogListAPIView.as_view(), name='content-logs-list'),
]
