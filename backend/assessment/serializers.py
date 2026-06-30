"""
Assessment Serializers - Moodle-style Quiz System

DRF serializers for the quiz and question bank system.
"""
import uuid
from decimal import Decimal
from django.db.models import Sum
from rest_framework import serializers

from courses.models import CourseCache, StaffAssignedCourse
from courses.serializers import CourseCacheSerializer
from .models import (
    Assignment, AssignmentContent, AssignmentSubmission, AssignmentSubmissionFile,
    QuestionCategory, QuestionTypeAvailability, Question, QuestionAnswer,
    Quiz, QuizQuestion, QuizAttempt, QuestionAttempt,
    Grade
)


# ==========================================
# MIXINS
# ==========================================

class CourseSlugValidationMixin:
    """Mixin to handle course_id (external_id or UUID) validation and conversion."""
    
    def validate_course_id(self, value):
        if not value:
            raise serializers.ValidationError("This field is required")
        
        if isinstance(value, CourseCache):
            return value
            
        course = None
        # Try course_external_id first (preferred field name)
        try:
            course = CourseCache.objects.filter(course_external_id=value).first()
        except (TypeError, ValueError):
            pass
            
        if not course:
            # Try legacy external_id field if the above fails
            try:
                course = CourseCache.objects.filter(external_id=value).first()
            except (TypeError, ValueError):
                pass
            
        if not course:
            # Try UUID
            try:
                uuid_value = uuid.UUID(str(value))
                course = CourseCache.objects.filter(id=uuid_value).first()
            except (ValueError, AttributeError, TypeError):
                pass
        
        if not course:
            raise serializers.ValidationError("Course not found")
            
        return course

    def validate_staff_assignment(self, course):
        """Validate that the requesting staff is assigned to the course."""
        request = self.context.get("request")
        if not request or not hasattr(request.user, "external_id"):
            # If no request or user, skip staff assignment validation (e.g., for internal use)
            return course

        staff_external_id = request.user.external_id
        if not StaffAssignedCourse.objects.filter(
            staff_external_id=staff_external_id,
            course=course
        ).exists():
            raise serializers.ValidationError("You are not assigned to this course.")
        return course


class QuizMetricsMixin:
    """Mixin providing common metrics for Quizzes and Categories."""
    
    def get_questions_count(self, obj):
        if hasattr(obj, 'quiz_questions'):
             return obj.quiz_questions.count()
        if hasattr(obj, 'questions'): # For QuestionCategory
            return obj.questions.count()
        return 0
    
    def get_total_marks(self, obj):
        if not hasattr(obj, 'quiz_questions'):
            return 0.0
        total = obj.quiz_questions.aggregate(total=Sum('max_mark'))['total']
        return float(total) if total else 0.0


# ==========================================
# ASSIGNMENT SERIALIZERS 
# ==========================================

class StartAssignmentSubmissionSerializer(serializers.Serializer):
    assignment_id = serializers.UUIDField()
    student_external_id = serializers.CharField(max_length=255)


class SubmitAssignmentSerializer(serializers.Serializer):
    confirm = serializers.BooleanField(
        default=True,
        help_text="Confirm submission"
    )


class AssignmentWriteSerializer(serializers.ModelSerializer, CourseSlugValidationMixin):
    course = serializers.SlugRelatedField(
        queryset=CourseCache.objects.all(),
        slug_field="course_external_id"
    )

    class Meta:
        model = Assignment
        fields = [
            "title", "description", "open_at", "due_at", "close_at",
            "max_attempts", "allow_late_submission", "is_published",
            "max_marks", "course",
        ]

    def validate_course(self, value):
        return self.validate_staff_assignment(value)
    

class AssignmentContentSerializer(serializers.ModelSerializer):
    url = serializers.ReadOnlyField()

    class Meta:
        model = AssignmentContent
        fields = ["id", "title", "content_type", "url", "created_at"]
        read_only_fields = fields


class AssignmentReadSerializer(serializers.ModelSerializer):
    course = CourseCacheSerializer(read_only=True)
    content_files = AssignmentContentSerializer(
        many=True,
        read_only=True,
        source="contents"
    )

    class Meta:
        model = Assignment
        fields = "__all__"


class AssignmentSubmissionFileSerializer(serializers.ModelSerializer):
    url = serializers.ReadOnlyField()

    class Meta:
        model = AssignmentSubmissionFile
        fields = '__all__'
        read_only_fields = ('created_at',)


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    files = AssignmentSubmissionFileSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = (
            'attempt_number', 'status', 'submitted_at', 
            'graded_at', 'created_at',
        )


class AssignmentContentUploadSerializer(serializers.Serializer):
    assignment = serializers.UUIDField(help_text="Assignment ID")
    content_type = serializers.ChoiceField(
        choices=[('instruction', 'Instruction'), ('resource', 'Resource'), ('example', 'Example')],
        help_text="Type of content"
    )
    title = serializers.CharField(max_length=512, help_text="Content title")
    description = serializers.CharField(required=False, allow_blank=True, help_text="Content description")
    file = serializers.FileField(help_text="File to upload")
    is_published = serializers.BooleanField(default=True, help_text="Publish immediately")


class AssignmentSubmissionFileUploadSerializer(serializers.Serializer):
    submission = serializers.UUIDField(help_text="Submission ID")
    file = serializers.FileField(help_text="File to upload")


# ==========================================
# QUESTION BANK SERIALIZERS
# ==========================================

class QuestionTypeAvailabilitySerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)
    
    class Meta:
        model = QuestionTypeAvailability
        fields = [
            'id', 'level', 'level_display', 'question_type', 'question_type_display',
            'is_enabled', 'description', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class QuestionCategorySerializer(serializers.ModelSerializer, CourseSlugValidationMixin, QuizMetricsMixin):
    """Serializer for question categories"""
    questions_count = serializers.SerializerMethodField()
    course_id = serializers.CharField(write_only=True, help_text="Course external_id or UUID")
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    available_question_types = serializers.SerializerMethodField(
        help_text="List of question types available for this category's level"
    )
    
    class Meta:
        model = QuestionCategory
        fields = [
            'id', 'course', 'course_id', 'name', 'description', 'level', 'level_display',
            'questions_count', 'available_question_types', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'course']
    
    def get_available_question_types(self, obj):
        return QuestionTypeAvailability.get_available_question_types(obj.level)
    
    def validate(self, attrs):
        course_id = attrs.pop('course_id', None)
        attrs['course'] = self.validate_course_id(course_id)
        return attrs


class QuestionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'question', 'answer_text', 'fraction', 'feedback', 'order']


class QuestionAnswerPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'answer_text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    answers = QuestionAnswerSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    qtype_display = serializers.CharField(source='get_qtype_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'category', 'category_name', 'qtype', 'qtype_display',
            'name', 'question_text', 'general_feedback', 'default_mark',
            'penalty', 'version', 'answers', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class QuestionPublicSerializer(serializers.ModelSerializer):
    answers = QuestionAnswerPublicSerializer(many=True, read_only=True)
    qtype_display = serializers.CharField(source='get_qtype_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'qtype', 'qtype_display', 'name', 'question_text',
            'default_mark', 'answers'
        ]


class QuestionAnswerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionAnswer
        fields = ['answer_text', 'fraction', 'feedback', 'order']


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    answers = QuestionAnswerCreateSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = [
            'id', 'category', 'qtype', 'name', 'question_text',
            'general_feedback', 'default_mark', 'penalty', 'answers'
        ]
    
    def validate(self, attrs):
        category = attrs.get('category') or (self.instance.category if self.instance else None)
        qtype = attrs.get('qtype') or (self.instance.qtype if self.instance else None)
        
        if category and qtype:
            if not QuestionTypeAvailability.is_question_type_allowed(level=category.level, question_type=qtype):
                available_types = QuestionTypeAvailability.get_available_question_types(category.level)
                level_display = dict(category.LEVEL_CHOICES).get(category.level, category.level)
                qtype_display = dict(Question.QUESTION_TYPES).get(qtype, qtype)
                
                error_msg = (
                    f"Question type '{qtype_display}' is not allowed for {level_display} level. "
                    f"Available types: {', '.join([dict(Question.QUESTION_TYPES).get(t, t) for t in available_types]) if available_types else 'None'}."
                )
                raise serializers.ValidationError({'qtype': error_msg})
        
        return super().validate(attrs)
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers', [])
        question = Question.objects.create(**validated_data)
        for answer_data in answers_data:
            QuestionAnswer.objects.create(question=question, **answer_data)
        return question
    
    def update(self, instance, validated_data):
        answers_data = validated_data.pop('answers', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.version += 1
        instance.save()
        
        if answers_data is not None:
            instance.answers.all().delete()
            for answer_data in answers_data:
                QuestionAnswer.objects.create(question=instance, **answer_data)
        return instance


# ==========================================
# QUIZ SERIALIZERS
# ==========================================

class QuizQuestionSlotSerializer(serializers.ModelSerializer):
    question_name = serializers.CharField(source='question.name', read_only=True)
    question_type = serializers.CharField(source='question.qtype', read_only=True)
    
    class Meta:
        model = QuizQuestion
        fields = ['id', 'quiz', 'question', 'question_name', 'question_type', 'order', 'max_mark']


class BaseQuizSerializer(serializers.ModelSerializer, QuizMetricsMixin):
    """Base quiz serializer common to list and detail views."""
    questions_count = serializers.SerializerMethodField()
    total_marks = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'name', 'description', 'time_open', 'time_close',
            'time_limit', 'max_grade', 'shuffle_questions', 'max_attempts',
            'show_feedback', 'questions_count', 'total_marks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'course']


class QuizSerializer(BaseQuizSerializer, CourseSlugValidationMixin):
    """Basic quiz serializer for creation/listing."""
    course_id = serializers.CharField(write_only=True, help_text="Course external_id or UUID")
    
    class Meta(BaseQuizSerializer.Meta):
        fields = BaseQuizSerializer.Meta.fields + ['course_id']
    
    def validate(self, attrs):
        course_id = attrs.pop('course_id', None)
        attrs['course'] = self.validate_course_id(course_id)
        return attrs


class QuizDetailSerializer(BaseQuizSerializer):
    """Detailed quiz serializer with question slots and full public question content"""
    quiz_questions = QuizQuestionSlotSerializer(many=True, read_only=True)
    questions = serializers.SerializerMethodField()
    time_limit_minutes = serializers.SerializerMethodField()
    
    class Meta(BaseQuizSerializer.Meta):
        fields = BaseQuizSerializer.Meta.fields + ['quiz_questions', 'questions', 'time_limit_minutes']
    
    def get_time_limit_minutes(self, obj):
        return obj.time_limit // 60 if obj.time_limit else None
    
    def get_questions(self, obj):
        quiz_questions = obj.quiz_questions.select_related('question').prefetch_related('question__answers').all()
        questions_data = []
        for qq in quiz_questions:
            question_data = QuestionPublicSerializer(qq.question).data
            question_data['max_mark'] = float(qq.max_mark)
            question_data['order'] = qq.order
            questions_data.append(question_data)
        return questions_data


# ==========================================
# ATTEMPT SERIALIZERS
# ==========================================

class QuestionAttemptSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.qtype', read_only=True)
    max_mark = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionAttempt
        fields = [
            'id', 'question', 'question_text', 'question_type',
            'response', 'fraction', 'score', 'max_mark',
            'graded_at', 'manually_graded', 'feedback'
        ]
        read_only_fields = ['fraction', 'score', 'graded_at', 'manually_graded']
    
    def get_max_mark(self, obj):
        quiz_question = QuizQuestion.objects.filter(
            quiz=obj.quiz_attempt.quiz,
            question=obj.question
        ).first()
        return float(quiz_question.max_mark) if quiz_question else 0.0


class QuestionAttemptDetailSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)
    max_mark = serializers.SerializerMethodField()
    correct_answer = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionAttempt
        fields = [
            'id', 'question', 'response', 'fraction', 'score', 'max_mark',
            'correct_answer', 'graded_at', 'manually_graded', 'feedback'
        ]
    
    def get_max_mark(self, obj):
        quiz_question = QuizQuestion.objects.filter(
            quiz=obj.quiz_attempt.quiz,
            question=obj.question
        ).first()
        return float(quiz_question.max_mark) if quiz_question else 0.0
    
    def get_correct_answer(self, obj):
        from .services import QuestionService
        return QuestionService.get_correct_answer(obj.question)


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_name = serializers.CharField(source='quiz.name', read_only=True)
    time_taken_seconds = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_name', 'user_external_id',
            'attempt_number', 'state', 'started_at', 'finished_at',
            'total_score', 'time_taken_seconds'
        ]
        read_only_fields = ['started_at', 'finished_at', 'total_score', 'state']
    
    def get_time_taken_seconds(self, obj):
        if obj.finished_at:
            return int((obj.finished_at - obj.started_at).total_seconds())
        return None


class QuizAttemptDetailSerializer(serializers.ModelSerializer):
    """Detailed quiz attempt with all question attempts"""
    quiz = QuizSerializer(read_only=True)
    question_attempts = QuestionAttemptDetailSerializer(many=True, read_only=True)
    time_taken_seconds = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'user_external_id', 'attempt_number',
            'state', 'started_at', 'finished_at', 'total_score',
            'time_taken_seconds', 'question_attempts', 'summary'
        ]
    
    def get_time_taken_seconds(self, obj):
        if obj.finished_at:
            return int((obj.finished_at - obj.started_at).total_seconds())
        return None
    
    def get_summary(self, obj):
        from .services import QuizService
        return QuizService.get_attempt_summary(obj)


# ==========================================
# REQUEST/RESPONSE SERIALIZERS
# ==========================================

class StartQuizSerializer(serializers.Serializer):
    """Request serializer for starting a quiz"""
    user_external_id = serializers.CharField(max_length=255)


class SubmitResponseSerializer(serializers.Serializer):
    """Request serializer for submitting a question response"""
    question_id = serializers.UUIDField()
    response = serializers.JSONField()


class ManualGradeSerializer(serializers.Serializer):
    """Request serializer for manually grading a question"""
    fraction = serializers.DecimalField(max_digits=3, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('1'))
    feedback = serializers.CharField(required=False, allow_blank=True)


# ==========================================
# GRADEBOOK SERIALIZERS
# ==========================================

class GradeSerializer(serializers.ModelSerializer):
    """Serializer for Grade model"""
    item_name = serializers.ReadOnlyField()
    course_name = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = Grade
        fields = '__all__'
        read_only_fields = (
            'id', 'percentage', 'created_at', 'updated_at', 
            'item_name', 'course_name'
        )


class GradeAssignmentSerializer(serializers.Serializer):
    """Serializer for grading an assignment submission"""
    marks = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0,
        help_text="Score to assign"
    )


class GradeQuizSerializer(serializers.Serializer):
    """Serializer for grading a quiz attempt"""
    total_score = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=0,
        help_text="Total score for the quiz"
    )


class StudentGradeSummarySerializer(serializers.Serializer):
    """Serializer for student grade summary"""
    student_external_id = serializers.CharField()
    total_marks = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_possible = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    assignment_marks = serializers.DecimalField(max_digits=10, decimal_places=2)
    assignment_possible = serializers.DecimalField(max_digits=10, decimal_places=2)
    quiz_marks = serializers.DecimalField(max_digits=10, decimal_places=2)
    quiz_possible = serializers.DecimalField(max_digits=10, decimal_places=2)
    grade_count = serializers.IntegerField()


class GradebookSummarySerializer(serializers.Serializer) :
    """Serializer for gradebook summary"""
    student_external_id = serializers.CharField()
    total_marks = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_possible = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    assignment_count = serializers.IntegerField()
    quiz_count = serializers.IntegerField()
