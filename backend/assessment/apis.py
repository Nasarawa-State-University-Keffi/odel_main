"""
API Views for the Assessment app - Moodle-style Quiz System

REFACTORED: Separated Student and Staff endpoints with unified queryset logic.
"""
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse

from courses.models import StudentRegisteredCourse, StaffAssignedCourse


from .models import (
    Assignment, AssignmentSubmission, AssignmentContent, AssignmentSubmissionFile,
    QuestionCategory, QuestionTypeAvailability, Question, Quiz, QuizQuestion, QuizAttempt, QuestionAttempt
)
from .serializers import (
    AssignmentReadSerializer, AssignmentWriteSerializer, AssignmentContentSerializer, AssignmentSubmissionSerializer, AssignmentSubmissionFileSerializer,
    AssignmentContentUploadSerializer, AssignmentSubmissionFileUploadSerializer,
    QuestionCategorySerializer, QuestionTypeAvailabilitySerializer, QuestionSerializer, QuestionPublicSerializer, QuestionCreateUpdateSerializer,
    QuizSerializer, QuizDetailSerializer, QuizQuestionSlotSerializer,
    QuizAttemptSerializer, QuizAttemptDetailSerializer,
    StartQuizSerializer, SubmitResponseSerializer, ManualGradeSerializer, StartAssignmentSubmissionSerializer,
    SubmitAssignmentSerializer, GradeAssignmentSerializer, GradeSerializer
)
from .services import QuizService, QuestionService, create_submission, submit_submission, upload_assignment_content, upload_submission_file, grade_assignment_submission
from .permissions import IsInstructorOrReadOnly, IsPortalStudent


# ==========================================
# QUERYSET MIXINS
# ==========================================

class StudentQuerySetMixin:
    def get_queryset(self):
        student_id = self.request.user.external_id
        registered_courses = StudentRegisteredCourse.objects.filter(
            student_external_id=student_id
        ).values_list('course', flat=True)
        
        model = self.queryset.model if self.queryset else self.serializer_class.Meta.model
        
        if model == Assignment:
            return Assignment.objects.filter(course__in=registered_courses, is_published=True).select_related("course")
        elif model == AssignmentSubmission:
            queryset = AssignmentSubmission.objects.filter(student_external_id=student_id).select_related('assignment')
            assignment_id = self.request.query_params.get('assignment')
            if assignment_id:
                queryset = queryset.filter(assignment_id=assignment_id)
            submission_status = self.request.query_params.get('status')
            if submission_status:
                queryset = queryset.filter(status=submission_status)
            return queryset
        elif model == Quiz:
            queryset = Quiz.objects.filter(course__in=registered_courses).select_related("course")
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course_id=course_id)
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
        return model.objects.none()

class StaffQuerySetMixin:
    def get_queryset(self):
        staff_id = self.request.user.external_id
        assigned_courses = StaffAssignedCourse.objects.filter(
            staff_external_id=staff_id
        ).values_list('course', flat=True)
        
        model = self.queryset.model if self.queryset else self.serializer_class.Meta.model
        
        if model == Assignment:
            return Assignment.objects.filter(course__in=assigned_courses).select_related("course")
        elif model == AssignmentSubmission:
            queryset = AssignmentSubmission.objects.filter(assignment__course__in=assigned_courses).select_related('assignment')
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
                queryset = queryset.filter(course_id=course_id)
            return queryset
        elif model == QuestionCategory:
            queryset = QuestionCategory.objects.filter(course__in=assigned_courses).select_related('course')
            course_id = self.request.query_params.get('course')
            if course_id:
                queryset = queryset.filter(course_id=course_id)
            return queryset
        elif model == Question:
            queryset = Question.objects.filter(category__course__in=assigned_courses).select_related('category').prefetch_related('answers')
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
        return model.objects.none()

class StudentAssignmentListView(StudentQuerySetMixin, generics.ListAPIView):
    """Student read-only list access to assignments in their courses"""
    serializer_class = AssignmentReadSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


class StudentAssignmentDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    """Student read-only detail access to an assignment"""
    serializer_class = AssignmentReadSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


# =========================================
# STUDENT - ASSIGNMENT SUBMISSION APIs

class StudentSubmissionListView(StudentQuerySetMixin, generics.ListAPIView):
    """List my submissions (students)"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


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
                    'files': {'type': 'array', 'items': {'type': 'string', 'format': 'binary'}}
                },
                'required': ['assignment_id']
            }
        },
        responses={201: AssignmentSubmissionSerializer},
        tags=['Student - Assignments']
    )
    def post(self, request):
        assignment_id = request.data.get('assignment_id')
        if not assignment_id:
            return Response({'error': 'assignment_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        assignment = get_object_or_404(Assignment, id=assignment_id)
        student_id = request.user.external_id

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
        except ValueError as e:
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
        responses={200: dict},
        tags=['Student - Assignments']
    )
    def post(self, request, pk=None):
        submission = get_object_or_404(AssignmentSubmission, id=pk)
        
        # Verify student owns this submission
        if submission.student_external_id != request.user.external_id:
            return Response(
                {'error': 'You can only submit your own assignments'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            submit_submission(submission)
            return Response({
                'status': 'success',
                'message': 'Assignment submitted successfully',
                'submission_id': str(submission.id),
                'submitted_at': submission.submitted_at
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# STAFF - ASSIGNMENT APIs
# ==========================================

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



class StaffAssignmentDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Staff detail/update/delete access to assignments"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AssignmentWriteSerializer
        return AssignmentReadSerializer


# ==========================================
# STAFF - ASSIGNMENT SUBMISSION APIs

class StaffSubmissionListView(StaffQuerySetMixin, generics.ListAPIView):
    """List all submissions (staff) with filtering"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


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

class StudentQuizListView(StudentQuerySetMixin, generics.ListAPIView):
    """List available quizzes (students)"""
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


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
        responses={201: QuizAttemptSerializer},
        tags=['Student - Quizzes']
    )
    def post(self, request, pk=None):
        quiz = get_object_or_404(Quiz, id=pk)
        user_external_id = request.user.external_id
        
        try:
            attempt = QuizService.start_attempt(quiz=quiz, user_external_id=user_external_id)
            return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentQuizSubmitResponseView(APIView):
    """Submit a response for a single question in an active attempt (students)"""
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary="Submit question response (students)",
        request=SubmitResponseSerializer,
        responses={200: dict},
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
                'fraction': float(question_attempt.fraction),
                'score': float(question_attempt.score),
                'feedback': question_attempt.feedback
            })
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StudentQuizFinishView(APIView):
    """Finish a quiz attempt (students)"""
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        summary="Finish quiz attempt (students)",
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
            return Response(QuizAttemptDetailSerializer(attempt).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)




# ==========================================
# STUDENT - QUIZ ATTEMPT APIs

class StudentAttemptListView(StudentQuerySetMixin, generics.ListAPIView):
    """List my quiz attempts (students)"""
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]


class StudentAttemptDetailView(StudentQuerySetMixin, generics.RetrieveAPIView):
    """Detail of a specific quiz attempt (students)"""
    serializer_class = QuizAttemptDetailSerializer
    permission_classes = [IsAuthenticated, IsPortalStudent]

# ==========================================
# STAFF - QUIZ APIs
# ==========================================

class StaffQuizListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create quizzes (staff)"""
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffQuizDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete quiz (staff)"""
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffQuizAttemptListView(StaffQuerySetMixin, generics.ListAPIView):
    """List all quiz attempts (staff)"""
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


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
        responses={200: dict},
        tags=['Staff - Quizzes']
    )
    def post(self, request, pk=None, question_attempt_id=None):
        question_attempt = get_object_or_404(QuestionAttempt, id=question_attempt_id, quiz_attempt_id=pk)
        
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
# STAFF - QUESTION BANK APIs

class StaffQuestionCategoryListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create question categories (staff)"""
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffQuestionCategoryDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete question category (staff)"""
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffQuestionListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create questions (staff)"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return QuestionCreateUpdateSerializer
        return QuestionSerializer


class StaffQuestionDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete question (staff)"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return QuestionCreateUpdateSerializer
        return QuestionSerializer


class StaffQuizQuestionListCreateView(StaffQuerySetMixin, generics.ListCreateAPIView):
    """List/Create quiz question slots (staff)"""
    serializer_class = QuizQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]


class StaffQuizQuestionDetailView(StaffQuerySetMixin, generics.RetrieveUpdateDestroyAPIView):
    """Detail/Update/Delete quiz question slot (staff)"""
    serializer_class = QuizQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

