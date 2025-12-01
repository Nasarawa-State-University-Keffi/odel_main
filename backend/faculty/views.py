from rest_framework import viewsets
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema
from core.utils import api_response
from core.permissions import IsAdminOrReadOnly
from .models import Faculty, Department
from .serializers import FacultySerializer, DepartmentSerializer


@extend_schema_view(
    list=extend_schema(tags=['Faculty']),
    retrieve=extend_schema(tags=['Faculty']),
    create=extend_schema(tags=['Faculty']),
    update=extend_schema(tags=['Faculty']),
    partial_update=extend_schema(tags=['Faculty']),
    destroy=extend_schema(tags=['Faculty']),
)
class FacultyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Faculty model
    - List/Retrieve: Anyone
    - Create/Update/Delete: Admin only
    """
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(api_response('success', 'Faculties retrieved', serializer.data))
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(api_response('success', 'Faculty retrieved', serializer.data))
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Faculty created', serializer.data), status=201)
        from core.utils import get_serializer_error_message
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Faculty updated', serializer.data))
        from core.utils import get_serializer_error_message
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(api_response('success', 'Faculty deleted'), status=204)


@extend_schema_view(
    list=extend_schema(tags=['Faculty']),
    retrieve=extend_schema(tags=['Faculty']),
    create=extend_schema(tags=['Faculty']),
    update=extend_schema(tags=['Faculty']),
    partial_update=extend_schema(tags=['Faculty']),
    destroy=extend_schema(tags=['Faculty']),
)
class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Department model
    - List/Retrieve: Anyone
    - Create/Update/Delete: Admin only
    """
    queryset = Department.objects.select_related('faculty').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['faculty']
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(api_response('success', 'Departments retrieved', serializer.data))
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(api_response('success', 'Department retrieved', serializer.data))
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Department created', serializer.data), status=201)
        from core.utils import get_serializer_error_message
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        if serializer.is_valid():
            serializer.save()
            return Response(api_response('success', 'Department updated', serializer.data))
        from core.utils import get_serializer_error_message
        return Response(api_response('error', get_serializer_error_message(serializer.errors)), status=400)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(api_response('success', 'Department deleted'), status=204)
