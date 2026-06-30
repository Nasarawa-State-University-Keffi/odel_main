from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailConfigurationViewSet

router = DefaultRouter()
router.register(r'settings', EmailConfigurationViewSet, basename='email-settings')

urlpatterns = [
    path('', include(router.urls)),
]
