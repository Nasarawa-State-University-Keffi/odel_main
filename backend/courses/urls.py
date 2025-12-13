"""
Courses App URLs - API-only endpoints

All template-based frontend views have been removed.
Only REST API endpoints are available.
"""
from rest_framework import routers
from django.urls import path, include
from . import apis

# API Router for REST endpoints
router = routers.DefaultRouter()
router.register(r'courses', apis.CourseCacheViewSet, basename='course')

app_name = 'courses'

# Only API endpoints - no web views
urlpatterns = [
    path('api/courses/', include(router.urls)),
]
