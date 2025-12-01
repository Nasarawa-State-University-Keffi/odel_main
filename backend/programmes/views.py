from rest_framework import viewsets
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema_view, extend_schema
from core.utils import api_response, get_serializer_error_message
from core.permissions import IsAdminOrReadOnly
from .models import StudyCategory, DegreeType, Programme
from .serializers import StudyCategorySerializer, DegreeTypeSerializer, ProgrammeSerializer


@extend_schema_view(
    list=extend_schema(tags=['Programmes']),
    retrieve=extend_schema(tags=['Programmes']),
    create=extend_schema(tags=['Programmes']),
    update=extend_schema(tags=['Programmes']),
    partial_update=extend_schema(tags=['Programmes']),
    destroy=extend_schema(tags=['Programmes']),
)
class StudyCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StudyCategory model
    - List/Retrieve: Anyone
    - Create/Update/Delete: Admin only
    """
    queryset = StudyCategory.objects.all()
    serializer_class = StudyCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(api_response('success', 'Study categories retrieved', serializer.data))
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(api_response('success', 'Study category retrieved', serializer.data))
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Study category created', serializer.data), status=201)
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Study category updated', serializer.data))
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(api_response('success', 'Study category deleted'), status=204)


@extend_schema_view(
    list=extend_schema(tags=['Programmes']),
    retrieve=extend_schema(tags=['Programmes']),
    create=extend_schema(tags=['Programmes']),
    update=extend_schema(tags=['Programmes']),
    partial_update=extend_schema(tags=['Programmes']),
    destroy=extend_schema(tags=['Programmes']),
)
class DegreeTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for DegreeType model
    - List/Retrieve: Anyone
    - Create/Update/Delete: Admin only
    """
    queryset = DegreeType.objects.select_related('category').all()
    serializer_class = DegreeTypeSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(api_response('success', 'Degree types retrieved', serializer.data))
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(api_response('success', 'Degree type retrieved', serializer.data))
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Degree type created', serializer.data), status=201)
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Degree type updated', serializer.data))
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(api_response('success', 'Degree type deleted'), status=204)


@extend_schema_view(
    list=extend_schema(tags=['Programmes']),
    retrieve=extend_schema(tags=['Programmes']),
    create=extend_schema(tags=['Programmes']),
    update=extend_schema(tags=['Programmes']),
    partial_update=extend_schema(tags=['Programmes']),
    destroy=extend_schema(tags=['Programmes']),
)
class ProgrammeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Programme model
    - List/Retrieve: Anyone
    - Create/Update/Delete: Admin only
    Filterable by: faculty, department, degree_type
    """
    queryset = Programme.objects.select_related(
        'department', 
        'department__faculty', 
        'degree_type', 
        'degree_type__category'
    ).all()
    serializer_class = ProgrammeSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['department', 'degree_type', 'department__faculty']
    search_fields = ['name', 'degree_type__code', 'degree_type__name', 'department__name']
    ordering_fields = ['name', 'duration_years', 'created_at']
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(api_response('success', 'Programmes retrieved', serializer.data))
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(api_response('success', 'Programme retrieved', serializer.data))
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Programme created', serializer.data), status=201)
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Programme updated', serializer.data))
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(api_response('success', 'Programme deleted'), status=204)
