"""
API views for learning content management.
Provides RESTful endpoints for uploading, listing, and managing content.
"""

from rest_framework import viewsets, status, generics, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import LearningContent, StorageSettings, ContentAccessLog
from .serializers import (
    LearningContentSerializer,
    LearningContentUploadSerializer,
    YouTubeVideoSerializer,
    StorageSettingsSerializer,
    ContentAccessLogSerializer,
    ContentStatisticsSerializer
)
from .services import (
    upload_learning_content,
    upload_youtube_video,
    delete_learning_content,
    get_course_contents,
    log_content_access,
    update_storage_settings
)
from courses.models import CourseCache


@extend_schema(tags=['Global - Content'])
class LearningContentListAPIView(generics.ListAPIView):
    """
    List learning content with filtering.
    """
    serializer_class = LearningContentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = LearningContent.objects.all()
        
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(original_filename__icontains=search)
            )
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
        
        return queryset.select_related('course', 'uploaded_by')


@extend_schema(tags=['Student - Content'])
class CourseContentAPIView(generics.ListAPIView):
    """
    List content for a specific course (filtered by UUID or external_id).
    Used by students to view course materials.
    """
    serializer_class = LearningContentSerializer
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List course content",
        description="Filter content for a specific course using course ID or external ID."
    )
    def get_queryset(self):
        course_id = self.kwargs.get('course_id')
        
        # Resolve course first
        course = CourseCache.objects.filter(course_external_id=course_id).first()
        if not course:
            try:
                import uuid
                uuid_value = uuid.UUID(course_id)
                course = get_object_or_404(CourseCache, id=uuid_value)
            except (ValueError, AttributeError):
                return LearningContent.objects.none()

        queryset = LearningContent.objects.filter(course=course)
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
            
        return queryset.select_related('course', 'uploaded_by')


@extend_schema(tags=['Global - Content'])
class LearningContentDetailAPIView(generics.RetrieveDestroyAPIView):
    """
    Retrieve or delete specific learning content.
    """
    queryset = LearningContent.objects.all()
    serializer_class = LearningContentSerializer
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        delete_learning_content(instance.id)


@extend_schema(tags=['Staff - Content Upload'])
class LearningContentUploadAPIView(views.APIView):
    """
    Upload learning content file.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Upload learning content file",
        description="Upload any file including videos (MP4, AVI, MOV), PDFs, documents, etc.",
        request=LearningContentUploadSerializer,
        responses={201: LearningContentSerializer}
    )
    def post(self, request):
        serializer = LearningContentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get course by external_id or UUID
            course_id = serializer.validated_data['course_id']
            course = CourseCache.objects.filter(course_external_id=course_id).first()
            if not course:
                try:
                    import uuid
                    uuid_value = uuid.UUID(course_id)
                    course = get_object_or_404(CourseCache, id=uuid_value)
                except (ValueError, AttributeError):
                    return Response(
                        {'status': 'error', 'detail': 'Course not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            content = upload_learning_content(
                file_obj=serializer.validated_data['file'],
                course=course,
                content_type=serializer.validated_data['content_type'],
                user=request.user,
                title=serializer.validated_data.get('title'),
                description=serializer.validated_data.get('description', ''),
                storage_backend=serializer.validated_data.get('storage_backend')
            )
            
            return Response(
                LearningContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=['Staff - Content Upload'])
class YouTubeVideoAddAPIView(views.APIView):
    """
    Add YouTube video reference.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Add YouTube video reference",
        description="Add a reference to an existing YouTube video (no file upload).",
        request=YouTubeVideoSerializer,
        responses={201: LearningContentSerializer}
    )
    def post(self, request):
        serializer = YouTubeVideoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get course by external_id or UUID
            course_id = serializer.validated_data['course_id']
            course = CourseCache.objects.filter(course_external_id=course_id).first()
            if not course:
                try:
                    import uuid
                    uuid_value = uuid.UUID(course_id)
                    course = get_object_or_404(CourseCache, id=uuid_value)
                except (ValueError, AttributeError):
                    return Response(
                        {'status': 'error', 'detail': 'Course not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            content = upload_youtube_video(
                video_url=serializer.validated_data['video_url'],
                course=course,
                user=request.user,
                title=serializer.validated_data['title'],
                description=serializer.validated_data.get('description', '')
            )
            
            return Response(
                LearningContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=['Global - Content'])
class LearningContentLogAccessAPIView(views.APIView):
    """
    Log content access.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Log content access",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'action': {'type': 'string', 'enum': ['view', 'download']}
                },
                'required': ['action']
            }
        },
        responses={
            200: OpenApiResponse(
                description="Access logged successfully",
                examples=[
                    OpenApiExample('Example Response', value={'status': 'logged'})
                ]
            )
        }
    )
    def post(self, request, pk):
        content = get_object_or_404(LearningContent, pk=pk)
        action_type = request.data.get('action', 'view')
        
        if action_type not in ['view', 'download']:
            return Response(
                {'status': 'error', 'detail': 'Invalid action. Must be "view" or "download"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        log_content_access(
            content=content,
            user=request.user,
            action=action_type,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'status': 'logged'})


@extend_schema(tags=['Staff - Content Stats'])
class LearningContentStatsAPIView(views.APIView):
    """
    Get content statistics.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get content statistics",
        parameters=[
            OpenApiParameter(
                name='course_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter statistics by course ID'
            )
        ],
        responses={200: ContentStatisticsSerializer}
    )
    def get(self, request):
        queryset = LearningContent.objects.all()
        if not request.user.is_staff:
            queryset = queryset.filter(is_published=True)
            
        course_id = request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        stats = {
            'total_contents': queryset.count(),
            'total_size': queryset.aggregate(total=Sum('file_size'))['total'] or 0,
            'by_type': dict(
                queryset.values('content_type')
                .annotate(count=Count('id'))
                .values_list('content_type', 'count')
            ),
            'by_backend': dict(
                queryset.values('storage_backend')
                .annotate(count=Count('id'))
                .values_list('storage_backend', 'count')
            ),
            'most_downloaded': list(
                queryset.order_by('-download_count')[:10]
                .values('id', 'title', 'download_count')
            )
        }
        
        serializer = ContentStatisticsSerializer(stats)
        return Response(serializer.data)


@extend_schema(tags=['Admin - Storage Settings'])
class StorageSettingsListCreateAPIView(generics.ListCreateAPIView):
    """
    List or create storage settings.
    """
    queryset = StorageSettings.objects.all()
    serializer_class = StorageSettingsSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=['Admin - Storage Settings'])
class StorageSettingsDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Manage specific storage settings.
    """
    queryset = StorageSettings.objects.all()
    serializer_class = StorageSettingsSerializer
    permission_classes = [IsAdminUser]


@extend_schema(tags=['Admin - Storage Settings'])
class ActiveStorageSettingsAPIView(views.APIView):
    """
    Get active storage settings.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Get active storage backend",
        responses={200: StorageSettingsSerializer}
    )
    def get(self, request):
        settings = StorageSettings.objects.filter(is_active=True).first()
        if settings:
            serializer = StorageSettingsSerializer(settings)
            return Response(serializer.data)
        
        return Response(
            {'backend': 'local', 'is_active': True},
            status=status.HTTP_200_OK
        )


@extend_schema(tags=['Admin - Storage Settings'])
class AvailableBackendsAPIView(views.APIView):
    """
    Get list of available storage backends.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="List available storage backends",
        responses={
            200: OpenApiResponse(
                description="List of available backends",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            'backends': [
                                {'name': 'local', 'display': 'LOCAL'},
                                {'name': 's3', 'display': 'S3'}
                            ]
                        }
                    )
                ]
            )
        }
    )
    def get(self, request):
        from resource.storage.router import get_available_backends
        backends = get_available_backends()
        return Response({
            'backends': [
                {'name': backend, 'display': backend.upper()}
                for backend in backends
            ]
        })


@extend_schema(tags=['Admin - Content Logs'])
class ContentAccessLogListAPIView(generics.ListAPIView):
    """
    List content access logs.
    """
    serializer_class = ContentAccessLogSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = ContentAccessLog.objects.all()
        
        content_id = self.request.query_params.get('content_id')
        if content_id:
            queryset = queryset.filter(content_id=content_id)
        
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        return queryset.select_related('content', 'user')
