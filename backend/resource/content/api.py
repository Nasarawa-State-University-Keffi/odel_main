"""
API views for learning content management.
Provides RESTful endpoints for uploading, listing, and managing content.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, OpenApiParameter
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


class LearningContentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for learning content management.
    
    Provides read operations and custom upload endpoints.
    Use /upload/ for file uploads, not the standard POST endpoint.
    """
    
    queryset = LearningContent.objects.all()
    serializer_class = LearningContentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def create(self, request, *args, **kwargs):
        """Disable default POST endpoint. Use /upload/ or /add_youtube/ instead."""
        return Response(
            {
                'status': 'error',
                'detail': 'Direct POST not allowed. Use /api/content/content/upload/ for file uploads or /api/content/content/add_youtube/ for YouTube videos.'
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def get_queryset(self):
        """
        Filter contents based on query parameters.
        
        Query params:
        - course_id: Filter by course
        - content_type: Filter by content type
        - search: Search in title and description
        """
        queryset = super().get_queryset()
        
        # Filter by course
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Filter by content type
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(original_filename__icontains=search)
            )
        
        # Only show published content to non-staff users
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
        
        return queryset.select_related('course', 'uploaded_by')
    
    @extend_schema(
        summary="Upload learning content file",
        description="Upload any file including videos (MP4, AVI, MOV), PDFs, documents, etc. For video files, set content_type='video'. To reference existing YouTube videos without uploading, use /add_youtube/ instead.",
        request=LearningContentUploadSerializer,
        responses={201: LearningContentSerializer},
        tags=['Content Upload']
    )
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """
        Upload learning content file (including video files).
        
        POST /api/content/upload/
        Form data:
        - file: File to upload (accepts videos: MP4, AVI, MOV, WebM, etc.)
        - course_id: Course external_id (e.g., 'CS101') or UUID
        - content_type: Content type (note/video/resource/assignment)
        - title: Display title (optional)
        - description: Description (optional)
        - storage_backend: Storage backend (optional - local/s3/cloudinary)
        
        Note: For video files, set content_type='video'
        """
        serializer = LearningContentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get course by external_id or UUID
            course_id = serializer.validated_data['course_id']
            course = CourseCache.objects.filter(external_id=course_id).first()
            if not course:
                # Try UUID lookup
                try:
                    import uuid
                    uuid_value = uuid.UUID(course_id)
                    course = get_object_or_404(CourseCache, id=uuid_value)
                except (ValueError, AttributeError):
                    return Response(
                        {'status': 'error', 'detail': 'Course not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Upload file
            # TODO: Handle storage_backend properly
            # Force None if storage_backend not explicitly provided (will use DB default)
            # storage_backend = serializer.validated_data.get('storage_backend')
            # if storage_backend == '':
            #     storage_backend = None
            
            content = upload_learning_content(
                file_obj=serializer.validated_data['file'],
                course=course,
                content_type=serializer.validated_data['content_type'],
                user=request.user,
                title=serializer.validated_data.get('title'),
                description=serializer.validated_data.get('description', ''),
                storage_backend=serializer.validated_data.get('storage_backend')
            )
            
            # Return created content
            return Response(
                LearningContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Add YouTube video reference",
        description="Add a reference to an existing YouTube video (no file upload). To upload video files directly, use /upload/ endpoint instead.",
        request=YouTubeVideoSerializer,
        responses={201: LearningContentSerializer},
        tags=['Content Upload']
    )
    @action(detail=False, methods=['post'])
    def add_youtube(self, request):
        """
        Add YouTube video reference (no file upload).
        
        POST /api/content/add_youtube/
        JSON body:
        - video_url: YouTube URL or video ID (e.g., 'https://youtube.com/watch?v=xxxxx' or 'xxxxx')
        - course_id: Course external_id (e.g., 'CS101') or UUID
        - title: Display title
        - description: Description (optional)
        
        Note: This only stores a reference to an existing YouTube video.
        To upload video files (MP4, AVI, etc.), use /upload/ endpoint with content_type='video'
        """
        serializer = YouTubeVideoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Get course by external_id or UUID
            course_id = serializer.validated_data['course_id']
            course = CourseCache.objects.filter(external_id=course_id).first()
            if not course:
                # Try UUID lookup
                try:
                    import uuid
                    uuid_value = uuid.UUID(course_id)
                    course = get_object_or_404(CourseCache, id=uuid_value)
                except (ValueError, AttributeError):
                    return Response(
                        {'status': 'error', 'detail': 'Course not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # Add YouTube video
            content = upload_youtube_video(
                video_url=serializer.validated_data['video_url'],
                course=course,
                user=request.user,
                title=serializer.validated_data['title'],
                description=serializer.validated_data.get('description', '')
            )
            
            # Return created content
            return Response(
                LearningContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @extend_schema(
        summary="Log content access",
        description="Log when a user views or downloads content",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'action': {'type': 'string', 'enum': ['view', 'download']}
                },
                'required': ['action']
            }
        },
        responses={200: {'type': 'object', 'properties': {'status': {'type': 'string'}}}},
        tags=['Content']
    )
    @action(detail=True, methods=['post'])
    def log_access(self, request, pk=None):
        """
        Log content access.
        
        POST /api/content/{id}/log_access/
        JSON body:
        - action: 'view' or 'download'
        """
        content = self.get_object()
        action_type = request.data.get('action', 'view')
        
        if action_type not in ['view', 'download']:
            return Response(
                {'status': 'error', 'detail': 'Invalid action. Must be "view" or "download"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log access
        log_content_access(
            content=content,
            user=request.user,
            action=action_type,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'status': 'logged'})
    
    @extend_schema(
        summary="Get content statistics",
        description="Get statistics about content usage and storage",
        parameters=[
            OpenApiParameter(
                name='course_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter statistics by course ID',
                required=False
            )
        ],
        responses={200: ContentStatisticsSerializer},
        tags=['Content']
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get content statistics.
        
        GET /api/content/statistics/
        Query params:
        - course_id: Filter by course (optional)
        """
        queryset = self.get_queryset()
        
        # Filter by course if provided
        course_id = request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        # Calculate statistics
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
    
    def destroy(self, request, *args, **kwargs):
        """Override delete to use service layer."""
        content = self.get_object()
        
        try:
            delete_learning_content(content.id)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=['Storage Settings'])
class StorageSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for storage settings management.
    Admin only.
    """
    
    queryset = StorageSettings.objects.all()
    serializer_class = StorageSettingsSerializer
    permission_classes = [IsAdminUser]
    
    @extend_schema(
        summary="Get active storage backend",
        description="Retrieve the currently active storage backend configuration",
        responses={200: StorageSettingsSerializer},
        tags=['Storage Settings']
    )
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get active storage settings.
        
        GET /api/storage-settings/active/
        """
        settings = StorageSettings.objects.filter(is_active=True).first()
        
        if settings:
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        
        return Response(
            {'backend': 'local', 'is_active': True},
            status=status.HTTP_200_OK
        )
    
    @extend_schema(
        summary="List available storage backends",
        description="Get all supported storage backend types",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'backends': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'name': {'type': 'string'},
                                'display': {'type': 'string'}
                            }
                        }
                    }
                }
            }
        },
        tags=['Storage Settings']
    )
    @action(detail=False, methods=['get'])
    def backends(self, request):
        """
        Get list of available storage backends.
        
        GET /api/storage-settings/backends/
        """
        from resource.storage.router import get_available_backends
        
        backends = get_available_backends()
        
        return Response({
            'backends': [
                {'name': backend, 'display': backend.upper()}
                for backend in backends
            ]
        })


@extend_schema(tags=['Content Access Logs'])
class ContentAccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for content access logs.
    Read-only, admin only.
    """
    
    queryset = ContentAccessLog.objects.all()
    serializer_class = ContentAccessLogSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """
        Filter logs based on query parameters.
        
        Query params:
        - content_id: Filter by content
        - user_id: Filter by user
        - action: Filter by action type
        """
        queryset = super().get_queryset()
        
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
