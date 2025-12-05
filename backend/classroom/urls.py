from rest_framework import routers
from django.urls import path, include
from .views import (
    CourseCacheViewSet, ClassroomViewSet, SessionViewSet, ResourceViewSet, AssignmentViewSet, SubmissionViewSet, ZoomWebhookView,
)

router = routers.DefaultRouter()
router.register(r'courses', CourseCacheViewSet, basename='coursecache')
router.register(r'classrooms', ClassroomViewSet, basename='classroom')
router.register(r'sessions', SessionViewSet, basename='session')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', SubmissionViewSet, basename='submission')

urlpatterns = [
    path('', include(router.urls)),
    path('webhooks/zoom/', ZoomWebhookView.as_view(), name='zoom-webhook'),
]
