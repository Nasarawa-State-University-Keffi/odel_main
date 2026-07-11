"""                                                                                                                     
API Views for the Courses app - DRF ViewSets for REST API endpoints.
These views handle JSON requests/responses for mobile apps or SPAs.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view
from portal_auth.permissions import IsPortalAdmin

from .models import AcademicSession, CourseCache, Semester
from .serializers import AcademicSessionSerializer, CourseCacheSerializer, SemesterSerializer


class AdminManagedLookupViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsPortalAdmin()]


class AcademicSessionViewSet(AdminManagedLookupViewSet):
    queryset = AcademicSession.objects.all()
    serializer_class = AcademicSessionSerializer


class SemesterViewSet(AdminManagedLookupViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List all courses",
        description="Retrieve a list of all courses cached from the student portal",
        tags=['Global - Courses']
    ),
    retrieve=extend_schema(
        summary="Get course details",
        description="Retrieve detailed information about a specific course",
        tags=['Global - Courses']
    )
)
class CourseCacheViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CourseCache.objects.all()
    serializer_class = CourseCacheSerializer
