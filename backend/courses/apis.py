"""                                                                                                                     
API Views for the Courses app - DRF ViewSets for REST API endpoints.
These views handle JSON requests/responses for mobile apps or SPAs.
"""
from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import CourseCache
from .serializers import CourseCacheSerializer
@extend_schema_view(
    list=extend_schema(
        summary="List all courses",
        description="Retrieve a list of all courses cached from the student portal",
        tags=['Courses']
    ),
    retrieve=extend_schema(
        summary="Get course details",
        description="Retrieve detailed information about a specific course",
        tags=['Courses']
    )
)
class CourseCacheViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourseCache.objects.all()
    serializer_class = CourseCacheSerializer
