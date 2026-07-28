from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from portal_auth.permissions import IsPortalAdmin

from .models import Department, Faculty, Programme, ProgrammeType
from .serializers import DepartmentSerializer, FacultySerializer, ProgrammeSerializer, ProgrammeTypeSerializer
from .tasks import sync_all_task


class SyncAllView(APIView):
    permission_classes = [IsPortalAdmin]

    def post(self, request):
        sync_all_task.delay()
        return Response({
            'message': 'Synchronization in progress',
            'status': 200,
            'data': '',
            'success': True,
            'errors': [],
        }, status=status.HTTP_200_OK)


class FilteredListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    filter_fields = ()

    def get_queryset(self):
        queryset = super().get_queryset()
        for query_name, model_field in self.filter_fields:
            value = self.request.query_params.get(query_name)
            if value:
                queryset = queryset.filter(**{model_field: value})
        query = self.request.query_params.get('query')
        if query:
            queryset = queryset.filter(Q(name__icontains=query) | Q(code__icontains=query))
        return queryset

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response({
            'message': '',
            'status': 200,
            'data': serializer.data,
            'success': True,
            'errors': [],
        })


class ProgrammeTypeListView(FilteredListView):
    queryset = ProgrammeType.objects.all()
    serializer_class = ProgrammeTypeSerializer


class FacultyListView(FilteredListView):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer


class DepartmentListView(FilteredListView):
    queryset = Department.objects.select_related('faculty').all()
    serializer_class = DepartmentSerializer
    filter_fields = (('faculty', 'faculty_id'),)


class ProgrammeListView(FilteredListView):
    queryset = Programme.objects.select_related('department', 'programme_type').all()
    serializer_class = ProgrammeSerializer
    filter_fields = (
        ('programme_type', 'programme_type_id'),
        ('department', 'department_id'),
    )
