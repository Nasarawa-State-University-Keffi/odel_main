"""
API Views for the Assessment app - Moodle-style Quiz System

REFACTORED: Separated Student and Staff endpoints with unified queryset logic.
"""
import csv
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Prefetch
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse

from courses.models import CourseOffering, StudentRegisteredCourse, StaffAssignedCourse
from courses.services import resolve_academic_period
from portal_auth.models import PortalUser
from portal_auth.services import get_or_sync_student_registered_courses


from .models import (
    Assignment, AssignmentSubmission, AssignmentContent, AssignmentSubmissionFile,
    QuestionCategory, QuestionTypeAvailability, Question, Quiz, QuizQuestion, QuizAttempt, QuestionAttempt,
    Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentQuestionAttempt,
)
from .serializers import (
    AssignmentReadSerializer, AssignmentWriteSerializer, AssignmentContentSerializer, AssignmentSubmissionSerializer, AssignmentSubmissionFileSerializer,
    AssignmentContentUploadSerializer, AssignmentSubmissionFileUploadSerializer,
    QuestionCategorySerializer, QuestionTypeAvailabilitySerializer, QuestionSerializer, QuestionPublicSerializer, QuestionCreateUpdateSerializer,
    QuizSerializer, QuizDetailSerializer, QuizQuestionSlotSerializer,
    QuizAttemptSerializer, QuizAttemptDetailSerializer, StudentQuizAttemptSerializer, StudentQuizAttemptDetailSerializer,
    AssessmentSerializer, AssessmentDetailSerializer, AssessmentQuestionSlotSerializer,
    AssessmentBuildSerializer,
    AssessmentAttemptSerializer, StudentAssessmentAttemptSerializer, StudentAssessmentAttemptDetailSerializer,
    StartQuizSerializer, SubmitResponseSerializer, ManualGradeSerializer, StartAssignmentSubmissionSerializer,
    SubmitAssignmentSerializer, GradeAssignmentSerializer, GradeSerializer
)
from .services import AssessmentService, QuizService, QuestionService, create_submission, submit_submission, upload_assignment_content, upload_submission_file, grade_assignment_submission
from .permissions import IsInstructorOrReadOnly, IsPortalStudent


# ==========================================
# QUERYSET MIXINS
# ==========================================

ACADEMIC_PERIOD_PARAMETERS = [
    OpenApiParameter(
        name='session',
        type=str,
        location=OpenApiParameter.QUERY,
        required=True,
        description='Academic session, for example 2025/2026.',
    ),
    OpenApiParameter(
        name='semester',
        type=str,
        location=OpenApiParameter.QUERY,
        required=True,
        description='Semester, for example First Semester.',
    ),
]


def get_required_academic_period(request, *, source='query'):
    params = request.query_params if source == 'query' else request.data
    session = params.get('session')
    semester = params.get('semester')
    if not session or not semester:
        raise ValidationError({'detail': 'session and semester are required'})
    return resolve_academic_period(session, semester)


def get_student_registered_course_ids(request, *, source='query'):
    session, semester = get_required_academic_period(request, source=source)
    cache_key = (request.user.external_id, session, semester)
    if getattr(request, '_registered_course_period', None) == cache_key:
        return request._registered_course_ids

    enrollments = get_or_sync_student_registered_courses(
        student_external_id=request.user.external_id,
        session=session,
        semester=semester,
    )
    course_ids = [enrollment.course_id for enrollment in enrollments]
    request._registered_course_period = cache_key
    request._registered_course_ids = course_ids
    return course_ids


def get_student_registered_offering_ids(request, *, source='query'):
    """Return only offerings that can be tied to this student's enrolment.

    Older portal payloads did not carry a programme-type identifier.  A legacy
    enrolment is therefore usable only when its course has exactly one offering
    in the requested term; ambiguous offerings are deliberately excluded.
    """
    session, semester = get_required_academic_period(request, source=source)
    cache_key = (request.user.external_id, session, semester)
    if getattr(request, '_registered_offering_period', None) == cache_key:
        return request._registered_offering_ids

    get_student_registered_course_ids(request, source=source)
    enrollments = StudentRegisteredCourse.objects.filter(
        student_external_id=request.user.external_id,
        session=session,
        semester=semester,
    ).select_related('course_offering')
    offering_ids = [enrollment.course_offering_id for enrollment in enrollments if enrollment.course_offering_id]
    unresolved_course_ids = [enrollment.course_id for enrollment in enrollments if not enrollment.course_offering_id]
    if unresolved_course_ids:
        candidates = CourseOffering.objects.filter(
            course_id__in=unresolved_course_ids,
            session__name=session,
            semester__name=semester,
            status='active',
        )
        by_course = {}
        for offering in candidates.only('id', 'course_id'):
            by_course.setdefault(offering.course_id, []).append(offering.id)
        offering_ids.extend(ids[0] for ids in by_course.values() if len(ids) == 1)

    request._registered_offering_period = cache_key
    request._registered_offering_ids = offering_ids
    return offering_ids


def get_staff_assigned_course_ids(request, *, require_context=False):
    """Return the staff member's assigned courses, optionally for one teaching period."""
    programme_type_code = request.query_params.get('programme_type_code')
    session = request.query_params.get('session')
    semester = request.query_params.get('semester')
    supplied_context = (programme_type_code, session, semester)

    if require_context and not all(supplied_context):
        raise ValidationError({
            'detail': 'programme_type_code, session, and semester are required',
        })

    assignments = StaffAssignedCourse.objects.filter(
        staff_external_id=request.user.external_id,
    )
    if any(supplied_context):
        if not all(supplied_context):
            raise ValidationError({
                'detail': 'programme_type_code, session, and semester must be supplied together',
            })

        session, semester = resolve_academic_period(session, semester)
        assignments = assignments.filter(
            programme_type_code__iexact=programme_type_code.strip(),
            course_offering__session__name=session,
            course_offering__semester__name=semester,
        )

    return assignments.values_list('course_id', flat=True)


def get_staff_assigned_offering(request, course):
    """Return the exact teaching offering selected in the staff top bar."""
    programme_type_code = request.query_params.get('programme_type_code')
    session_name = request.query_params.get('session')
    semester_name = request.query_params.get('semester')
    if not all((programme_type_code, session_name, semester_name)):
        raise ValidationError({
            'detail': 'programme_type_code, session, and semester are required',
        })
    session_name, semester_name = resolve_academic_period(session_name, semester_name)
    assignment = StaffAssignedCourse.objects.select_related('course_offering').filter(
        staff_external_id=request.user.external_id,
        course=course,
        programme_type_code__iexact=programme_type_code.strip(),
        course_offering__session__name=session_name,
        course_offering__semester__name=semester_name,
    ).first()
    if not assignment or not assignment.course_offering:
        raise ValidationError({
            'course_id': 'Choose a course assigned to you in the selected programme, session, and semester.',
        })
    return assignment.course_offering


def get_staff_assigned_offering_ids(request):
    """Resolve the staff member's exact selected teaching period."""
    programme_type_code = request.query_params.get('programme_type_code')
    session_name = request.query_params.get('session')
    semester_name = request.query_params.get('semester')
    if not all((programme_type_code, session_name, semester_name)):
        raise ValidationError({
            'detail': 'programme_type_code, session, and semester are required',
        })
    session_name, semester_name = resolve_academic_period(session_name, semester_name)
    return StaffAssignedCourse.objects.filter(
        staff_external_id=request.user.external_id,
        programme_type_code__iexact=programme_type_code.strip(),
        course_offering__session__name=session_name,
        course_offering__semester__name=semester_name,
    ).values_list('course_offering_id', flat=True)

class StudentQuerySetMixin:
    def get_queryset(self):
        student_id = self.request.user.external_id
        serializer_class = self.get_serializer_class()
        model = serializer_class.Meta.model

        if model == Assignment:
            registered_courses = get_student_registered_course_ids(self.request)
            queryset = Assignment.objects.filter(
                course_id__in=registered_courses,
                is_published=True,
            ).select_related('course', 'created_by').prefetch_related(
                Prefetch(
                    'contents',
                    queryset=AssignmentContent.objects.filter(is_published=True),
                    to_attr='student_visible_contents',
                )
            )
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course__course_external_id=course_id)
            return queryset
        elif model == AssignmentSubmission:
            queryset = AssignmentSubmission.objects.filter(
                student_external_id=student_id
            ).select_related('assignment', 'student_external')
            assignment_id = self.request.query_params.get('assignment')
            if assignment_id:
                queryset = queryset.filter(assignment_id=assignment_id)
            submission_status = self.request.query_params.get('status')
            if submission_status:
                queryset = queryset.filter(status=submission_status)
            return queryset
        elif model == Quiz:
            registered_courses = get_student_registered_course_ids(self.request)
            queryset = Quiz.objects.filter(
                course_id__in=registered_courses,
                is_published=True,
            ).select_related("course")
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course__course_external_id=course_id)
            return queryset
        elif model == Assessment:
            registered_offerings = get_student_registered_offering_ids(self.request)
            queryset = Assessment.objects.filter(
                course_offering_id__in=registered_offerings,
                is_published=True,
            ).select_related('course', 'course_offering')
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course__course_external_id=course_id)
            return queryset
        elif model == QuizAttempt:
            queryset = QuizAttempt.objects.filter(user_external_id=student_id)
            quiz_id = self.request.query_params.get('quiz')
            if quiz_id:
                queryset = queryset.filter(quiz_id=quiz_id)
            state = self.request.query_params.get('state')
            if state:
                queryset = queryset.filter(state=state)
            return queryset.select_related('quiz')
        elif model == AssessmentAttempt:
            queryset = AssessmentAttempt.objects.filter(user_external_id=student_id)
            assessment_id = self.request.query_params.get('assessment')
            if assessment_id:
                queryset = queryset.filter(assessment_id=assessment_id)
            state = self.request.query_params.get('state')
            if state:
                queryset = queryset.filter(state=state)
            return queryset.select_related('assessment')
        return model.objects.none()

class StaffQuerySetMixin:
    def get_queryset(self):
        serializer_class = self.get_serializer_class()
        model = serializer_class.Meta.model
        is_assessment_resource = model in (Assessment, AssessmentQuestion, AssessmentAttempt)
        is_period_scoped_list = model == Assignment and self.request.method == 'GET' and not self.kwargs.get('pk')
        assigned_courses = get_staff_assigned_course_ids(
            self.request,
            require_context=is_period_scoped_list,
        )
        selected_offering_ids = get_staff_assigned_offering_ids(self.request) if is_assessment_resource else None

        if model == Assignment:
            return Assignment.objects.filter(course__in=assigned_courses).select_related("course")
        elif model == AssignmentSubmission:
            queryset = AssignmentSubmission.objects.filter(
                assignment__course__in=assigned_courses
            ).select_related('assignment', 'student_external')
            assignment_id = self.request.query_params.get('assignment')
            if assignment_id:
                queryset = queryset.filter(assignment_id=assignment_id)
            student_id = self.request.query_params.get('student_external_id')
            if student_id:
                queryset = queryset.filter(student_external_id=student_id)
            submission_status = self.request.query_params.get('status')
            if submission_status:
                queryset = queryset.filter(status=submission_status)
            return queryset
        elif model == Quiz:
            queryset = Quiz.objects.filter(course__in=assigned_courses).select_related("course")
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course__course_external_id=course_id)
            return queryset
        elif model == Assessment:
            queryset = Assessment.objects.filter(course_offering_id__in=selected_offering_ids).select_related('course', 'course_offering')
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course__course_external_id=course_id)
            return queryset
        elif model == QuestionCategory:
            queryset = QuestionCategory.objects.filter(course__in=assigned_courses).select_related('course')
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course__course_external_id=course_id)
            return queryset
        elif model == Question:
            queryset = Question.objects.filter(category__course__in=assigned_courses).select_related('category').prefetch_related('answers')
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(category__course__course_external_id=course_id)
            category_id = self.request.query_params.get('category')
            if category_id:
                queryset = queryset.filter(category_id=category_id)
            qtype = self.request.query_params.get('qtype')
            if qtype:
                queryset = queryset.filter(qtype=qtype)
            return queryset
        elif model == QuizQuestion:
            queryset = QuizQuestion.objects.filter(quiz__course__in=assigned_courses).select_related('quiz', 'question')
            quiz_id = self.request.query_params.get('quiz')
            if quiz_id:
                queryset = queryset.filter(quiz_id=quiz_id)
            return queryset
        elif model == AssessmentQuestion:
            queryset = AssessmentQuestion.objects.filter(
                assessment__course_offering_id__in=selected_offering_ids,
            ).select_related('assessment', 'question')
            assessment_id = self.request.query_params.get('assessment')
            if assessment_id:
                queryset = queryset.filter(assessment_id=assessment_id)
            return queryset
        elif model == QuizAttempt:
            queryset = QuizAttempt.objects.filter(quiz__course__in=assigned_courses).select_related('quiz')
            quiz_id = self.request.query_params.get('quiz')
            if quiz_id:
                queryset = queryset.filter(quiz_id=quiz_id)
            user_ext_id = self.request.query_params.get('user_external_id')
            if user_ext_id:
                queryset = queryset.filter(user_external_id=user_ext_id)
            state = self.request.query_params.get('state')
            if state:
                queryset = queryset.filter(state=state)
            return queryset
        elif model == AssessmentAttempt:
            queryset = AssessmentAttempt.objects.filter(
                assessment__course_offering_id__in=selected_offering_ids,
            ).select_related('assessment')
            assessment_id = self.request.query_params.get('assessment')
            if assessment_id:
                queryset = queryset.filter(assessment_id=assessment_id)
            user_ext_id = self.request.query_params.get('user_external_id')
            if user_ext_id:
                queryset = queryset.filter(user_external_id=user_ext_id)
            state = self.request.query_params.get('state')
            if state:
                queryset = queryset.filter(state=state)
            return queryset
        return model.objects.none()

@extend_schema(tags=['Student - Assignments'], parameters=ACADEMIC_PERIOD_PARAMETERS)
class StudentAssignmentListView(StudentQuerySetMixin, generics.ListAPIView):
    """Student read-only list access to assignments in their courses"""
    serializer_class = AssignmentReadSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


@extend_schema(tags=['Student - Assignments'], parameters=ACADEMIC_PERIOD_PARAMETERS)
class StudentAssignmentDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    """Student read-only detail access to an assignment"""
    serializer_class = AssignmentReadSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


# =========================================
# STUDENT - ASSIGNMENT SUBMISSION APIs

@extend_schema(tags=['Student - Assignments'])
class StudentSubmissionListView(StudentQuerySetMixin, generics.ListAPIView):
    """List my submissions (students)"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


@extend_schema(tags=['Student - Assignments'])
class StudentSubmissionDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    """View my submission (students)"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


class StudentSubmissionCreateView(APIView):
    """
    Unified endpoint to start an assignment submission and upload files items in one go.
    Uses multipart/form-data.
    """
    permission_classes = [IsAuthenticated, IsPortalStudent]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Create submission with files (students)",
        description="Starts a new attempt and uploads provided files.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'assignment_id': {'type': 'string', 'format': 'uuid'},
                    'session': {'type': 'string'},
                    'semester': {'type': 'string'},
                    'files': {'type': 'array', 'items': {'type': 'string', 'format': 'binary'}}
                },
                'required': ['assignment_id', 'session', 'semester']
            }
        },
        responses={201: AssignmentSubmissionSerializer},
        tags=['Student - Assignments']
    )
    def post(self, request):
        assignment_id = request.data.get('assignment_id')
        if not assignment_id:
            return Response({'error': 'assignment_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        student_id = request.user.external_id
        registered_course_ids = get_student_registered_course_ids(request, source='data')
        assignment = get_object_or_404(
            Assignment.objects.filter(
                course_id__in=registered_course_ids,
                is_published=True,
            ),
            id=assignment_id,
        )

        try:
            with transaction.atomic():
                # 1. Create submission
                submission = create_submission(assignment, student_id)
                
                # 2. Upload files if any
                files = request.FILES.getlist('files')
                for file_obj in files:
                    upload_submission_file(file_obj=file_obj, submission=submission)
                
                return Response(
                    AssignmentSubmissionSerializer(submission).data,
                    status=status.HTTP_201_CREATED
                )
        except (ValueError, DjangoValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Failed to create submission'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentSubmissionSubmitView(APIView):
    """Finalize a submission attempt (students)"""
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary="Submit assignment (students)",
        description="Finalizes the submission, locking it from further changes.",
        request=SubmitAssignmentSerializer,
        responses={
            200: OpenApiResponse(
                description="Submission successful",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            'status': 'success',
                            'message': 'Assignment submitted successfully',
                            'submission_id': '550e8400-e29b-41d4-a716-446655440000',
                            'submitted_at': '2025-10-15T12:00:00Z'
                        }
                    )
                ]
            )
        },
        tags=['Student - Assignments']
    )
    def post(self, request, pk=None):
        serializer = SubmitAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submission = get_object_or_404(
            AssignmentSubmission.objects.select_related('assignment'),
            id=pk,
        )
        
        # Verify student owns this submission
        if submission.student_external_id != request.user.external_id:
            return Response(
                {'error': 'You can only submit your own assignments'},
                status=status.HTTP_403_FORBIDDEN
            )

        registered_course_ids = get_student_registered_course_ids(request, source='data')
        if (
            submission.assignment.course_id not in registered_course_ids
            or not submission.assignment.is_published
        ):
            return Response(
                {'error': 'You are not registered for this assignment'},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        try:
            submit_submission(submission)
            return Response({
                'status': 'success',
                'message': 'Assignment submitted successfully',
                'submission_id': str(submission.id),
                'submitted_at': submission.submitted_at
            })
        except (ValueError, DjangoValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# STAFF - ASSIGNMENT APIs
# ==========================================

@extend_schema(tags=['Staff - Assignments'])
class StaffAssignmentListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    """
    Unified endpoint for list/create assignments.
    Create also handles initial file uploads via multipart/form-data.
    """
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AssignmentWriteSerializer
        return AssignmentReadSerializer

    @extend_schema(
        summary="Create assignment with content (staff)",
        description="Creates an assignment and uploads provided instruction/resource files using multipart/form-data.",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'title': {'type': 'string'},
                    'description': {'type': 'string'},
                    'open_at': {'type': 'string', 'format': 'date-time'},
                    'due_at': {'type': 'string', 'format': 'date-time'},
                    'close_at': {'type': 'string', 'format': 'date-time'},
                    'max_attempts': {'type': 'integer'},
                    'allow_late_submission': {'type': 'boolean'},
                    'is_published': {'type': 'boolean'},
                    'max_marks': {'type': 'number'},
                    'course': {'type': 'integer', 'description': 'Course external_id'},
                    'files': {'type': 'array', 'items': {'type': 'string', 'format': 'binary'}}
                },
                'required': ['title', 'course']
            }
        },
        tags=['Staff - Assignments']
    )
    def perform_create(self, serializer):
        with transaction.atomic():
            assignment = serializer.save(created_by=self.request.user)
            
            files = self.request.FILES.getlist('files')
            for file_obj in files:
                upload_assignment_content(
                    file_obj=file_obj,
                    assignment=assignment,
                    content_type='instruction',
                    user=self.request.user,
                    title=file_obj.name,
                    description=''
                )



@extend_schema(tags=['Staff - Assignments'])
class StaffAssignmentDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Staff detail/update/delete access to assignments"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AssignmentWriteSerializer
        return AssignmentReadSerializer


# ==========================================
# STAFF - ASSIGNMENT SUBMISSION APIs

@extend_schema(tags=['Staff - Assignments'])
class StaffSubmissionListView(StaffQuerySetMixin, generics.ListAPIView):
    """List all submissions (staff) with filtering"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


@extend_schema(tags=['Staff - Assignments'])
class StaffSubmissionDetailView(StaffQuerySetMixin, generics.RetrieveAPIView):
    """View any submission (staff)"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffSubmissionGradeView(APIView):
    """Grade an assignment submission (staff)"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    @extend_schema(
        summary="Grade assignment submission (staff)",
        description="Grade an assignment submission and create a grade record.",
        request=GradeAssignmentSerializer,
        responses={200: GradeSerializer},
        tags=['Staff - Assignments']
    )
    def post(self, request, pk=None):
        submission = get_object_or_404(AssignmentSubmission, id=pk)
        
        serializer = GradeAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        marks = serializer.validated_data['marks']
        
        try:
            grade = grade_assignment_submission(submission.id, marks)
            return Response(GradeSerializer(grade).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# STUDENT - QUIZ APIs
# ==========================================

@extend_schema(tags=['Student - Quizzes'], parameters=ACADEMIC_PERIOD_PARAMETERS)
class StudentQuizListView(StudentQuerySetMixin, generics.ListAPIView):
    """List available quizzes (students)"""
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


@extend_schema(tags=['Student - Quizzes'], parameters=ACADEMIC_PERIOD_PARAMETERS)
class StudentQuizDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    """View quiz details (students)"""
    serializer_class = QuizDetailSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


class StudentQuizStartView(APIView):
    """Start a new quiz attempt (students)"""
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary="Start quiz attempt (students)",
        request=StartQuizSerializer,
        responses={
            201: QuizAttemptSerializer,
            400: OpenApiResponse(description="The quiz is not currently available or the attempt limit was reached."),
        },
        tags=['Student - Quizzes']
    )
    def post(self, request, pk=None):
        serializer = StartQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        registered_course_ids = get_student_registered_course_ids(request, source='data')
        quiz = get_object_or_404(
            Quiz.objects.filter(course_id__in=registered_course_ids, is_published=True),
            id=pk,
        )
        user_external_id = request.user.external_id
        
        try:
            attempt = QuizService.start_attempt(quiz=quiz, user_external_id=user_external_id)
            return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)
        except (ValueError, DjangoValidationError) as exc:
            message = exc.messages[0] if isinstance(exc, DjangoValidationError) and exc.messages else str(exc)
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)


class StudentQuizSubmitResponseView(APIView):
    """Submit a response for a single question in an active attempt (students)"""
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary="Submit question response (students)",
        request=SubmitResponseSerializer,
        responses={
            200: OpenApiResponse(
                description="Response saved successfully",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            'success': True,
                            'question_attempt_id': '550e8400-e29b-41d4-a716-446655440000',
                            'message': 'Response saved.'
                        }
                    )
                ]
            )
        },
        tags=['Student - Quizzes']
    )
    def post(self, request, pk=None, attempt_id=None):
        quiz = get_object_or_404(Quiz, id=pk)
        attempt = get_object_or_404(QuizAttempt, id=attempt_id, quiz=quiz)
        
        if attempt.user_external_id != request.user.external_id:
            return Response({'error': 'Not your attempt'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = SubmitResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        question_id = serializer.validated_data['question_id']
        response_data = serializer.validated_data['response']
        question = get_object_or_404(Question, id=question_id)
        
        try:
            question_attempt = QuizService.submit_response(
                attempt=attempt,
                question=question,
                response=response_data
            )
            return Response({
                'success': True,
                'question_attempt_id': str(question_attempt.id),
                'message': 'Response saved.',
            })
        except (ValueError, DjangoValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentQuizFinishView(APIView):
    """Finish a quiz attempt (students)"""
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary="Finish quiz attempt (students)",
        request=None,
        responses={200: QuizAttemptDetailSerializer},
        tags=['Student - Quizzes']
    )
    def post(self, request, pk=None, attempt_id=None):
        quiz = get_object_or_404(Quiz, id=pk)
        attempt = get_object_or_404(QuizAttempt, id=attempt_id, quiz=quiz)
        
        if attempt.user_external_id != request.user.external_id:
            return Response({'error': 'Not your attempt'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            QuizService.finish_attempt(attempt)
            return Response(StudentQuizAttemptDetailSerializer(attempt).data)
        except (ValueError, DjangoValidationError) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)




# ==========================================
# STUDENT - QUIZ ATTEMPT APIs

@extend_schema(tags=['Student - Quizzes'])
class StudentAttemptListView(StudentQuerySetMixin, generics.ListAPIView):
    """List my quiz attempts (students)"""
    serializer_class = StudentQuizAttemptSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


@extend_schema(tags=['Student - Quizzes'])
class StudentAttemptDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    """Detail of a specific quiz attempt (students)"""
    serializer_class = StudentQuizAttemptDetailSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


# ==========================================
# STUDENT - AUTO-GRADED ASSESSMENT APIs

@extend_schema(tags=['Student - Assessments'], parameters=ACADEMIC_PERIOD_PARAMETERS)
class StudentAssessmentListView(StudentQuerySetMixin, generics.ListAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


@extend_schema(tags=['Student - Assessments'], parameters=ACADEMIC_PERIOD_PARAMETERS)
class StudentAssessmentDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    serializer_class = AssessmentDetailSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


class StudentAssessmentStartView(APIView):
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary='Start an assessment attempt',
        request=StartQuizSerializer,
        responses={201: StudentAssessmentAttemptSerializer},
        tags=['Student - Assessments'],
    )
    def post(self, request, pk=None):
        serializer = StartQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        get_required_academic_period(request, source='data')
        assessment = get_object_or_404(
            Assessment.objects.filter(
                course_offering_id__in=get_student_registered_offering_ids(request, source='data'),
                is_published=True,
            ),
            id=pk,
        )
        try:
            attempt = AssessmentService.start_attempt(
                assessment=assessment,
                user_external_id=request.user.external_id,
            )
            attempt = AssessmentAttempt.objects.select_related('assessment').prefetch_related(
                'question_attempts__question__answers',
            ).get(pk=attempt.pk)
            return Response(StudentAssessmentAttemptDetailSerializer(attempt).data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as exc:
            message = exc.messages[0] if exc.messages else str(exc)
            return Response({'message': message}, status=status.HTTP_400_BAD_REQUEST)


class StudentAssessmentSubmitResponseView(APIView):
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary='Save one assessment response',
        request=SubmitResponseSerializer,
        tags=['Student - Assessments'],
    )
    def post(self, request, pk=None, attempt_id=None):
        assessment = get_object_or_404(Assessment, id=pk)
        attempt = get_object_or_404(AssessmentAttempt, id=attempt_id, assessment=assessment)
        if attempt.user_external_id != request.user.external_id:
            return Response({'error': 'Not your attempt'}, status=status.HTTP_403_FORBIDDEN)
        serializer = SubmitResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        question = get_object_or_404(Question, id=serializer.validated_data['question_id'])
        try:
            question_attempt = AssessmentService.submit_response(
                attempt=attempt,
                question=question,
                response=serializer.validated_data['response'],
            )
            return Response({
                'success': True,
                'question_attempt_id': str(question_attempt.id),
                'message': 'Response saved.',
            })
        except DjangoValidationError as exc:
            message = exc.messages[0] if exc.messages else str(exc)
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


class StudentAssessmentFinishView(APIView):
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary='Finish an assessment attempt',
        responses={200: StudentAssessmentAttemptDetailSerializer},
        tags=['Student - Assessments'],
    )
    def post(self, request, pk=None, attempt_id=None):
        assessment = get_object_or_404(Assessment, id=pk)
        attempt = get_object_or_404(AssessmentAttempt, id=attempt_id, assessment=assessment)
        if attempt.user_external_id != request.user.external_id:
            return Response({'error': 'Not your attempt'}, status=status.HTTP_403_FORBIDDEN)
        try:
            AssessmentService.finish_attempt(attempt)
            attempt = AssessmentAttempt.objects.select_related('assessment').prefetch_related(
                'question_attempts__question__answers',
            ).get(pk=attempt.pk)
            return Response(StudentAssessmentAttemptDetailSerializer(attempt).data)
        except DjangoValidationError as exc:
            message = exc.messages[0] if exc.messages else str(exc)
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Student - Assessments'])
class StudentAssessmentAttemptListView(StudentQuerySetMixin, generics.ListAPIView):
    serializer_class = StudentAssessmentAttemptSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


@extend_schema(tags=['Student - Assessments'])
class StudentAssessmentAttemptDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    serializer_class = StudentAssessmentAttemptDetailSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


# ==========================================
# STAFF - QUIZ APIs
# ==========================================

@extend_schema(tags=['Staff - Quizzes'])
class StaffQuizListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create quizzes (staff)"""
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if not StaffAssignedCourse.objects.filter(
            staff_external_id=self.request.user.external_id,
            course=course,
        ).exists():
            raise ValidationError({'course_id': 'You are not assigned to this course.'})
        serializer.save()


@extend_schema(tags=['Staff - Quizzes'])
class StaffQuizDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete quiz (staff)"""
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


@extend_schema(tags=['Staff - Quizzes'])
class StaffQuizAttemptListView(StaffQuerySetMixin, generics.ListAPIView):
    """List all quiz attempts (staff)"""
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


@extend_schema(tags=['Staff - Quizzes'])
class StaffQuizAttemptDetailView(StaffQuerySetMixin, generics.RetrieveAPIView):
    """View any attempt details (staff)"""
    serializer_class = QuizAttemptDetailSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffQuizManualGradeView(APIView):
    """Manually grade a question attempt (staff)"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    @extend_schema(
        summary="Manually grade quiz question (staff)",
        request=ManualGradeSerializer,
        responses={
            200: OpenApiResponse(
                description="Question manually graded successfully",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            'success': True,
                            'fraction': 0.8,
                            'score': 4.0,
                            'feedback': 'Good effort but missed a small detail.'
                        }
                    )
                ]
            )
        },
        tags=['Staff - Quizzes']
    )
    def post(self, request, pk=None, question_attempt_id=None):
        question_attempt = get_object_or_404(QuestionAttempt, id=question_attempt_id, quiz_attempt_id=pk)
        if not StaffAssignedCourse.objects.filter(
            staff_external_id=request.user.external_id,
            course=question_attempt.quiz_attempt.quiz.course,
        ).exists():
            return Response({'error': 'You do not have permission to grade this quiz.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ManualGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        fraction = serializer.validated_data['fraction']
        feedback = serializer.validated_data.get('feedback', '')
        
        try:
            QuestionService.manually_grade_attempt(question_attempt, fraction, feedback)
            return Response({
                'success': True,
                'fraction': float(question_attempt.fraction),
                'score': float(question_attempt.score),
                'feedback': question_attempt.feedback
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# STAFF - AUTO-GRADED ASSESSMENT APIs

class StaffAssessmentBuildView(APIView):
    """Create an assessment and every selected question slot in one transaction."""

    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    @extend_schema(
        summary='Build a term-scoped auto-graded assessment',
        request=AssessmentBuildSerializer,
        responses={201: AssessmentDetailSerializer},
        tags=['Staff - Assessments'],
    )
    def post(self, request):
        serializer = AssessmentBuildSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data.copy()
        selections = validated.pop('questions')
        course = validated['course']
        course_offering = get_staff_assigned_offering(request, course)

        question_ids = [selection['question'] for selection in selections]
        questions = {
            question.id: question
            for question in Question.objects.filter(id__in=question_ids).select_related('category')
        }
        requested_publish = validated.pop('is_published', False)
        with transaction.atomic():
            assessment = Assessment.objects.create(
                **validated,
                course_offering=course_offering,
                is_published=False,
            )
            AssessmentQuestion.objects.bulk_create([
                AssessmentQuestion(
                    assessment=assessment,
                    question=questions[selection['question']],
                    order=selection['order'],
                    max_mark=selection['max_mark'],
                )
                for selection in selections
            ])
            if requested_publish:
                assessment.is_published = True
                assessment.full_clean()
                assessment.save(update_fields=['is_published'])

        assessment = Assessment.objects.select_related('course', 'course_offering').prefetch_related(
            'assessment_questions__question__answers',
        ).get(pk=assessment.pk)
        return Response(AssessmentDetailSerializer(assessment).data, status=status.HTTP_201_CREATED)

@extend_schema(tags=['Staff - Assessments'])
class StaffAssessmentListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        course_offering = get_staff_assigned_offering(self.request, course)
        # The legacy endpoint may create drafts, but never an empty published
        # assessment. The builder endpoint above is the supported publish path.
        serializer.save(course_offering=course_offering, is_published=False)


@extend_schema(tags=['Staff - Assessments'])
class StaffAssessmentDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_serializer_class(self):
        return AssessmentDetailSerializer if self.request.method == 'GET' else AssessmentSerializer

    def perform_update(self, serializer):
        assessment = serializer.instance
        requested_publish = serializer.validated_data.get('is_published', assessment.is_published)
        if requested_publish and not assessment.assessment_questions.exists():
            raise ValidationError({'is_published': 'Add at least one question before publishing this assessment.'})
        course = serializer.validated_data.get('course', assessment.course)
        if course != assessment.course:
            if assessment.assessment_questions.exists() or assessment.attempts.exists():
                raise ValidationError({
                    'course_id': 'An assessment with questions or student attempts cannot change course. Create a new assessment for the new course.',
                })
            serializer.save(course_offering=get_staff_assigned_offering(self.request, course))
            return
        if requested_publish and not assessment.course_offering_id:
            raise ValidationError({'is_published': 'Attach this assessment to a teaching period before publishing it.'})
        serializer.save()


@extend_schema(tags=['Staff - Assessments'])
class StaffAssessmentQuestionListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    serializer_class = AssessmentQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        assessment = serializer.validated_data['assessment']
        selected_offering = get_staff_assigned_offering(self.request, assessment.course)
        if assessment.course_offering_id != selected_offering.id:
            raise ValidationError({'assessment': 'Select the teaching period this assessment belongs to.'})
        # Assessment attempts snapshot their linked question slots at the time
        # they begin. Appending a new slot is therefore safe: it is visible only
        # to attempts started afterwards, while existing work remains unchanged.
        serializer.save()


@extend_schema(tags=['Staff - Assessments'])
class StaffAssessmentQuestionDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AssessmentQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def _ensure_questions_are_editable(self):
        if self.get_object().assessment.attempts.exists():
            raise ValidationError({
                'detail': 'Existing questions cannot be changed after a student starts an attempt. You may add questions for future attempts.',
            })

    def perform_update(self, serializer):
        self._ensure_questions_are_editable()
        serializer.save()

    def perform_destroy(self, instance):
        if instance.assessment.attempts.exists():
            raise ValidationError({
                'detail': 'Existing questions cannot be removed after a student starts an attempt. You may add questions for future attempts.',
            })
        instance.delete()


@extend_schema(tags=['Staff - Assessments'])
class StaffAssessmentAttemptListView(StaffQuerySetMixin, generics.ListAPIView):
    serializer_class = AssessmentAttemptSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


@extend_schema(tags=['Staff - Assessments'])
class StaffAssessmentAttemptDetailView(StaffQuerySetMixin, generics.RetrieveAPIView):
    serializer_class = AssessmentAttemptSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


# ==========================================
# STAFF - QUESTION BANK APIs

class StaffQuestionBankMixin:
    """Scopes staff CRUD to one of the intentionally separate question banks."""

    question_bank = 'quiz'

    def get_queryset(self):
        return super().get_queryset().filter(
            **({'bank': self.question_bank} if self.get_serializer_class().Meta.model == QuestionCategory else {'category__bank': self.question_bank})
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['question_bank'] = self.question_bank
        return context


class StaffQuestionCategoryCreateMixin(StaffQuestionBankMixin):
    def perform_create(self, serializer):
        course = serializer.validated_data['course']
        if not StaffAssignedCourse.objects.filter(
            staff_external_id=self.request.user.external_id,
            course=course,
        ).exists():
            raise ValidationError({'course_id': 'You are not assigned to this course.'})
        serializer.save(bank=self.question_bank)


@extend_schema(tags=['Staff - Question Bank'])
class StaffQuestionCategoryListCreateView(StaffQuestionCategoryCreateMixin, StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create question categories (staff)"""
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


@extend_schema(tags=['Staff - Question Bank'])
class StaffQuestionCategoryDetailView(StaffQuestionBankMixin, StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete question category (staff)"""
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


@extend_schema(tags=['Staff - Question Bank'])
class StaffQuestionListCreateView(StaffQuestionBankMixin, StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create questions (staff)"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuestionCreateUpdateSerializer
        return QuestionSerializer


@extend_schema(tags=['Staff - Question Bank'])
class StaffQuestionDetailView(StaffQuestionBankMixin, StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete question (staff)"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return QuestionCreateUpdateSerializer
        return QuestionSerializer


@extend_schema(tags=['Staff - Assessment Question Bank'])
class StaffAssessmentQuestionCategoryListCreateView(StaffQuestionCategoryListCreateView):
    question_bank = 'assessment'


@extend_schema(tags=['Staff - Assessment Question Bank'])
class StaffAssessmentQuestionCategoryDetailView(StaffQuestionCategoryDetailView):
    question_bank = 'assessment'


@extend_schema(tags=['Staff - Assessment Question Bank'])
class StaffAssessmentBankQuestionListCreateView(StaffQuestionListCreateView):
    question_bank = 'assessment'


@extend_schema(tags=['Staff - Assessment Question Bank'])
class StaffAssessmentBankQuestionDetailView(StaffQuestionDetailView):
    question_bank = 'assessment'


@extend_schema(tags=['Staff - Quizzes'])
class StaffQuizQuestionListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create quiz question slots (staff)"""
    serializer_class = QuizQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        quiz = serializer.validated_data['quiz']
        if not StaffAssignedCourse.objects.filter(
            staff_external_id=self.request.user.external_id,
            course=quiz.course,
        ).exists():
            raise ValidationError({'quiz': 'You are not assigned to this course.'})
        serializer.save()


@extend_schema(tags=['Staff - Quizzes'])
class StaffQuizQuestionDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete quiz question slot (staff)"""
    serializer_class = QuizQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffAssignmentExportView(APIView):
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    @extend_schema(
        summary="Export assignment scores as CSV (staff)",
        description="Generates and downloads a CSV spreadsheet containing all student scores for the given assignment.",
        responses={200: OpenApiResponse(description="CSV File download")},
        tags=['Staff - Assignments']
    )
    def get(self, request, pk=None):
        assignment = get_object_or_404(Assignment, id=pk)
        staff_id = request.user.external_id
        
        # Check permission: Staff must be assigned to the course
        if not StaffAssignedCourse.objects.filter(staff_external_id=staff_id, course=assignment.course).exists():
            return Response(
                {'error': 'You do not have permission to view this course\'s grades.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get all registered students
        registered = StudentRegisteredCourse.objects.filter(course=assignment.course)
        student_ids = list(registered.values_list('student_external_id', flat=True))
        
        # Map portal users for names and emails
        portal_users = PortalUser.objects.filter(external_id__in=student_ids)
        user_map = {u.external_id: u for u in portal_users}
        
        # Get all submissions for this assignment
        submissions = AssignmentSubmission.objects.filter(
            assignment=assignment,
            student_external_id__in=student_ids
        )
        
        # Group submissions by student (keep the highest score attempt, or latest if no score)
        submission_map = {}
        for sub in submissions:
            existing = submission_map.get(sub.student_external_id)
            if not existing:
                submission_map[sub.student_external_id] = sub
            else:
                if sub.status == 'graded' and existing.status != 'graded':
                    submission_map[sub.student_external_id] = sub
                elif sub.status == 'graded' and existing.status == 'graded':
                    if (sub.marks or 0) > (existing.marks or 0):
                        submission_map[sub.student_external_id] = sub
                elif sub.status != 'graded' and existing.status != 'graded':
                    if sub.attempt_number > existing.attempt_number:
                        submission_map[sub.student_external_id] = sub

        response = HttpResponse(content_type='text/csv')
        filename = f"assignment_{assignment.title.replace(' ', '_')}_scores.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Student ID', 'Student Name', 'Student Email',
            'Submission Status', 'Attempt Number', 'Submitted At',
            'Score', 'Max Marks', 'Percentage'
        ])
        
        for student_id in student_ids:
            user = user_map.get(student_id)
            full_name = user.full_name if user else "N/A"
            email = user.email if user else "N/A"
            
            sub = submission_map.get(student_id)
            if not sub:
                writer.writerow([
                    student_id, full_name, email,
                    'No Submission', 'N/A', 'N/A',
                    'N/A', float(assignment.max_marks), 'N/A'
                ])
            else:
                score = float(sub.marks) if sub.marks is not None else 'N/A'
                percentage = float((sub.marks / assignment.max_marks) * 100) if sub.marks is not None else 'N/A'
                submitted_at = sub.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if sub.submitted_at else 'N/A'
                writer.writerow([
                    student_id, full_name, email,
                    sub.get_status_display(), sub.attempt_number, submitted_at,
                    score, float(assignment.max_marks), percentage
                ])
                
        return response


class StaffQuizExportView(APIView):
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    @extend_schema(
        summary="Export quiz scores as CSV (staff)",
        description="Generates and downloads a CSV spreadsheet containing all student scores for the given quiz.",
        responses={200: OpenApiResponse(description="CSV File download")},
        tags=['Staff - Quizzes']
    )
    def get(self, request, pk=None):
        quiz = get_object_or_404(Quiz, id=pk)
        staff_id = request.user.external_id
        
        # Check permission: Staff must be assigned to the course
        if not StaffAssignedCourse.objects.filter(staff_external_id=staff_id, course=quiz.course).exists():
            return Response(
                {'error': 'You do not have permission to view this course\'s grades.'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Get all registered students
        registered = StudentRegisteredCourse.objects.filter(course=quiz.course)
        student_ids = list(registered.values_list('student_external_id', flat=True))
        
        # Map portal users for names and emails
        portal_users = PortalUser.objects.filter(external_id__in=student_ids)
        user_map = {u.external_id: u for u in portal_users}
        
        # Get all attempts for this quiz
        attempts = QuizAttempt.objects.filter(
            quiz=quiz,
            user_external_id__in=student_ids
        )
        
        # Group attempts by student
        student_attempts = {}
        for attempt in attempts:
            ext_id = attempt.user_external_id
            if ext_id not in student_attempts:
                student_attempts[ext_id] = []
            student_attempts[ext_id].append(attempt)
            
        response = HttpResponse(content_type='text/csv')
        filename = f"quiz_{quiz.name.replace(' ', '_')}_scores.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Student ID', 'Student Name', 'Student Email',
            'Attempt State', 'Total Attempts', 'Best Attempt Number',
            'Score', 'Max Grade', 'Percentage', 'Finished At'
        ])
        
        for student_id in student_ids:
            user = user_map.get(student_id)
            full_name = user.full_name if user else "N/A"
            email = user.email if user else "N/A"
            
            user_attempts = student_attempts.get(student_id, [])
            total_attempts = len(user_attempts)
            
            if total_attempts == 0:
                writer.writerow([
                    student_id, full_name, email,
                    'No Attempt', 0, 'N/A',
                    'N/A', float(quiz.max_grade), 'N/A', 'N/A'
                ])
            else:
                best_attempt = None
                for attempt in user_attempts:
                    if best_attempt is None:
                        best_attempt = attempt
                    else:
                        if attempt.total_score is not None and best_attempt.total_score is not None:
                            if attempt.total_score > best_attempt.total_score:
                                best_attempt = attempt
                        elif attempt.total_score is not None and best_attempt.total_score is None:
                            best_attempt = attempt
                        elif attempt.total_score is None and best_attempt.total_score is None:
                            if attempt.attempt_number > best_attempt.attempt_number:
                                best_attempt = attempt
                                
                score = float(best_attempt.total_score) if best_attempt.total_score is not None else 'N/A'
                percentage = float((best_attempt.total_score / quiz.max_grade) * 100) if best_attempt.total_score is not None else 'N/A'
                finished_at = best_attempt.finished_at.strftime('%Y-%m-%d %H:%M:%S') if best_attempt.finished_at else 'N/A'
                
                writer.writerow([
                    student_id, full_name, email,
                    best_attempt.get_state_display(), total_attempts, best_attempt.attempt_number,
                    score, float(quiz.max_grade), percentage, finished_at
                ])
                
        return response
