from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailConfigurationViewSet, NotificationLogViewSet, InAppNotificationViewSet

router = DefaultRouter()
router.register(r'settings', EmailConfigurationViewSet, basename='email-settings')
router.register(r'logs', NotificationLogViewSet, basename='notification-logs')
router.register(r'in-app', InAppNotificationViewSet, basename='in-app-notifications')

urlpatterns = [
    path('', include(router.urls)),
]

