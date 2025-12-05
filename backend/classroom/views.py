from rest_framework import viewsets, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.conf import settings
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
import hmac
import hashlib
import json

from .models import CourseCache, Classroom, Session, Resource, Assignment, Submission, ZoomEventLog
from .serializers import (
    CourseCacheSerializer, ClassroomSerializer, SessionSerializer, ResourceSerializer, AssignmentSerializer, SubmissionSerializer,
)
from .permissions import IsEnrolledStudent, IsInstructorForCourse
from .services import zoom as zoom_service


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


@extend_schema_view(
    list=extend_schema(
        summary="List classrooms",
        description="Retrieve a list of all classrooms",
        tags=['Classrooms']
    ),
    create=extend_schema(
        summary="Create a classroom",
        description="Create a new classroom (instructors only)",
        tags=['Classrooms']
    ),
    retrieve=extend_schema(
        summary="Get classroom details",
        description="Retrieve detailed information about a specific classroom",
        tags=['Classrooms']
    ),
    update=extend_schema(
        summary="Update classroom",
        description="Update classroom information (instructors only)",
        tags=['Classrooms']
    ),
    partial_update=extend_schema(
        summary="Partially update classroom",
        description="Partially update classroom information (instructors only)",
        tags=['Classrooms']
    ),
    destroy=extend_schema(
        summary="Delete classroom",
        description="Delete a classroom (instructors only)",
        tags=['Classrooms']
    )
)
class ClassroomViewSet(viewsets.ModelViewSet):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsInstructorForCourse()]
        return super().get_permissions()


@extend_schema_view(
    list=extend_schema(
        summary="List sessions",
        description="Retrieve a list of all classroom sessions",
        tags=['Sessions']
    ),
    create=extend_schema(
        summary="Create a session",
        description="Create a new classroom session. If live_provider is 'zoom', a Zoom meeting will be automatically created asynchronously",
        tags=['Sessions']
    ),
    retrieve=extend_schema(
        summary="Get session details",
        description="Retrieve detailed information about a specific session",
        tags=['Sessions']
    ),
    update=extend_schema(
        summary="Update session",
        description="Update session information",
        tags=['Sessions']
    ),
    partial_update=extend_schema(
        summary="Partially update session",
        description="Partially update session information",
        tags=['Sessions']
    )
)
class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related('classroom').all()
    serializer_class = SessionSerializer

    def perform_create(self, serializer):
        # create session and meeting will be auto-created by signals
        serializer.save()

    @extend_schema(
        summary="Get session join URL",
        description="Get the Zoom meeting join URL for enrolled students",
        responses={
            200: OpenApiTypes.OBJECT,
            403: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        tags=['Sessions']
    )
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        session = self.get_object()
        # permission: enrolled student
        perm = IsEnrolledStudent()
        if not perm.has_object_permission(request, self, session):
            return Response({'detail': 'Not enrolled'}, status=status.HTTP_403_FORBIDDEN)
        if not session.join_url:
            return Response({'detail': 'Join URL not available'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'join_url': session.join_url})


@extend_schema_view(
    list=extend_schema(
        summary="List resources",
        description="Retrieve a list of all classroom resources (lecture notes, materials)",
        tags=['Resources']
    ),
    create=extend_schema(
        summary="Upload a resource",
        description="Upload a new resource file to a classroom",
        tags=['Resources']
    ),
    retrieve=extend_schema(
        summary="Get resource details",
        description="Retrieve detailed information about a specific resource",
        tags=['Resources']
    ),
    update=extend_schema(
        summary="Update resource",
        description="Update resource information",
        tags=['Resources']
    ),
    destroy=extend_schema(
        summary="Delete resource",
        description="Delete a resource",
        tags=['Resources']
    )
)
class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    parser_classes = [MultiPartParser, FormParser]


@extend_schema_view(
    list=extend_schema(
        summary="List assignments",
        description="Retrieve a list of all assignments",
        tags=['Assignments']
    ),
    create=extend_schema(
        summary="Create an assignment",
        description="Create a new assignment (instructors only)",
        tags=['Assignments']
    ),
    retrieve=extend_schema(
        summary="Get assignment details",
        description="Retrieve detailed information about a specific assignment",
        tags=['Assignments']
    ),
    update=extend_schema(
        summary="Update assignment",
        description="Update assignment information (instructors only)",
        tags=['Assignments']
    ),
    partial_update=extend_schema(
        summary="Partially update assignment",
        description="Partially update assignment information (instructors only)",
        tags=['Assignments']
    ),
    destroy=extend_schema(
        summary="Delete assignment",
        description="Delete an assignment (instructors only)",
        tags=['Assignments']
    )
)
class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer


@extend_schema_view(
    list=extend_schema(
        summary="List submissions",
        description="Retrieve a list of all assignment submissions",
        tags=['Submissions']
    ),
    create=extend_schema(
        summary="Submit an assignment",
        description="Submit a file for an assignment (students only)",
        tags=['Submissions']
    ),
    retrieve=extend_schema(
        summary="Get submission details",
        description="Retrieve detailed information about a specific submission",
        tags=['Submissions']
    ),
    update=extend_schema(
        summary="Update submission",
        description="Update submission (for grading)",
        tags=['Submissions']
    ),
    partial_update=extend_schema(
        summary="Grade submission",
        description="Grade a submission (add marks and feedback)",
        tags=['Submissions']
    )
)
class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer

    @extend_schema(
        summary="Submit an assignment",
        description="Submit a file for an assignment. The student_external_id is automatically set from the authenticated user.",
        tags=['Submissions']
    )
    def create(self, request, *args, **kwargs):
        # student-only submit
        user_external = getattr(request.user, 'username', None) or request.META.get('HTTP_X_USER_EXTERNAL_ID')
        if not user_external:
            return Response({'detail': 'No external id supplied'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        data['student_external_id'] = user_external
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class ZoomWebhookView(views.APIView):
    """Handle incoming Zoom webhooks and update Session status accordingly.

    Implements Zoom's official webhook signature verification:
    https://developers.zoom.us/docs/api/rest/webhook-reference/
    
    Zoom sends: x-zm-signature, x-zm-request-timestamp headers
    Message format: v0:{timestamp}:{request_body}
    Signature: HMAC-SHA256 hash of message using webhook secret token
    """

    authentication_classes = []
    permission_classes = []

    def _verify_zoom_signature(self, request, body: bytes) -> bool:
        """Verify Zoom webhook signature according to official docs."""
        signature = request.META.get('HTTP_X_ZM_SIGNATURE', '')
        timestamp = request.META.get('HTTP_X_ZM_REQUEST_TIMESTAMP', '')
        secret = settings.ZOOM_WEBHOOK_SECRET
        
        if not secret or not signature or not timestamp:
            return False
        
        # Construct the message: v0:timestamp:body
        message = f'v0:{timestamp}:{body.decode("utf-8")}'
        
        # Compute HMAC-SHA256 hash
        hash_for_verify = hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Construct expected signature format
        expected_signature = f'v0={hash_for_verify}'
        
        # Constant-time comparison
        return hmac.compare_digest(expected_signature, signature)

    @extend_schema(
        exclude=True,  # Exclude from public API docs since this is webhook endpoint
        summary="Zoom webhook handler",
        description="Internal endpoint for receiving Zoom webhook events (meeting.started, meeting.ended, recording.completed)",
        tags=['Webhooks']
    )
    def post(self, request, format=None):
        body = request.body or b''
        
        # Verify signature using Zoom's official method
        if settings.ZOOM_WEBHOOK_SECRET and not self._verify_zoom_signature(request, body):
            return Response({'detail': 'Invalid signature'}, status=status.HTTP_403_FORBIDDEN)

        try:
            payload = request.data
        except Exception:
            payload = json.loads(body.decode('utf-8') or '{}')

        event = payload.get('event')
        event_id = payload.get('event_ts') or payload.get('payload', {}).get('object', {}).get('id')

        # Idempotency
        if event_id:
            if ZoomEventLog.objects.filter(event_id=str(event_id)).exists():
                return Response({'detail': 'already processed'})

        if event:
            # handle meeting.started / meeting.ended
            if event == 'meeting.started':
                obj = payload.get('payload', {}).get('object', {})
                meeting_id = str(obj.get('id') or obj.get('meeting_id'))
                Session.objects.filter(external_meeting_id=meeting_id).update(status='live')
            elif event == 'meeting.ended':
                obj = payload.get('payload', {}).get('object', {})
                meeting_id = str(obj.get('id') or obj.get('meeting_id'))
                Session.objects.filter(external_meeting_id=meeting_id).update(status='ended')
            elif event == 'recording.completed':
                # record handling left as extension: store event and metadata
                pass

        # log event for idempotency
        try:
            ZoomEventLog.objects.create(event_id=str(event_id or event), raw=payload)
        except Exception:
            pass

        return Response({'status': 'ok'})
