"""
API Views for the Assessment app - Moodle-style Quiz System

DRF ViewSets for assignments, question bank, quizzes, and attempts.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter, OpenApiExample

from .models import (
    Assignment, Submission,
    QuestionCategory, Question, Quiz, QuizQuestion, QuizAttempt, QuestionAttempt
)
from .serializers import (
    AssignmentSerializer, SubmissionSerializer,
    QuestionCategorySerializer, QuestionSerializer, QuestionPublicSerializer, QuestionCreateUpdateSerializer,
    QuizSerializer, QuizDetailSerializer, QuizWithQuestionsSerializer, QuizQuestionSlotSerializer,
    QuizAttemptSerializer, QuizAttemptDetailSerializer,
    StartQuizSerializer, SubmitResponseSerializer, ManualGradeSerializer
)
from .services import QuizService, QuestionService
from .permissions import IsInstructorOrReadOnly


@extend_schema_view(
    list=extend_schema(
        summary="List assignments",
        description="Retrieve a list of all assignments in classrooms",
        tags=['Assignments']
    ),
    create=extend_schema(
        summary="Create a new assignment",
        description="Create a new assignment for a classroom (instructors only)",
        tags=['Assignments']
    ),
    retrieve=extend_schema(
        summary="Get assignment details",
        description="Retrieve detailed information about a specific assignment",
        tags=['Assignments']
    ),
    update=extend_schema(
        summary="Update assignment",
        description="Update an assignment (instructors only)",
        tags=['Assignments']
    ),
    partial_update=extend_schema(
        summary="Partially update assignment",
        description="Update specific fields of an assignment",
        tags=['Assignments']
    ),
    destroy=extend_schema(
        summary="Delete assignment",
        description="Delete an assignment (instructors only)",
        tags=['Assignments']
    )
)
class AssignmentViewSet(viewsets.ModelViewSet):
    """API endpoints for Assignment management"""
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
    """API endpoints for Submission management"""
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


# ==========================================
# QUESTION BANK APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List question categories",
        description="Retrieve all question categories for a course",
        tags=['Question Bank'],
        parameters=[
            OpenApiParameter(name='course', description='Filter by course ID', required=False, type=str)
        ]
    ),
    create=extend_schema(
        summary="Create question category",
        description="Create a new question category (instructors only)",
        tags=['Question Bank']
    ),
    retrieve=extend_schema(
        summary="Get category details",
        description="Retrieve detailed information about a question category",
        tags=['Question Bank']
    ),
    update=extend_schema(
        summary="Update category",
        description="Update a question category (instructors only)",
        tags=['Question Bank']
    ),
    destroy=extend_schema(
        summary="Delete category",
        description="Delete a question category (instructors only)",
        tags=['Question Bank']
    )
)
class QuestionCategoryViewSet(viewsets.ModelViewSet):
    """API endpoints for question category management"""
    queryset = QuestionCategory.objects.all()
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = QuestionCategory.objects.all()
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset


@extend_schema_view(
    list=extend_schema(
        summary="List questions",
        description="Retrieve questions from the question bank",
        tags=['Question Bank'],
        parameters=[
            OpenApiParameter(name='category', description='Filter by category ID', required=False, type=str),
            OpenApiParameter(name='qtype', description='Filter by question type', required=False, type=str)
        ]
    ),
    create=extend_schema(
        summary="Create question",
        description="""Create a new question with nested answers (instructors only).
        
        **Required fields:**
        - `category`: UUID of the question category
        - `qtype`: Question type (multichoice, truefalse, shortanswer, essay)
        - `name`: Short name for the question
        - `question_text`: The actual question text
        - `default_mark`: Default marks for this question (e.g., 1.0)
        - `answers`: Array of answer objects
        
        **Answer object structure:**
        - `answer_text`: The answer text
        - `fraction`: Correctness (1.0 = correct, 0.0 = incorrect, 0.5 = partially correct)
        - `feedback`: Feedback for this answer (optional)
        - `order`: Display order (optional)
        
        **Example:**
        ```json
        {
          "category": "uuid-here",
          "qtype": "multichoice",
          "name": "Python Basics",
          "question_text": "What is 2 + 2?",
          "general_feedback": "Basic arithmetic",
          "default_mark": 1.0,
          "penalty": 0.1,
          "answers": [
            {"answer_text": "3", "fraction": 0.0, "feedback": "Incorrect", "order": 1},
            {"answer_text": "4", "fraction": 1.0, "feedback": "Correct!", "order": 2}
          ]
        }
        ```
        """,
        tags=['Question Bank']
    ),
    retrieve=extend_schema(
        summary="Get question details",
        description="Retrieve detailed information about a question",
        tags=['Question Bank']
    ),
    update=extend_schema(
        summary="Update question",
        description="Update a question and its answers (instructors only)",
        tags=['Question Bank']
    ),
    destroy=extend_schema(
        summary="Delete question",
        description="Delete a question (instructors only)",
        tags=['Question Bank']
    )
)
class QuestionViewSet(viewsets.ModelViewSet):
    """API endpoints for question management"""
    queryset = Question.objects.all()
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateUpdateSerializer
        elif self.request.user.is_staff:
            return QuestionSerializer  # Full details for instructors
        else:
            return QuestionPublicSerializer  # Hide correct answers for students
    
    def get_queryset(self):
        queryset = Question.objects.all()
        
        # Filter by category if provided
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by question type if provided
        qtype = self.request.query_params.get('qtype')
        if qtype:
            queryset = queryset.filter(qtype=qtype)
        
        return queryset.select_related('category').prefetch_related('answers')


# ==========================================
# QUIZ QUESTION SLOT APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List quiz question slots",
        description="Retrieve all question slots (links between quizzes and questions)",
        tags=['Quiz Questions'],
        parameters=[
            OpenApiParameter(name='quiz', description='Filter by quiz ID', required=False, type=str),
            OpenApiParameter(name='question', description='Filter by question ID', required=False, type=str)
        ]
    ),
    retrieve=extend_schema(
        summary="Get quiz question slot details",
        description="Retrieve a specific quiz question slot",
        tags=['Quiz Questions']
    ),
    create=extend_schema(
        summary="Add question to quiz",
        description="Create a link between a quiz and question with order and max_mark (instructors only)",
        tags=['Quiz Questions']
    ),
    update=extend_schema(
        summary="Update quiz question slot",
        description="Update the order or max_mark of a question in a quiz (instructors only)",
        tags=['Quiz Questions']
    ),
    destroy=extend_schema(
        summary="Remove question from quiz",
        description="Delete the link between a quiz and question (instructors only)",
        tags=['Quiz Questions']
    )
)
class QuizQuestionViewSet(viewsets.ModelViewSet):
    """API endpoints for managing quiz-question slots (adding/removing questions from quizzes)"""
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSlotSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
    def get_queryset(self):
        queryset = QuizQuestion.objects.all()
        
        # Filter by quiz if provided
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        # Filter by question if provided
        question_id = self.request.query_params.get('question')
        if question_id:
            queryset = queryset.filter(question_id=question_id)
        
        return queryset.select_related('quiz', 'question')


# ==========================================
# QUIZ APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List quizzes",
        description="Retrieve a list of all quizzes",
        tags=['Quizzes'],
        parameters=[
            OpenApiParameter(name='course', description='Filter by course ID', required=False, type=str)
        ]
    ),
    retrieve=extend_schema(
        summary="Get quiz details",
        description="Retrieve detailed information about a specific quiz",
        tags=['Quizzes']
    ),
    create=extend_schema(
        summary="Create a new quiz",
        description="Create a new quiz (instructors only)",
        tags=['Quizzes']
    ),
    update=extend_schema(
        summary="Update quiz",
        description="Update a quiz (instructors only)",
        tags=['Quizzes']
    ),
    destroy=extend_schema(
        summary="Delete quiz",
        description="Delete a quiz (instructors only)",
        tags=['Quizzes']
    )
)
class QuizViewSet(viewsets.ModelViewSet):
    """API endpoints for Quiz management"""
    queryset = Quiz.objects.all()
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    
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
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        
        return queryset.select_related('course').prefetch_related('quiz_questions__question')
    
    @extend_schema(
        summary="Start a quiz attempt",
        description="Start a new attempt for a quiz. Creates QuestionAttempts for all questions.",
        tags=['Quizzes'],
        request=StartQuizSerializer,
        responses={201: QuizAttemptSerializer}
    )
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a new quiz attempt using QuizService"""
        quiz = self.get_object()
        serializer = StartQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_external_id = serializer.validated_data['user_external_id']
        
        try:
            attempt = QuizService.start_attempt(
                quiz=quiz,
                user_external_id=user_external_id
            )
            response_serializer = QuizAttemptSerializer(attempt)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Submit a question response",
        description="""Submit an answer for a single question in an active quiz attempt. Grading happens immediately.

**Response format depends on question type:**

**Multiple Choice / True-False:**
```json
{
  "question_id": "uuid-of-question",
  "response": {
    "selected": ["uuid-of-selected-answer"]
  }
}
```

**Short Answer / Essay:**
```json
{
  "question_id": "uuid-of-question",
  "response": {
    "answer_text": "Your text answer here"
  }
}
```

The endpoint returns immediate grading results with score and feedback.""",
        tags=['Quizzes'],
        request=SubmitResponseSerializer,
        responses={200: dict},
        examples=[
            OpenApiExample(
                'Multiple Choice Response',
                value={
                    "question_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    "response": {
                        "selected": ["7ea85f64-5717-4562-b3fc-2c963f66afa7"]
                    }
                },
                request_only=True
            ),
            OpenApiExample(
                'Short Answer Response',
                value={
                    "question_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    "response": {
                        "answer_text": "Python"
                    }
                },
                request_only=True
            )
        ]
    )
    @action(detail=True, methods=['post'], url_path='attempts/(?P<attempt_id>[^/.]+)/submit')
    def submit_response(self, request, pk=None, attempt_id=None):
        """Submit a response for a question using QuizService"""
        serializer = SubmitResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, quiz_id=pk)
        except QuizAttempt.DoesNotExist:
            return Response({'error': 'Quiz attempt not found'}, status=status.HTTP_404_NOT_FOUND)
        
        question_id = serializer.validated_data['question_id']
        response_data = serializer.validated_data['response']
        
        # Get the question object
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
        tags=['Quizzes'],
        responses={200: QuizAttemptDetailSerializer}
    )
    @action(detail=True, methods=['post'], url_path='attempts/(?P<attempt_id>[^/.]+)/finish')
    def finish(self, request, pk=None, attempt_id=None):
        """Finish a quiz attempt using QuizService"""
        try:
            attempt = QuizAttempt.objects.get(id=attempt_id, quiz_id=pk)
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
        description="Retrieve quiz with all questions (for taking the quiz). Answers are hidden.",
        tags=['Quizzes'],
        responses={200: QuizWithQuestionsSerializer}
    )
    @action(detail=True, methods=['get'])
    def with_questions(self, request, pk=None):
        """Get quiz with questions for taking"""
        quiz = self.get_object()
        serializer = QuizWithQuestionsSerializer(quiz)
        return Response(serializer.data)


# ==========================================
# QUIZ ATTEMPT APIs
# ==========================================

@extend_schema_view(
    list=extend_schema(
        summary="List quiz attempts",
        description="Retrieve quiz attempts for the current user (students) or all attempts (instructors)",
        tags=['Quiz Attempts'],
        parameters=[
            OpenApiParameter(name='quiz', description='Filter by quiz ID', required=False, type=str),
            OpenApiParameter(name='state', description='Filter by state (in_progress, finished, abandoned)', required=False, type=str)
        ]
    ),
    retrieve=extend_schema(
        summary="Get quiz attempt details",
        description="Retrieve detailed results for a specific quiz attempt with all question attempts",
        tags=['Quiz Attempts']
    )
)
class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoints for viewing quiz attempts and results"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuizAttemptDetailSerializer
        return QuizAttemptSerializer
    
    def get_queryset(self):
        queryset = QuizAttempt.objects.all()
        
        # Students can only see their own attempts
        if not self.request.user.is_staff:
            user_external_id = getattr(self.request.user, 'username', None) or self.request.META.get('HTTP_X_USER_EXTERNAL_ID')
            if user_external_id:
                queryset = queryset.filter(user_external_id=user_external_id)
            else:
                return QuizAttempt.objects.none()
        
        # Filter by quiz if provided
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        # Filter by state if provided
        state = self.request.query_params.get('state')
        if state:
            queryset = queryset.filter(state=state)
        
        return queryset.select_related('quiz').prefetch_related('question_attempts__question')
    
    @extend_schema(
        summary="Get attempt summary",
        description="Get statistics and summary for a quiz attempt",
        tags=['Quiz Attempts'],
        responses={200: dict}
    )
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get attempt summary statistics"""
        attempt = self.get_object()
        
        # Check permissions
        if not request.user.is_staff:
            user_external_id = getattr(request.user, 'username', None) or request.META.get('HTTP_X_USER_EXTERNAL_ID')
            if attempt.user_external_id != user_external_id:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        summary = QuizService.get_attempt_summary(attempt)
        return Response(summary)
    
    @extend_schema(
        summary="Manually grade a question",
        description="Manually grade a question attempt (for essay questions or override)",
        tags=['Quiz Attempts'],
        request=ManualGradeSerializer,
        responses={200: dict}
    )
    @action(detail=True, methods=['post'], url_path='questions/(?P<question_attempt_id>[^/.]+)/grade')
    def manual_grade(self, request, pk=None, question_attempt_id=None):
        """Manually grade a question attempt"""
        # Only instructors can manually grade
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
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
