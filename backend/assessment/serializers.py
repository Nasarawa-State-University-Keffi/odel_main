"""
Assessment Serializers - Moodle-style Quiz System

DRF serializers for the quiz and question bank system.
"""
import uuid
from decimal import Decimal
from django.db.models import Sum
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field

from courses.models import CourseCache, StaffAssignedCourse
from courses.serializers import CourseCacheSerializer
from .models import (
    Assignment, AssignmentContent, AssignmentSubmission, AssignmentSubmissionFile,
    QuestionCategory, QuestionTypeAvailability, Question, QuestionAnswer,
    Quiz, QuizQuestion, QuizAttempt, QuestionAttempt,
    Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentQuestionAttempt,
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
    
    def get_questions_count(self, obj) -> int:
        if hasattr(obj, 'quiz_questions'):
             return obj.quiz_questions.count()
        if hasattr(obj, 'questions'): # For QuestionCategory
            return obj.questions.count()
        return 0
    
    def get_total_marks(self, obj) -> float:
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
        required=True,
        help_text="Confirm submission"
    )
    session = serializers.CharField(max_length=50)
    semester = serializers.CharField(max_length=100)

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError("Submission must be confirmed")
        return value


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
    url = serializers.URLField(read_only=True)

    class Meta:
        model = AssignmentContent
        fields = ["id", "title", "content_type", "url", "created_at"]
        read_only_fields = fields


class AssignmentReadSerializer(serializers.ModelSerializer):
    course = CourseCacheSerializer(read_only=True)
    content_files = serializers.SerializerMethodField()

    @extend_schema_field(AssignmentContentSerializer(many=True))
    def get_content_files(self, obj):
        request = self.context.get('request')
        if request and getattr(request.user, 'is_staff', False):
            contents = obj.contents.all()
        elif hasattr(obj, 'student_visible_contents'):
            contents = obj.student_visible_contents
        else:
            contents = obj.contents.filter(is_published=True)
        return AssignmentContentSerializer(contents, many=True).data

    class Meta:
        model = Assignment
        fields = "__all__"


class AssignmentSubmissionFileSerializer(serializers.ModelSerializer):
    url = serializers.URLField(read_only=True)

    class Meta:
        model = AssignmentSubmissionFile
        fields = '__all__'
        read_only_fields = ('created_at',)


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_external_id = serializers.CharField(
        source='student_external.external_id',
        read_only=True,
    )
    files = AssignmentSubmissionFileSerializer(many=True, read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = (
            'id', 'assignment', 'student_external_id', 'attempt_number',
            'status', 'submitted_at', 'graded_at', 'marks', 'created_at',
            'files',
        )
        read_only_fields = fields


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
    course_external_id = serializers.IntegerField(source='course.course_external_id', read_only=True)
    bank_display = serializers.CharField(source='get_bank_display', read_only=True)
    
    class Meta:
        model = QuestionCategory
        fields = [
            'id', 'course_external_id', 'course_id', 'bank', 'bank_display', 'name', 'description', 'level', 'level_display',
            'questions_count', 'available_question_types', 'created_at', 'updated_at'
        ]
        read_only_fields = ['bank', 'created_at', 'updated_at']
    
    def get_available_question_types(self, obj) -> list:
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
    bank = serializers.CharField(source='category.bank', read_only=True)
    qtype_display = serializers.CharField(source='get_qtype_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'category', 'category_name', 'bank', 'qtype', 'qtype_display',
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
        expected_bank = self.context.get('question_bank')
        if expected_bank and category and category.bank != expected_bank:
            raise serializers.ValidationError({
                'category': f'This question belongs in the {expected_bank} question bank.',
            })
        
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

    def validate(self, attrs):
        quiz = attrs.get('quiz') or getattr(self.instance, 'quiz', None)
        question = attrs.get('question') or getattr(self.instance, 'question', None)
        if quiz and question and question.category.course_id != quiz.course_id:
            raise serializers.ValidationError({
                'question': 'Questions can only be added to quizzes in the same course.'
            })
        if question and question.category.bank != 'quiz':
            raise serializers.ValidationError({
                'question': 'Quizzes can only use questions from the quiz question bank.'
            })
        return attrs


class BaseQuizSerializer(serializers.ModelSerializer, QuizMetricsMixin):
    """Base quiz serializer common to list and detail views."""
    questions_count = serializers.SerializerMethodField()
    total_marks = serializers.SerializerMethodField()
    course_external_id = serializers.IntegerField(source='course.course_external_id', read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'course_external_id', 'name', 'description', 'time_open', 'time_close',
            'time_limit', 'max_grade', 'shuffle_questions', 'max_attempts', 'is_published',
            'show_feedback', 'questions_count', 'total_marks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


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
    
    def get_time_limit_minutes(self, obj) -> int:
        return obj.time_limit // 60 if obj.time_limit else None
    
    def get_questions(self, obj) -> list:
        quiz_questions = obj.quiz_questions.select_related('question').prefetch_related('question__answers').all()
        questions_data = []
        for qq in quiz_questions:
            question_data = QuestionPublicSerializer(qq.question).data
            question_data['max_mark'] = float(qq.max_mark)
            question_data['order'] = qq.order
            questions_data.append(question_data)
        return questions_data


# ==========================================
# ASSESSMENT SERIALIZERS
# ==========================================

class AssessmentQuestionSlotSerializer(serializers.ModelSerializer):
    question_name = serializers.CharField(source='question.name', read_only=True)
    question_type = serializers.CharField(source='question.qtype', read_only=True)

    class Meta:
        model = AssessmentQuestion
        fields = ['id', 'assessment', 'question', 'question_name', 'question_type', 'order', 'max_mark']

    def validate(self, attrs):
        assessment = attrs.get('assessment') or getattr(self.instance, 'assessment', None)
        question = attrs.get('question') or getattr(self.instance, 'question', None)
        if assessment and question and question.category.course_id != assessment.course_id:
            raise serializers.ValidationError({'question': 'Questions must belong to the assessment course.'})
        if question and question.category.bank != 'assessment':
            raise serializers.ValidationError({'question': 'Use a question from the assessment question bank.'})
        if question and question.qtype == 'essay':
            raise serializers.ValidationError({'question': 'Essay questions are not supported in auto-graded assessments.'})
        max_mark = attrs.get('max_mark', getattr(self.instance, 'max_mark', None))
        if max_mark is None or max_mark <= 0:
            raise serializers.ValidationError({'max_mark': 'Maximum marks must be greater than zero.'})
        return attrs


class BaseAssessmentSerializer(serializers.ModelSerializer, QuizMetricsMixin):
    questions_count = serializers.SerializerMethodField()
    total_marks = serializers.SerializerMethodField()
    course_external_id = serializers.IntegerField(source='course.course_external_id', read_only=True)

    class Meta:
        model = Assessment
        fields = [
            'id', 'course_external_id', 'name', 'description', 'time_open', 'time_close',
            'time_limit', 'max_grade', 'shuffle_questions', 'max_attempts', 'is_published',
            'show_feedback', 'questions_count', 'total_marks', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_questions_count(self, obj):
        return obj.assessment_questions.count()

    def get_total_marks(self, obj):
        total = obj.assessment_questions.aggregate(total=Sum('max_mark'))['total']
        return float(total) if total else 0.0


class AssessmentSerializer(BaseAssessmentSerializer, CourseSlugValidationMixin):
    course_id = serializers.CharField(write_only=True, help_text='Course external ID or UUID')

    class Meta(BaseAssessmentSerializer.Meta):
        fields = BaseAssessmentSerializer.Meta.fields + ['course_id']

    def validate(self, attrs):
        course_id = attrs.pop('course_id', None)
        if course_id is not None:
            attrs['course'] = self.validate_course_id(course_id)
        elif not self.instance:
            raise serializers.ValidationError({'course_id': 'This field is required.'})
        time_open = attrs.get('time_open', getattr(self.instance, 'time_open', None))
        time_close = attrs.get('time_close', getattr(self.instance, 'time_close', None))
        time_limit = attrs.get('time_limit', getattr(self.instance, 'time_limit', None))
        max_grade = attrs.get('max_grade', getattr(self.instance, 'max_grade', None))
        if time_open and time_close and time_close <= time_open:
            raise serializers.ValidationError({'time_close': 'Closing time must be after opening time.'})
        if time_limit is not None and time_limit <= 0:
            raise serializers.ValidationError({'time_limit': 'Time limit must be positive when supplied.'})
        if max_grade is not None and max_grade <= 0:
            raise serializers.ValidationError({'max_grade': 'Maximum grade must be positive.'})
        return attrs


class AssessmentBuildQuestionSerializer(serializers.Serializer):
    question = serializers.UUIDField()
    order = serializers.IntegerField(min_value=1)
    max_mark = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))


class AssessmentBuildSerializer(AssessmentSerializer):
    """Atomically creates a term-scoped assessment and all of its question slots."""

    questions = AssessmentBuildQuestionSerializer(many=True, write_only=True)

    class Meta(AssessmentSerializer.Meta):
        fields = AssessmentSerializer.Meta.fields + ['questions']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        questions = attrs.get('questions') or []
        if not questions:
            raise serializers.ValidationError({'questions': 'Add at least one assessment-bank question before saving.'})
        question_ids = [item['question'] for item in questions]
        orders = [item['order'] for item in questions]
        if len(question_ids) != len(set(question_ids)):
            raise serializers.ValidationError({'questions': 'A question can only appear once in an assessment.'})
        if len(orders) != len(set(orders)):
            raise serializers.ValidationError({'questions': 'Each question must have a unique position.'})
        selected_questions = {
            question.id: question
            for question in Question.objects.select_related('category').filter(id__in=question_ids)
        }
        if len(selected_questions) != len(question_ids):
            raise serializers.ValidationError({'questions': 'One or more selected questions no longer exist.'})
        course = attrs['course']
        for item in questions:
            question = selected_questions[item['question']]
            if question.category.bank != 'assessment':
                raise serializers.ValidationError({'questions': 'Only questions in the assessment bank may be used.'})
            if question.category.course_id != course.id:
                raise serializers.ValidationError({'questions': 'Every question must belong to the selected course.'})
            if question.qtype == 'essay':
                raise serializers.ValidationError({'questions': 'Essay questions require manual marking and cannot be used here.'})
        return attrs


class AssessmentDetailSerializer(BaseAssessmentSerializer):
    assessment_questions = AssessmentQuestionSlotSerializer(many=True, read_only=True)
    questions = serializers.SerializerMethodField()
    time_limit_minutes = serializers.SerializerMethodField()

    class Meta(BaseAssessmentSerializer.Meta):
        fields = BaseAssessmentSerializer.Meta.fields + [
            'assessment_questions', 'questions', 'time_limit_minutes',
        ]

    def get_time_limit_minutes(self, obj):
        return obj.time_limit // 60 if obj.time_limit else None

    def get_questions(self, obj):
        slots = obj.assessment_questions.select_related('question').prefetch_related('question__answers').all()
        result = []
        for slot in slots:
            data = QuestionPublicSerializer(slot.question).data
            data['max_mark'] = float(slot.max_mark)
            data['order'] = slot.order
            result.append(data)
        return result


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
    
    def get_max_mark(self, obj) -> float:
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
    
    def get_max_mark(self, obj) -> float:
        quiz_question = QuizQuestion.objects.filter(
            quiz=obj.quiz_attempt.quiz,
            question=obj.question
        ).first()
        return float(quiz_question.max_mark) if quiz_question else 0.0
    
    def get_correct_answer(self, obj) -> dict:
        from .services import QuestionService
        return QuestionService.get_correct_answer(obj.question)


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_name = serializers.CharField(source='quiz.name', read_only=True)
    time_taken_seconds = serializers.SerializerMethodField()
    deadline_at = serializers.SerializerMethodField()
    
    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_name', 'user_external_id',
            'attempt_number', 'state', 'started_at', 'finished_at',
            'total_score', 'time_taken_seconds', 'deadline_at'
        ]
        read_only_fields = ['started_at', 'finished_at', 'total_score', 'state']
    
    def get_time_taken_seconds(self, obj) -> int:
        if obj.finished_at:
            return int((obj.finished_at - obj.started_at).total_seconds())
        return None

    def get_deadline_at(self, obj):
        from .services import QuizService
        deadline = QuizService.get_attempt_deadline(obj)
        return deadline.isoformat() if deadline else None


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
    
    def get_time_taken_seconds(self, obj) -> int:
        if obj.finished_at:
            return int((obj.finished_at - obj.started_at).total_seconds())
        return None
    
    def get_summary(self, obj) -> dict:
        from .services import QuizService
        return QuizService.get_attempt_summary(obj)


class StudentQuestionAttemptSerializer(serializers.ModelSerializer):
    """A student's attempt view. Never reveal grading data while it is active."""
    question = QuestionPublicSerializer(read_only=True)
    max_mark = serializers.SerializerMethodField()
    fraction = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()
    correct_answer = serializers.SerializerMethodField()

    class Meta:
        model = QuestionAttempt
        fields = [
            'id', 'question', 'display_order', 'response', 'max_mark',
            'fraction', 'score', 'feedback', 'correct_answer',
            'graded_at', 'manually_graded'
        ]

    def get_max_mark(self, obj) -> float:
        quiz_question = QuizQuestion.objects.filter(
            quiz=obj.quiz_attempt.quiz, question=obj.question
        ).first()
        return float(quiz_question.max_mark) if quiz_question else 0.0

    def _can_show_feedback(self, obj) -> bool:
        return obj.quiz_attempt.state == 'finished' and obj.quiz_attempt.quiz.show_feedback

    def get_fraction(self, obj):
        return float(obj.fraction) if self._can_show_feedback(obj) and obj.fraction is not None else None

    def get_score(self, obj):
        return float(obj.score) if self._can_show_feedback(obj) and obj.score is not None else None

    def get_feedback(self, obj):
        return obj.feedback if self._can_show_feedback(obj) else ''

    def get_correct_answer(self, obj):
        if not self._can_show_feedback(obj):
            return None
        from .services import QuestionService
        return QuestionService.get_correct_answer(obj.question)


class StudentQuizAttemptDetailSerializer(serializers.ModelSerializer):
    """Student-safe detail view for both in-progress and completed attempts."""
    quiz = QuizSerializer(read_only=True)
    question_attempts = StudentQuestionAttemptSerializer(many=True, read_only=True)
    deadline_at = serializers.SerializerMethodField()
    time_taken_seconds = serializers.SerializerMethodField()
    total_score = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'attempt_number', 'state', 'started_at', 'finished_at',
            'total_score', 'deadline_at', 'time_taken_seconds', 'question_attempts'
        ]

    def get_deadline_at(self, obj):
        from .services import QuizService
        deadline = QuizService.get_attempt_deadline(obj)
        return deadline.isoformat() if deadline else None

    def get_time_taken_seconds(self, obj):
        if obj.finished_at:
            return int((obj.finished_at - obj.started_at).total_seconds())
        return None

    def get_total_score(self, obj):
        if obj.state != 'finished' or not obj.quiz.show_feedback or obj.total_score is None:
            return None
        return float(obj.total_score)


class StudentQuizAttemptSerializer(serializers.ModelSerializer):
    """Student-safe summary that honours a quiz's feedback visibility setting."""
    quiz_name = serializers.CharField(source='quiz.name', read_only=True)
    total_score = serializers.SerializerMethodField()
    deadline_at = serializers.SerializerMethodField()

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_name', 'attempt_number', 'state', 'started_at',
            'finished_at', 'total_score', 'deadline_at'
        ]

    def get_total_score(self, obj):
        if obj.state != 'finished' or not obj.quiz.show_feedback or obj.total_score is None:
            return None
        return float(obj.total_score)

    def get_deadline_at(self, obj):
        from .services import QuizService
        deadline = QuizService.get_attempt_deadline(obj)
        return deadline.isoformat() if deadline else None


class StudentAssessmentQuestionAttemptSerializer(serializers.ModelSerializer):
    """Student-safe assessment answer state with no answers leaked mid-attempt."""

    question = serializers.SerializerMethodField()
    fraction = serializers.SerializerMethodField()
    score = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentQuestionAttempt
        fields = [
            'id', 'question', 'display_order', 'response', 'max_mark',
            'fraction', 'score', 'feedback', 'graded_at',
        ]

    def get_question(self, obj):
        snapshot = obj.question_snapshot or {}
        if snapshot:
            return {
                'id': snapshot.get('id'),
                'name': snapshot.get('name', ''),
                'qtype': snapshot.get('qtype'),
                'question_text': snapshot.get('question_text', ''),
                'answers': [
                    {
                        'id': answer['id'],
                        'answer_text': answer['answer_text'],
                        'order': answer.get('order', 0),
                    }
                    for answer in snapshot.get('answers', [])
                ],
            }
        return QuestionPublicSerializer(obj.question).data

    def _can_show_feedback(self, obj):
        return obj.assessment_attempt.state == 'finished' and obj.assessment_attempt.show_feedback

    def get_fraction(self, obj):
        return float(obj.fraction) if self._can_show_feedback(obj) and obj.fraction is not None else None

    def get_score(self, obj):
        return float(obj.score) if self._can_show_feedback(obj) and obj.score is not None else None

    def get_feedback(self, obj):
        return obj.feedback if self._can_show_feedback(obj) else ''


class StudentAssessmentAttemptSerializer(serializers.ModelSerializer):
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    deadline_at = serializers.SerializerMethodField()
    total_score = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentAttempt
        fields = [
            'id', 'assessment', 'assessment_name', 'attempt_number', 'state',
            'started_at', 'finished_at', 'total_score', 'deadline_at', 'grade_scale', 'show_feedback',
        ]

    def get_deadline_at(self, obj):
        from .services import AssessmentService
        deadline = AssessmentService.get_attempt_deadline(obj)
        return deadline.isoformat() if deadline else None

    def get_total_score(self, obj):
        if obj.state != 'finished' or not obj.show_feedback or obj.total_score is None:
            return None
        return float(obj.total_score)


class AssessmentAttemptSerializer(serializers.ModelSerializer):
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    deadline_at = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentAttempt
        fields = [
            'id', 'assessment', 'assessment_name', 'user_external_id', 'attempt_number',
            'state', 'started_at', 'finished_at', 'total_score', 'deadline_at', 'grade_scale',
        ]
        read_only_fields = fields

    def get_deadline_at(self, obj):
        from .services import AssessmentService
        deadline = AssessmentService.get_attempt_deadline(obj)
        return deadline.isoformat() if deadline else None


class StudentAssessmentAttemptDetailSerializer(StudentAssessmentAttemptSerializer):
    assessment = AssessmentSerializer(read_only=True)
    question_attempts = StudentAssessmentQuestionAttemptSerializer(many=True, read_only=True)
    time_taken_seconds = serializers.SerializerMethodField()

    class Meta(StudentAssessmentAttemptSerializer.Meta):
        fields = StudentAssessmentAttemptSerializer.Meta.fields + [
            'time_taken_seconds', 'question_attempts',
        ]

    def get_time_taken_seconds(self, obj):
        if obj.finished_at:
            return int((obj.finished_at - obj.started_at).total_seconds())
        return None


# ==========================================
# REQUEST/RESPONSE SERIALIZERS
# ==========================================

class StartQuizSerializer(serializers.Serializer):
    """Request serializer for starting a quiz"""
    session = serializers.CharField(max_length=50)
    semester = serializers.CharField(max_length=100)


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
    item_name = serializers.CharField(read_only=True)
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
    assessment_marks = serializers.DecimalField(max_digits=10, decimal_places=2)
    assessment_possible = serializers.DecimalField(max_digits=10, decimal_places=2)
    grade_count = serializers.IntegerField()


class GradebookSummarySerializer(serializers.Serializer) :
    """Serializer for gradebook summary"""
    student_external_id = serializers.CharField()
    total_marks = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_possible = serializers.DecimalField(max_digits=10, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    assignment_count = serializers.IntegerField()
    quiz_count = serializers.IntegerField()
    assessment_count = serializers.IntegerField()
