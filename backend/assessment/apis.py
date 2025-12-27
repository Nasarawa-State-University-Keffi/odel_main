"""
API Views for the Assessment app - Moodle-style Quiz System

DRF ViewSets for assignments, question bank, quizzes, and attempts.
REFACTORED: Separated Student and Staff endpoints for clean role-based access.
"""
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.db import transaction
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample, OpenApiResponse

from .models import (
    Assignment, AssignmentSubmission, AssignmentContent, AssignmentSubmissionFile,
    QuestionCategory, QuestionTypeAvailability, Question, Quiz, QuizQuestion, QuizAttempt, QuestionAttempt
)
from .serializers import (
    AssignmentSerializer, AssignmentContentSerializer, AssignmentSubmissionSerializer, AssignmentSubmissionFileSerializer,
    AssignmentContentUploadSerializer, AssignmentSubmissionFileUploadSerializer,
    QuestionCategorySerializer, QuestionTypeAvailabilitySerializer, QuestionSerializer, QuestionPublicSerializer, QuestionCreateUpdateSerializer,
    QuizSerializer, QuizDetailSerializer, QuizWithQuestionsSerializer, QuizQuestionSlotSerializer,
    QuizAttemptSerializer, QuizAttemptDetailSerializer,
    StartQuizSerializer, SubmitResponseSerializer, ManualGradeSerializer, StartAssignmentSubmissionSerializer,
    SubmitAssignmentSerializer, GradeAssignmentSerializer, GradeSerializer
)
from .services import QuizService, QuestionService, create_submission, submit_submission, upload_assignment_content, upload_submission_file, grade_assignment_submission
from .permissions import IsInstructorOrReadOnly


# ==========================================
# STUDENT - ASSIGNMENT APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List assignments (students)",
        description="Students can view published assignments.",
        tags=['Student - Assignments']
    ),
    retrieve=extend_schema(
        summary="View assignment details (students)",
        description="Get detailed information about an assignment including content files.",
        tags=['Student - Assignments']
    ),
)
class StudentAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    """Student read-only access to assignments"""
    queryset = Assignment.objects.filter(is_published=True)
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    list=extend_schema(
        summary="List my submissions (students)",
        description="Students can only view their own submissions.",
        parameters=[
            OpenApiParameter(
                name="assignment",
                description="Assignment UUID - filter submissions for a specific assignment",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="status",
                description="Submission status - filter by status (draft/submitted/graded/reopened)",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            )
        ],
        tags=['Student - Assignments']
    ),
    retrieve=extend_schema(
        summary="View my submission (students)",
        description="Retrieve a specific submission (students can only access their own).",
        tags=['Student - Assignments']
    ),
)
class StudentAssignmentSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Student ViewSet for assignment submissions"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Students can only see their own submissions"""
        student_id = self.request.user.username
        
        queryset = AssignmentSubmission.objects.filter(
            student_external_id=student_id
        ).select_related('assignment')
        
        # Apply filters
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
        
        submission_status = self.request.query_params.get('status')
        if submission_status:
            queryset = queryset.filter(status=submission_status)
        
        return queryset

    @extend_schema(
        summary="Start assignment submission",
        description="""
        Creates a new submission attempt for an assignment.

        Rules:
        - Assignment must be open
        - Attempt limits are enforced
        - Late submission rules apply
        """,
        request=StartAssignmentSubmissionSerializer,
        responses={
            201: AssignmentSubmissionSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=['Student - Assignments']
    )
    @action(detail=False, methods=['post'])
    def start(self, request):
        assignment_id = request.data.get('assignment_id')
        student_id = request.user.username

        assignment = get_object_or_404(Assignment, id=assignment_id)

        try:
            submission = create_submission(assignment, student_id)
            return Response(
                AssignmentSubmissionSerializer(submission).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Submit assignment",
        description="""
        Finalize a submission attempt.

        - Locks the submission
        - Prevents further file uploads
        - Changes status to `submitted`
        """,
        request=SubmitAssignmentSerializer,
        responses={
            200: OpenApiResponse(
                response=dict,
                description="Submission successfully submitted"
            ),
            400: OpenApiResponse(description="Invalid submission state"),
        },
        tags=['Student - Assignments']
    )
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        submission = self.get_object()
        
        # Verify student owns this submission
        if submission.student_external_id != request.user.username:
            return Response(
                {'status': 'error', 'detail': 'You can only submit your own assignments'},
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
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema_view(
    list=extend_schema(exclude=True),
    retrieve=extend_schema(exclude=True),
    create=extend_schema(exclude=True),
    update=extend_schema(exclude=True),
    partial_update=extend_schema(exclude=True),
    destroy=extend_schema(
        summary="Delete my submission file",
        description="Remove a file from my submission (only allowed in draft status)",
        tags=['Student - Assignments']
    )
)
class StudentAssignmentSubmissionFileViewSet(viewsets.ModelViewSet):
    """Student ViewSet for managing their own submission files"""
    queryset = AssignmentSubmissionFile.objects.all()
    serializer_class = AssignmentSubmissionFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Students can only access their own submission files"""
        student_id = self.request.user.username
        return AssignmentSubmissionFile.objects.filter(
            submission__student_external_id=student_id
        ).select_related('submission')
    
    @extend_schema(
        summary="Upload submission file",
        description="Upload a file as part of an assignment submission",
        request=AssignmentSubmissionFileUploadSerializer,
        responses={201: AssignmentSubmissionFileSerializer},
        tags=['Student - Assignments']
    )
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Upload submission file"""
        serializer = AssignmentSubmissionFileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            submission = get_object_or_404(AssignmentSubmission, id=serializer.validated_data['submission'])
            
            # Verify student owns this submission
            if submission.student_external_id != request.user.username:
                return Response(
                    {'status': 'error', 'detail': 'You can only upload to your own submissions'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            submission_file = upload_submission_file(
                file_obj=serializer.validated_data['file'],
                submission=submission
            )
            
            return Response(
                AssignmentSubmissionFileSerializer(submission_file).data,
                status=status.HTTP_201_CREATED
            )
            
        except ValueError as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ==========================================
# STAFF - ASSIGNMENT APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List all assignments (staff)",
        description="Staff can view all assignments including unpublished ones.",
        tags=['Staff - Assignments']
    ),
    retrieve=extend_schema(
        summary="View assignment details (staff)",
        description="Get detailed information about any assignment.",
        tags=['Staff - Assignments']
    ),
    create=extend_schema(
        summary="Create assignment (staff)",
        description="Create a new assignment for a course.",
        tags=['Staff - Assignments']
    ),
    update=extend_schema(
        summary="Update assignment (staff)",
        description="Update an assignment.",
        tags=['Staff - Assignments']
    ),
    destroy=extend_schema(
        summary="Delete assignment (staff)",
        description="Delete an assignment.",
        tags=['Staff - Assignments']
    ),
)
class StaffAssignmentViewSet(viewsets.ModelViewSet):
    """Staff full CRUD access to assignments"""
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


@extend_schema_view(
    list=extend_schema(
        summary="List all submissions (staff)",
        description="Staff can view all submissions with filtering options.",
        parameters=[
            OpenApiParameter(
                name="assignment",
                description="Assignment UUID - filter submissions for a specific assignment",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="student_external_id",
                description="External student identifier - filter submissions for a specific student",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="status",
                description="Submission status - filter by status (draft/submitted/graded/reopened)",
                required=False,
                type=str,
                location=OpenApiParameter.QUERY,
            )
        ],
        tags=['Staff - Assignments']
    ),
    retrieve=extend_schema(
        summary="View any submission (staff)",
        description="Retrieve detailed information about any student submission.",
        tags=['Staff - Assignments']
    ),
)
class StaffAssignmentSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    """Staff ViewSet for assignment submissions"""
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]

    def get_queryset(self):
        """Staff can see all submissions with comprehensive filtering"""
        queryset = AssignmentSubmission.objects.all().select_related('assignment')
        
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

    @extend_schema(
        summary="Grade assignment submission",
        description="""
        Grade an assignment submission (instructors only).

        - Creates or updates a Grade record
        - Updates submission status to 'graded'
        - Sets graded_at timestamp
        - Automatically calculates percentage and letter grade
        """,
        request=GradeAssignmentSerializer,
        responses={
            200: GradeSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        tags=['Staff - Assignments']
    )
    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade an assignment submission"""
        submission = self.get_object()
        
        serializer = GradeAssignmentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        marks = serializer.validated_data['marks']
        
        try:
            grade = grade_assignment_submission(submission.id, marks)
            return Response(
                GradeSerializer(grade).data,
                status=status.HTTP_200_OK
            )
        except ValueError as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema_view(
    list=extend_schema(exclude=True),
    retrieve=extend_schema(exclude=True),
    create=extend_schema(exclude=True),
    update=extend_schema(exclude=True),
    partial_update=extend_schema(exclude=True),
    destroy=extend_schema(
        summary="Delete assignment content (staff)",
        description="Delete a content file from an assignment",
        tags=['Staff - Assignments']
    )
)
class StaffAssignmentContentViewSet(viewsets.ModelViewSet):
    """Staff ViewSet for managing assignment content files"""
    queryset = AssignmentContent.objects.all()
    serializer_class = AssignmentContentSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    @extend_schema(
        summary="Upload assignment content file",
        description="Upload instruction files, resources, or examples for an assignment",
        request=AssignmentContentUploadSerializer,
        responses={201: AssignmentContentSerializer},
        tags=['Staff - Assignments']
    )
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload(self, request):
        """Upload assignment content file"""
        serializer = AssignmentContentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            assignment = get_object_or_404(Assignment, id=serializer.validated_data['assignment'])
            
            content = upload_assignment_content(
                file_obj=serializer.validated_data['file'],
                assignment=assignment,
                content_type=serializer.validated_data['content_type'],
                user=request.user,
                title=serializer.validated_data['title'],
                description=serializer.validated_data.get('description', ''),
                is_published=serializer.validated_data.get('is_published', True)
            )
            
            return Response(
                AssignmentContentSerializer(content).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'status': 'error', 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ==========================================
# STUDENT - QUIZ APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List available quizzes (students)",
        description="Students can view published quizzes in their courses.",
        parameters=[
            OpenApiParameter(name='course', description='Filter by course ID', required=False, type=str)
        ],
        tags=['Student - Quizzes']
    ),
    retrieve=extend_schema(
        summary="View quiz details (students)",
        description="Get detailed information about a quiz.",
        tags=['Student - Quizzes']
    ),
)
class StudentQuizViewSet(viewsets.ReadOnlyModelViewSet):
    """Student read-only access to quizzes"""
    queryset = Quiz.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizDetailSerializer
        elif self.action == 'start':
            return StartQuizSerializer
        elif self.action == 'submit_response':
            return SubmitResponseSerializer
        return QuizSerializer
    
    def get_queryset(self):
        queryset = Quiz.objects.all()
        
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset.select_related('course').prefetch_related('quiz_questions__question')
    
    @extend_schema(
        summary="Start a quiz attempt",
        description="Start a new attempt for a quiz. Creates QuestionAttempts for all questions.",
        tags=['Student - Quizzes'],
        request=StartQuizSerializer,
        responses={201: QuizAttemptSerializer}
    )
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a new quiz attempt"""
        quiz = self.get_object()
        serializer = StartQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_external_id = request.user.username
        
        try:
            attempt = QuizService.start_attempt(quiz=quiz, user_external_id=user_external_id)
            response_serializer = QuizAttemptSerializer(attempt)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Submit a question response",
        description="Submit an answer for a single question in an active quiz attempt. Grading happens immediately.",
        tags=['Student - Quizzes'],
        request=SubmitResponseSerializer,
        responses={200: dict},
    )
    @action(detail=True, methods=['post'], url_path='attempts/(?P<attempt_id>[^/.]+)/submit')
    def submit_response(self, request, pk=None, attempt_id=None):
        """Submit a response for a question"""
        serializer = SubmitResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, quiz_id=pk)
            
            # Verify student owns this attempt
            if attempt.user_external_id != request.user.username:
                return Response(
                    {'error': 'You can only submit to your own quiz attempts'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Quiz attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
        question_id = serializer.validated_data['question_id']
        response_data = serializer.validated_data['response']
        
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
        
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
    
    @extend_schema(
        summary="Finish quiz attempt",
        description="Mark the quiz attempt as finished and calculate the final grade.",
        tags=['Student - Quizzes'],
        responses={200: QuizAttemptDetailSerializer}
    )
    @action(detail=True, methods=['post'], url_path='attempts/(?P<attempt_id>[^/.]+)/finish')
    def finish(self, request, pk=None, attempt_id=None):
        """Finish a quiz attempt"""
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, quiz_id=pk)
            
            # Verify student owns this attempt
            if attempt.user_external_id != request.user.username:
                return Response(
                    {'error': 'You can only finish your own quiz attempts'},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Quiz attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            QuizService.finish_attempt(attempt)
            serializer = QuizAttemptDetailSerializer(attempt)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Get quiz with questions",
        description="Retrieve quiz with all questions for taking. Answers are hidden.",
        tags=['Student - Quizzes'],
        responses={200: QuizWithQuestionsSerializer}
    )
    @action(detail=True, methods=['get'])
    def with_questions(self, request, pk=None):
        """Get quiz with questions for taking"""
        quiz = self.get_object()
        serializer = QuizWithQuestionsSerializer(quiz)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary="List my quiz attempts (students)",
        description="Students can view their own quiz attempts.",
        parameters=[
            OpenApiParameter(name='quiz', description='Filter by quiz ID', required=False, type=str),
            OpenApiParameter(name='state', description='Filter by state (in_progress, finished, abandoned)', required=False, type=str)
        ],
        tags=['Student - Quizzes']
    ),
    retrieve=extend_schema(
        summary="View my attempt details (students)",
        description="Retrieve detailed results for a specific quiz attempt.",
        tags=['Student - Quizzes']
    )
)
class StudentQuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """Student ViewSet for quiz attempts"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizAttemptDetailSerializer
        return QuizAttemptSerializer
    
    def get_queryset(self):
        """Students can only see their own attempts"""
        user_external_id = self.request.user.username
        queryset = QuizAttempt.objects.filter(user_external_id=user_external_id)
        
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state=state)
        
        return queryset.select_related('quiz').prefetch_related('question_attempts__question')
    
    @extend_schema(
        summary="Get my attempt summary",
        description="Get statistics and summary for my quiz attempt",
        tags=['Student - Quizzes'],
        responses={200: dict}
    )
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get attempt summary statistics"""
        attempt = self.get_object()
        summary = QuizService.get_attempt_summary(attempt)
        return Response(summary)


# ==========================================
# STAFF - QUIZ APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List all quizzes (staff)",
        description="Staff can view all quizzes including unpublished ones.",
        parameters=[
            OpenApiParameter(name='course', description='Filter by course ID', required=False, type=str)
        ],
        tags=['Staff - Quizzes']
    ),
    retrieve=extend_schema(
        summary="View quiz details (staff)",
        description="Get detailed information about any quiz.",
        tags=['Staff - Quizzes']
    ),
    create=extend_schema(
        summary="Create quiz (staff)",
        description="Create a new quiz.",
        tags=['Staff - Quizzes']
    ),
    update=extend_schema(
        summary="Update quiz (staff)",
        description="Update a quiz.",
        tags=['Staff - Quizzes']
    ),
    destroy=extend_schema(
        summary="Delete quiz (staff)",
        description="Delete a quiz.",
        tags=['Staff - Quizzes']
    )
)
class StaffQuizViewSet(viewsets.ModelViewSet):
    """Staff full CRUD access to quizzes"""
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = Quiz.objects.all()
        
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset.select_related('course').prefetch_related('quiz_questions__question')


@extend_schema_view(
    list=extend_schema(
        summary="List all quiz attempts (staff)",
        description="Staff can view all quiz attempts across all students.",
        parameters=[
            OpenApiParameter(name='quiz', description='Filter by quiz ID', required=False, type=str),
            OpenApiParameter(name='user_external_id', description='Filter by student', required=False, type=str),
            OpenApiParameter(name='state', description='Filter by state (in_progress, finished, abandoned)', required=False, type=str)
        ],
        tags=['Staff - Quizzes']
    ),
    retrieve=extend_schema(
        summary="View any attempt details (staff)",
        description="Retrieve detailed results for any quiz attempt.",
        tags=['Staff - Quizzes']
    )
)
class StaffQuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """Staff ViewSet for quiz attempts"""
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizAttemptDetailSerializer
        return QuizAttemptSerializer
    
    def get_queryset(self):
        """Staff can see all attempts"""
        queryset = QuizAttempt.objects.all()
        
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        user_external_id = self.request.query_params.get('user_external_id')
        if user_external_id:
            queryset = queryset.filter(user_external_id=user_external_id)
        
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state=state)
        
        return queryset.select_related('quiz').prefetch_related('question_attempts__question')
    
    @extend_schema(
        summary="Manually grade a question",
        description="Manually grade a question attempt (for essay questions or override)",
        tags=['Staff - Quizzes'],
        request=ManualGradeSerializer,
        responses={200: dict}
    )
    @action(detail=True, methods=['post'], url_path='questions/(?P<question_attempt_id>[^/.]+)/grade')
    def manual_grade(self, request, pk=None, question_attempt_id=None):
        """Manually grade a question attempt"""
        serializer = ManualGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            question_attempt = QuestionAttempt.objects.get(id=question_attempt_id, quiz_attempt_id=pk)
        except QuestionAttempt.DoesNotExist:
            return Response({'error': 'Question attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
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
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List question categories (staff)",
        description="Retrieve all question categories.",
        parameters=[
            OpenApiParameter(name='course', description='Filter by course ID', required=False, type=str)
        ],
        tags=['Staff - Question Bank']
    ),
    create=extend_schema(
        summary="Create question category (staff)",
        description="Create a new question category.",
        tags=['Staff - Question Bank']
    ),
    retrieve=extend_schema(
        summary="Get category details (staff)",
        description="Retrieve detailed information about a question category.",
        tags=['Staff - Question Bank']
    ),
    update=extend_schema(
        summary="Update category (staff)",
        description="Update a question category.",
        tags=['Staff - Question Bank']
    ),
    destroy=extend_schema(
        summary="Delete category (staff)",
        description="Delete a question category.",
        tags=['Staff - Question Bank']
    )
)
class StaffQuestionCategoryViewSet(viewsets.ModelViewSet):
    """Staff full CRUD access to question categories"""
    queryset = QuestionCategory.objects.all()
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = QuestionCategory.objects.all()
        
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset


@extend_schema_view(
    list=extend_schema(
        summary="List question type availability settings (staff)",
        description="View configurations for which question types are enabled for different educational levels.",
        parameters=[
            OpenApiParameter(name='level', description='Filter by educational level', required=False, type=str),
            OpenApiParameter(name='question_type', description='Filter by question type', required=False, type=str),
            OpenApiParameter(name='is_enabled', description='Filter by enabled status', required=False, type=bool)
        ],
        tags=['Staff - Question Bank']
    ),
    create=extend_schema(
        summary="Create question type availability setting (staff)",
        description="Configure which question types are available for a specific educational level.",
        tags=['Staff - Question Bank']
    ),
    retrieve=extend_schema(
        summary="Get question type availability setting (staff)",
        description="Retrieve a specific question type availability configuration.",
        tags=['Staff - Question Bank']
    ),
    update=extend_schema(
        summary="Update question type availability (staff)",
        description="Update question type availability settings.",
        tags=['Staff - Question Bank']
    ),
    destroy=extend_schema(
        summary="Delete question type availability setting (staff)",
        description="Delete a question type availability configuration.",
        tags=['Staff - Question Bank']
    )
)
class StaffQuestionTypeAvailabilityViewSet(viewsets.ModelViewSet):
    """Staff full CRUD access to question type availability settings"""
    queryset = QuestionTypeAvailability.objects.all()
    serializer_class = QuestionTypeAvailabilitySerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = QuestionTypeAvailability.objects.all()
        
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        
        question_type = self.request.query_params.get('question_type')
        if question_type:
            queryset = queryset.filter(question_type=question_type)
        
        is_enabled = self.request.query_params.get('is_enabled')
        if is_enabled is not None:
            queryset = queryset.filter(is_enabled=is_enabled.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """Automatically set created_by field"""
        serializer.save(created_by=self.request.user)
    
    @extend_schema(
        summary="Get available question types for a level",
        description="Get list of enabled question types for a specific educational level.",
        parameters=[
            OpenApiParameter(name='level', description='Educational level to check', required=True, type=str)
        ],
        responses={200: dict},
        tags=['Staff - Question Bank']
    )
    @action(detail=False, methods=['get'])
    def available_types(self, request):
        """Get available question types for a specific level"""
        level = request.query_params.get('level')
        if not level:
            return Response(
                {'error': 'level parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        available = QuestionTypeAvailability.get_available_question_types(level)
        return Response({
            'level': level,
            'available_question_types': available
        })
    
    @extend_schema(
        summary="Check if question type is allowed",
        description="Check if a specific question type is allowed for a given educational level.",
        parameters=[
            OpenApiParameter(name='level', description='Educational level', required=True, type=str),
            OpenApiParameter(name='question_type', description='Question type to check', required=True, type=str)
        ],
        responses={200: dict},
        tags=['Staff - Question Bank']
    )
    @action(detail=False, methods=['get'])
    def check_allowed(self, request):
        """Check if a question type is allowed for a level"""
        level = request.query_params.get('level')
        question_type = request.query_params.get('question_type')
        
        if not level or not question_type:
            return Response(
                {'error': 'Both level and question_type parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_allowed = QuestionTypeAvailability.is_question_type_allowed(level, question_type)
        return Response({
            'level': level,
            'question_type': question_type,
            'is_allowed': is_allowed
        })


@extend_schema_view(
    list=extend_schema(
        summary="List questions (staff)",
        description="Retrieve questions from the question bank.",
        parameters=[
            OpenApiParameter(name='category', description='Filter by category ID', required=False, type=str),
            OpenApiParameter(name='qtype', description='Filter by question type', required=False, type=str)
        ],
        tags=['Staff - Question Bank']
    ),
    create=extend_schema(
        summary="Create question (staff)",
        description="Create a new question with nested answers.",
        tags=['Staff - Question Bank']
    ),
    retrieve=extend_schema(
        summary="Get question details (staff)",
        description="Retrieve detailed information about a question.",
        tags=['Staff - Question Bank']
    ),
    update=extend_schema(
        summary="Update question (staff)",
        description="Update a question and its answers.",
        tags=['Staff - Question Bank']
    ),
    destroy=extend_schema(
        summary="Delete question (staff)",
        description="Delete a question.",
        tags=['Staff - Question Bank']
    )
)
class StaffQuestionViewSet(viewsets.ModelViewSet):
    """Staff full CRUD access to questions"""
    queryset = Question.objects.all()
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateUpdateSerializer
        return QuestionSerializer
    
    def get_queryset(self):
        queryset = Question.objects.all()
        
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        qtype = self.request.query_params.get('qtype')
        if qtype:
            queryset = queryset.filter(qtype=qtype)
        
        return queryset.select_related('category').prefetch_related('answers')


@extend_schema_view(
    list=extend_schema(
        summary="List quiz question slots (staff)",
        description="Retrieve all question slots (links between quizzes and questions).",
        parameters=[
            OpenApiParameter(name='quiz', description='Filter by quiz ID', required=False, type=str),
            OpenApiParameter(name='question', description='Filter by question ID', required=False, type=str)
        ],
        tags=['Staff - Quiz Questions']
    ),
    retrieve=extend_schema(
        summary="Get quiz question slot (staff)",
        description="Retrieve a specific quiz question slot.",
        tags=['Staff - Quiz Questions']
    ),
    create=extend_schema(
        summary="Add question to quiz (staff)",
        description="Create a link between a quiz and question with order and max_mark.",
        tags=['Staff - Quiz Questions']
    ),
    update=extend_schema(
        summary="Update quiz question slot (staff)",
        description="Update the order or max_mark of a question in a quiz.",
        tags=['Staff - Quiz Questions']
    ),
    destroy=extend_schema(
        summary="Remove question from quiz (staff)",
        description="Delete the link between a quiz and question.",
        tags=['Staff - Quiz Questions']
    )
)
class StaffQuizQuestionViewSet(viewsets.ModelViewSet):
    """Staff full CRUD access to quiz-question slots"""
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = QuizQuestion.objects.all()
        
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        question_id = self.request.query_params.get('question')
        if question_id:
            queryset = queryset.filter(question_id=question_id)
        
        return queryset.select_related('quiz', 'question')


# ==========================================
# BACKWARD COMPATIBILITY (DEPRECATED) - REMOVED
# All deprecated ViewSets have been removed.
# Use Student* or Staff* prefixed ViewSets instead.
# ==========================================

# REMOVED: AssignmentViewSet - Use StudentAssignmentViewSet or StaffAssignmentViewSet
# REMOVED: AssignmentSubmissionViewSet - Use StudentAssignmentSubmissionViewSet or StaffAssignmentSubmissionViewSet
# REMOVED: AssignmentContentViewSet - Use StaffAssignmentContentViewSet
# REMOVED: AssignmentSubmissionFileViewSet - Use StudentAssignmentSubmissionFileViewSet
# REMOVED: QuestionCategoryViewSet - Use StaffQuestionCategoryViewSet
# REMOVED: QuestionViewSet - Use StaffQuestionViewSet
# REMOVED: QuizQuestionViewSet - Use StaffQuizQuestionViewSet
# REMOVED: QuizViewSet - Use StudentQuizViewSet or StaffQuizViewSet
# REMOVED: QuizAttemptViewSet - Use StudentQuizAttemptViewSet or StaffQuizAttemptViewSet
