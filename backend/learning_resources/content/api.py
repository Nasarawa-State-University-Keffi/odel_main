"""
API views for LMS learning-content management.
Provides RESTful endpoints for uploading, listing, and managing content.
"""

from rest_framework import viewsets, status, generics, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, SAFE_METHODS
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Q, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiResponse, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import (
    CourseModule,
    LearningContent,
    StorageSettings,
    ContentAccessLog,
    LessonComment,
    StudyGroup,
    StudyGroupMembership,
    StudyGroupMaterial,
    StudyGroupComment,
)
from .serializers import (
    CourseModuleSerializer,
    CourseModuleDetailSerializer,
    StudentCourseModuleSerializer,
    LearningContentSerializer,
    UnifiedLearningContentSerializer,
    LearningContentUploadSerializer,
    YouTubeVideoSerializer,
    StorageSettingsSerializer,
    ContentAccessLogSerializer,
    ContentStatisticsSerializer,
    LessonCommentSerializer,
    StudyGroupSerializer,
    StudyGroupCreateSerializer,
    StudyGroupMaterialSerializer,
    StudyGroupMaterialCreateSerializer,
    StudyGroupCommentSerializer,
    resolve_course_identifier,
)
from .services import (
    upload_learning_content,
    upload_youtube_video,
    create_unified_content,
    delete_learning_content,
    get_course_contents,
    log_content_access
)
from courses.models import CourseCache, StudentRegisteredCourse
from courses.services import resolve_academic_period
from learning_resources.storage import get_storage_engine
from portal_auth.permissions import IsPortalStaff
from uuid import uuid4
from pathlib import Path


def _require_student(request):
    if request.user.is_staff:
        raise PermissionDenied('Study groups are available to students only.')


def _required_period(request):
    session = request.query_params.get('session') or request.data.get('session')
    semester = request.query_params.get('semester') or request.data.get('semester')
    if not session or not semester:
        raise ValidationError({'detail': 'session and semester are required'})
    return resolve_academic_period(session, semester)


def _ensure_group_member(request, group):
    _require_student(request)
    is_registered = StudentRegisteredCourse.objects.filter(
        student_external=request.user,
        course=group.course,
        session=group.session,
        semester=group.semester,
    ).exists()
    if not is_registered:
        raise PermissionDenied('You are not registered for this course in the study group period.')
    membership = StudyGroupMembership.objects.filter(group=group, user=request.user).first()
    if not membership:
        raise PermissionDenied('Join this study group before accessing its workspace.')
    return membership


@extend_schema(tags=['Staff - Course Modules'])
class CourseModuleListCreateAPIView(generics.ListCreateAPIView):
    """List or create ordered learning modules."""

    serializer_class = CourseModuleSerializer
    permission_classes = [IsAuthenticated, IsPortalStaff]

    def get_queryset(self):
        queryset = CourseModule.objects.select_related(
            'course', 'created_by'
        ).prefetch_related('contents')
        course_id = self.request.query_params.get('course_id')
        if course_id:
            course = resolve_course_identifier(course_id)
            if not course:
                return queryset.none()
            queryset = queryset.filter(course=course)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@extend_schema(tags=['Staff - Course Modules'])
class CourseModuleDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete one learning module."""

    serializer_class = CourseModuleDetailSerializer
    permission_classes = [IsAuthenticated, IsPortalStaff]
    queryset = CourseModule.objects.select_related(
        'course', 'created_by'
    ).prefetch_related('contents__uploaded_by')


@extend_schema(tags=['Student - Content'])
class StudentCourseModulesAPIView(generics.ListAPIView):
    """Return the available module/content structure for an enrolled student."""

    serializer_class = StudentCourseModuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        course = resolve_course_identifier(self.kwargs.get('course_id'))
        if not course:
            raise NotFound('Course not found.')

        if not self.request.user.is_staff:
            is_enrolled = StudentRegisteredCourse.objects.filter(
                student_external=self.request.user,
                course=course,
            ).exists()
            if not is_enrolled:
                raise PermissionDenied('You are not enrolled in this course.')

        queryset = CourseModule.objects.filter(course=course).select_related(
            'course', 'created_by'
        ).prefetch_related('contents__uploaded_by')

        if not self.request.user.is_staff:
            now = timezone.now()
            queryset = queryset.filter(
                is_published=True,
            ).filter(
                Q(available_from__isnull=True) | Q(available_from__lte=now),
                Q(available_until__isnull=True) | Q(available_until__gte=now),
            )

        return queryset.order_by('order', 'created_at')


@extend_schema_view(
    get=extend_schema(
        tags=['Student - Content'],
        parameters=[
            OpenApiParameter(name='session', type=OpenApiTypes.STR, required=False),
            OpenApiParameter(name='semester', type=OpenApiTypes.STR, required=False),
            OpenApiParameter(name='course_id', type=OpenApiTypes.STR, required=False),
            OpenApiParameter(name='search', type=OpenApiTypes.STR, required=False),
            OpenApiParameter(name='content_format', type=OpenApiTypes.STR, required=False),
        ],
    ),
    post=extend_schema(tags=['Staff - Content']),
)
class LearningContentListAPIView(generics.ListCreateAPIView):
    """
    List learning content with filtering.
    """
    serializer_class = LearningContentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsPortalStaff()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UnifiedLearningContentSerializer
        return LearningContentSerializer
    
    def get_queryset(self):
        queryset = LearningContent.objects.all()

        if not self.request.user.is_staff:
            session = self.request.query_params.get('session')
            semester = self.request.query_params.get('semester')
            if not session or not semester:
                raise ValidationError({
                    'detail': 'session and semester are required for student content',
                })

            enrolled_course_ids = StudentRegisteredCourse.objects.filter(
                student_external=self.request.user,
                session=session,
                semester=semester,
            ).values_list('course_id', flat=True)
            queryset = queryset.filter(course_id__in=enrolled_course_ids)
        
        course_id = self.request.query_params.get('course_id')
        if course_id:
            course = resolve_course_identifier(course_id)
            queryset = queryset.filter(course=course) if course else queryset.none()
        
        module_id = self.request.query_params.get('module_id')
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(text_content__icontains=search) |
                Q(original_filename__icontains=search)
            )

        content_format = self.request.query_params.get('content_format')
        if content_format:
            queryset = queryset.filter(content_format=content_format)
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
        
        return queryset.select_related('course', 'module', 'uploaded_by')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        course = resolve_course_identifier(data['course_id'])
        content = create_unified_content(
            course=course, user=request.user,
            title=data['title'],
            module=data.get('module'),
            order=data.get('order', 0), is_published=data.get('is_published', True),
            file_obj=data.get('file'), text_content=data.get('text_content', ''),
            external_url=data.get('url', ''), storage_backend=data.get('storage_backend'),
        )
        return Response(
            LearningContentSerializer(content, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


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
        course = resolve_course_identifier(self.kwargs.get('course_id'))
        if not course:
            return LearningContent.objects.none()

        queryset = LearningContent.objects.filter(course=course)
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_published=True)
            
        return queryset.select_related('course', 'module', 'uploaded_by')


@extend_schema(tags=['Global - Content'])
class LearningContentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve or delete specific learning content.
    """
    queryset = LearningContent.objects.select_related('course', 'module', 'uploaded_by')
    serializer_class = LearningContentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        permission_classes = [IsAuthenticated]
        if self.request.method not in SAFE_METHODS:
            permission_classes.append(IsPortalStaff)
        return [permission() for permission in permission_classes]

    def perform_destroy(self, instance):
        delete_learning_content(instance.id)


@extend_schema(tags=['Staff - Content Upload'])
class LearningContentUploadAPIView(views.APIView):
    """
    Upload learning content file.
    """
    permission_classes = [IsAuthenticated, IsPortalStaff]
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
            course_id = serializer.validated_data['course_id']
            course = resolve_course_identifier(course_id)
            if not course:
                return Response(
                    {'status': 'error', 'detail': 'Course not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            content = upload_learning_content(
                file_obj=serializer.validated_data['file'],
                course=course,
                user=request.user,
                title=serializer.validated_data.get('title'),
                storage_backend=serializer.validated_data.get('storage_backend'),
                module=serializer.validated_data.get('module'),
                order=serializer.validated_data.get('order', 0),
                is_published=serializer.validated_data.get('is_published', True),
            )
            
            return Response(
                LearningContentSerializer(content, context={'request': request}).data,
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
    permission_classes = [IsAuthenticated, IsPortalStaff]

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
            course_id = serializer.validated_data['course_id']
            course = resolve_course_identifier(course_id)
            if not course:
                return Response(
                    {'status': 'error', 'detail': 'Course not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            content = upload_youtube_video(
                video_url=serializer.validated_data['video_url'],
                course=course,
                user=request.user,
                title=serializer.validated_data['title'],
                module=serializer.validated_data.get('module'),
                order=serializer.validated_data.get('order', 0),
                is_published=serializer.validated_data.get('is_published', True),
            )
            
            return Response(
                LearningContentSerializer(content, context={'request': request}).data,
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


@extend_schema(tags=['Lesson Discussion'])
class LessonDiscussionAPIView(generics.ListCreateAPIView):
    """List or add comments for a lesson available to the current user."""

    serializer_class = LessonCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_content(self):
        if not hasattr(self, '_content'):
            self._content = get_object_or_404(
                LearningContent.objects.select_related('course', 'module'),
                pk=self.kwargs['pk'],
            )
            self._ensure_discussion_access(self._content)
        return self._content

    def _ensure_discussion_access(self, content):
        if self.request.user.is_staff:
            return

        if not content.is_published:
            raise PermissionDenied('This lesson is not available for discussion.')

        is_enrolled = StudentRegisteredCourse.objects.filter(
            student_external=self.request.user,
            course=content.course,
        ).exists()
        if not is_enrolled:
            raise PermissionDenied('You are not enrolled in this course.')

        module = content.module
        if module and not module.is_available:
            raise PermissionDenied('This lesson is not currently available.')

    def get_queryset(self):
        content = self.get_content()
        return LessonComment.objects.filter(
            content=content,
            parent__isnull=True,
        ).select_related('author').prefetch_related(
            'replies__author',
        ).order_by('created_at')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['content'] = self.get_content()
        return context

    def perform_create(self, serializer):
        serializer.save(content=self.get_content(), author=self.request.user)


@extend_schema(tags=['Student - Study Groups'])
class StudyGroupListCreateAPIView(generics.ListCreateAPIView):
    """Discover or create course-and-term scoped student study groups."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return StudyGroupCreateSerializer if self.request.method == 'POST' else StudyGroupSerializer

    def get_queryset(self):
        _require_student(self.request)
        session, semester = _required_period(self.request)
        enrolled_courses = StudentRegisteredCourse.objects.filter(
            student_external=self.request.user,
            session=session,
            semester=semester,
        ).values_list('course_id', flat=True)
        membership_prefetch = Prefetch(
            'memberships',
            queryset=StudyGroupMembership.objects.filter(user=self.request.user),
            to_attr='current_user_memberships',
        )
        return StudyGroup.objects.filter(
            course_id__in=enrolled_courses,
            session=session,
            semester=semester,
        ).select_related('course', 'created_by').annotate(
            member_count=Count('memberships'),
        ).prefetch_related(membership_prefetch)

    def perform_create(self, serializer):
        _require_student(self.request)
        course = serializer.validated_data['course_id']
        session, semester = _required_period(self.request)
        is_registered = StudentRegisteredCourse.objects.filter(
            student_external=self.request.user,
            course=course,
            session=session,
            semester=semester,
        ).exists()
        if not is_registered:
            raise PermissionDenied('You can only create study groups for your registered courses.')

        group = StudyGroup.objects.create(
            course=course,
            session=session,
            semester=semester,
            name=serializer.validated_data['name'],
            description=serializer.validated_data.get('description', ''),
            member_limit=serializer.validated_data['member_limit'],
            join_code=uuid4().hex[:10].upper(),
            created_by=self.request.user,
        )
        StudyGroupMembership.objects.create(group=group, user=self.request.user, role='owner')
        self.instance = group

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            StudyGroupSerializer(self.instance, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=['Student - Study Groups'])
class StudyGroupDetailAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = StudyGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        _require_student(self.request)
        membership_prefetch = Prefetch(
            'memberships',
            queryset=StudyGroupMembership.objects.filter(user=self.request.user),
            to_attr='current_user_memberships',
        )
        return StudyGroup.objects.select_related('course', 'created_by').annotate(
            member_count=Count('memberships'),
        ).prefetch_related(membership_prefetch)

    def get_object(self):
        group = super().get_object()
        _require_student(self.request)
        is_registered = StudentRegisteredCourse.objects.filter(
            student_external=self.request.user,
            course=group.course,
            session=group.session,
            semester=group.semester,
        ).exists()
        if not is_registered:
            raise PermissionDenied('You are not registered for this course in the study group period.')
        self.membership = StudyGroupMembership.objects.filter(
            group=group,
            user=self.request.user,
        ).first()
        return group

    def perform_destroy(self, instance):
        if not self.membership or self.membership.role != 'owner':
            raise PermissionDenied('Only the group owner can delete this study group.')
        instance.delete()


@extend_schema(tags=['Student - Study Groups'])
class StudyGroupJoinAPIView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        _require_student(request)
        group = get_object_or_404(StudyGroup.objects.select_related('course'), pk=pk)
        is_registered = StudentRegisteredCourse.objects.filter(
            student_external=request.user,
            course=group.course,
            session=group.session,
            semester=group.semester,
        ).exists()
        if not is_registered:
            raise PermissionDenied('You must be registered for this course to join its study group.')
        if not group.is_open:
            raise PermissionDenied('This study group is not accepting new members.')
        membership, created = StudyGroupMembership.objects.get_or_create(
            group=group,
            user=request.user,
            defaults={'role': 'member'},
        )
        if created and group.memberships.count() > group.member_limit:
            membership.delete()
            raise ValidationError({'detail': 'This study group has reached its member limit.'})
        return Response(StudyGroupSerializer(group, context={'request': request}).data)


@extend_schema(tags=['Student - Study Groups'])
class StudyGroupMaterialListCreateAPIView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_group(self, request, pk):
        group = get_object_or_404(StudyGroup, pk=pk)
        _ensure_group_member(request, group)
        return group

    def get(self, request, pk):
        group = self.get_group(request, pk)
        materials = group.materials.select_related('uploaded_by').all()
        return Response(StudyGroupMaterialSerializer(materials, many=True, context={'request': request}).data)

    def post(self, request, pk):
        group = self.get_group(request, pk)
        serializer = StudyGroupMaterialCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data.get('file')
        storage_path = ''
        backend = 'local'
        if file_obj:
            backend_engine = get_storage_engine()
            backend = backend_engine.__class__.__name__.replace('StorageEngine', '').lower()
            filename = Path(file_obj.name).name
            storage_path = f"study-groups/{group.id}/{uuid4().hex}_{filename}"
            backend_engine.save(file_obj, storage_path)
        material = StudyGroupMaterial.objects.create(
            group=group,
            title=serializer.validated_data.get('title') or (file_obj.name if file_obj else serializer.validated_data['external_url']),
            description=serializer.validated_data.get('description', ''),
            external_url=serializer.validated_data.get('external_url', ''),
            storage_path=storage_path,
            original_filename=Path(file_obj.name).name if file_obj else '',
            file_size=file_obj.size if file_obj else None,
            mime_type=getattr(file_obj, 'content_type', '') if file_obj else '',
            storage_backend=backend,
            uploaded_by=request.user,
        )
        return Response(StudyGroupMaterialSerializer(material, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Student - Study Groups'])
class StudyGroupCommentListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = StudyGroupCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_group(self):
        if not hasattr(self, '_group'):
            self._group = get_object_or_404(StudyGroup, pk=self.kwargs['pk'])
            _ensure_group_member(self.request, self._group)
        return self._group

    def get_queryset(self):
        group = self.get_group()
        material_id = self.request.query_params.get('material')
        queryset = StudyGroupComment.objects.filter(
            group=group,
            parent__isnull=True,
        ).select_related('author').prefetch_related(
            'mention_records__mentioned_user',
            'replies__author',
            'replies__mention_records__mentioned_user',
        )
        return queryset.filter(material_id=material_id) if material_id else queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['group'] = self.get_group()
        return context

    def perform_create(self, serializer):
        serializer.save(group=self.get_group(), author=self.request.user)


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
            course = resolve_course_identifier(course_id)
            queryset = queryset.filter(course=course) if course else queryset.none()
        
        stats = {
            'total_contents': queryset.count(),
            'total_size': queryset.aggregate(total=Sum('file_size'))['total'] or 0,
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
    List, create, or upsert storage settings.
    """
    queryset = StorageSettings.objects.all()
    serializer_class = StorageSettingsSerializer
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Create or update storage settings",
        request=StorageSettingsSerializer,
        responses={200: StorageSettingsSerializer}
    )
    def put(self, request, *args, **kwargs):
        """Update a storage backend selected by its natural ``backend`` key."""
        backend = request.data.get('backend')
        if not backend:
            return Response(
                {'backend': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance = StorageSettings.objects.filter(backend=backend).first()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


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
        from learning_resources.storage.router import get_available_backends
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
