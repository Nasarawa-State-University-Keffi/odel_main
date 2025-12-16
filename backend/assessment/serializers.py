"""
Assessment Serializers - Moodle-style Quiz System

DRF serializers for the quiz and question bank system.
"""
from rest_framework import serializers
from .models import (
    Assignment, AssignmentContent, AssignmentSubmission, AssignmentSubmissionFile,
    QuestionCategory, Question, QuestionAnswer,
    Quiz, QuizQuestion, QuizAttempt, QuestionAttempt
)


# ==========================================
# ASSIGNMENT SERIALIZERS 
# ==========================================
# this is to be used by swagger doc
class StartAssignmentSubmissionSerializer(serializers.Serializer):
    assignment_id = serializers.UUIDField()
    student_external_id = serializers.CharField(max_length=255)

class SubmitAssignmentSerializer(serializers.Serializer):
    # no body required, but Swagger likes explicitness
    confirm = serializers.BooleanField(
        default=True,
        help_text="Confirm submission"
    )
# =========================================
# ASSIGNMENT SERIALIZERS
# ==========================================
# main serializers for assignments and submissions
class AssignmentSerializer(serializers.ModelSerializer):
    content_files = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')
    
    def get_content_files(self, obj):
        """Get all content files attached to this assignment"""
        contents = obj.contents.filter(is_published=True)
        return AssignmentContentSerializer(contents, many=True).data


class AssignmentContentSerializer(serializers.ModelSerializer):
    url = serializers.ReadOnlyField()

    class Meta:
        model = AssignmentContent
        fields = '__all__'


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
            'attempt_number',
            'status',
            'submitted_at',
            'graded_at',
            'created_at',
        )


# Upload Serializers
class AssignmentContentUploadSerializer(serializers.Serializer):
    """Serializer for uploading assignment content files"""
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
    """Serializer for uploading submission files"""
    submission = serializers.UUIDField(help_text="Submission ID")
    file = serializers.FileField(help_text="File to upload")


# ==========================================
# QUESTION BANK SERIALIZERS
# ==========================================

class QuestionCategorySerializer(serializers.ModelSerializer):
    """Serializer for question categories"""
    questions_count = serializers.SerializerMethodField()
    course_id = serializers.CharField(write_only=True, help_text="Course external_id or UUID")
    
    class Meta:
        model = QuestionCategory
        fields = ['id', 'course', 'course_id', 'name', 'description', 'questions_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'course']
    
    def get_questions_count(self, obj):
        return obj.questions.count()
    
    def validate(self, attrs):
        """Validate and convert course_id to CourseCache instance"""
        from courses.models import CourseCache
        import uuid
        
        course_id = attrs.pop('course_id', None)
        if not course_id:
            raise serializers.ValidationError({"course_id": "This field is required"})
        
        # Try external_id first
        course = CourseCache.objects.filter(external_id=course_id).first()
        if not course:
            # Try UUID
            try:
                uuid_value = uuid.UUID(course_id)
                course = CourseCache.objects.filter(id=uuid_value).first()
            except (ValueError, AttributeError):
                pass
        
        if not course:
            raise serializers.ValidationError({"course_id": "Course not found"})
        
        attrs['course'] = course
        return attrs


class QuestionAnswerSerializer(serializers.ModelSerializer):
    """Serializer for question answer options"""
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'question', 'answer_text', 'fraction', 'feedback', 'order']


class QuestionAnswerPublicSerializer(serializers.ModelSerializer):
    """Public serializer for question answers (hides fractions and feedback during quiz)"""
    class Meta:
        model = QuestionAnswer
        fields = ['id', 'answer_text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    """
    Full serializer for questions (for instructors/admins).
    Includes all answers with correct fractions.
    """
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
    """
    Public serializer for questions (for students taking quiz).
    Excludes correct answers and detailed feedback.
    """
    answers = QuestionAnswerPublicSerializer(many=True, read_only=True)
    qtype_display = serializers.CharField(source='get_qtype_display', read_only=True)
    
    class Meta:
        model = Question
        fields = [
            'id', 'qtype', 'qtype_display', 'name', 'question_text',
            'default_mark', 'answers'
        ]


class QuestionAnswerCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating question answers (without question field)"""
    class Meta:
        model = QuestionAnswer
        fields = ['answer_text', 'fraction', 'feedback', 'order']


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating questions with nested answers.
    """
    answers = QuestionAnswerCreateSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = [
            'id', 'category', 'qtype', 'name', 'question_text',
            'general_feedback', 'default_mark', 'penalty', 'answers'
        ]
    
    def create(self, validated_data):
        answers_data = validated_data.pop('answers', [])
        question = Question.objects.create(**validated_data)
        
        for answer_data in answers_data:
            QuestionAnswer.objects.create(question=question, **answer_data)
        
        return question
    
    def update(self, instance, validated_data):
        answers_data = validated_data.pop('answers', None)
        
        # Update question fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.version += 1  # Increment version on update
        instance.save()
        
        # Update answers if provided
        if answers_data is not None:
            # Delete existing answers
            instance.answers.all().delete()
            
            # Create new answers
            for answer_data in answers_data:
                QuestionAnswer.objects.create(question=instance, **answer_data)
        
        return instance


# ==========================================
# QUIZ SERIALIZERS
# ==========================================

class QuizQuestionSlotSerializer(serializers.ModelSerializer):
    """Serializer for quiz-question slots (linking questions to quizzes)"""
    question_name = serializers.CharField(source='question.name', read_only=True)
    question_type = serializers.CharField(source='question.qtype', read_only=True)
    
    class Meta:
        model = QuizQuestion
        fields = ['id', 'quiz', 'question', 'question_name', 'question_type', 'order', 'max_mark']


class QuizSerializer(serializers.ModelSerializer):
    """Basic quiz serializer"""
    questions_count = serializers.SerializerMethodField()
    total_marks = serializers.SerializerMethodField()
    course_id = serializers.CharField(write_only=True, help_text="Course external_id or UUID")
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'course_id', 'name', 'description', 'time_open', 'time_close',
            'time_limit', 'max_grade', 'shuffle_questions', 'max_attempts',
            'show_feedback', 'questions_count', 'total_marks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'course']
    
    def get_questions_count(self, obj):
        return obj.quiz_questions.count()
    
    def get_total_marks(self, obj):
        from django.db.models import Sum
        total = obj.quiz_questions.aggregate(total=Sum('max_mark'))['total']
        return float(total) if total else 0.0
    
    def validate(self, attrs):
        """Validate and convert course_id to CourseCache instance"""
        from courses.models import CourseCache
        import uuid
        
        course_id = attrs.pop('course_id', None)
        if not course_id:
            raise serializers.ValidationError({"course_id": "This field is required"})
        
        # Try external_id first
        course = CourseCache.objects.filter(external_id=course_id).first()
        if not course:
            # Try UUID
            try:
                uuid_value = uuid.UUID(course_id)
                course = CourseCache.objects.filter(id=uuid_value).first()
            except (ValueError, AttributeError):
                pass
        
        if not course:
            raise serializers.ValidationError({"course_id": "Course not found"})
        
        attrs['course'] = course
        return attrs


class QuizDetailSerializer(serializers.ModelSerializer):
    """Detailed quiz serializer with question slots"""
    quiz_questions = QuizQuestionSlotSerializer(many=True, read_only=True)
    questions_count = serializers.SerializerMethodField()
    total_marks = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'course', 'name', 'description', 'time_open', 'time_close',
            'time_limit', 'max_grade', 'shuffle_questions', 'max_attempts',
            'show_feedback', 'quiz_questions', 'questions_count', 'total_marks',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_questions_count(self, obj):
        return obj.quiz_questions.count()
    
    def get_total_marks(self, obj):
        from django.db.models import Sum
        total = obj.quiz_questions.aggregate(total=Sum('max_mark'))['total']
        return float(total) if total else 0.0


class QuizWithQuestionsSerializer(serializers.ModelSerializer):
    """
    Quiz with full question content (for taking quiz).
    Questions shown without correct answers.
    """
    questions = serializers.SerializerMethodField()
    time_limit_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = [
            'id', 'name', 'description', 'time_limit', 'time_limit_minutes',
            'max_grade', 'questions'
        ]
    
    def get_time_limit_minutes(self, obj):
        return obj.time_limit // 60 if obj.time_limit else None
    
    def get_questions(self, obj):
        """Return questions with their quiz-specific max_mark"""
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
    """Serializer for question attempts"""
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
    """Detailed question attempt with correct answers (for review)"""
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
    """Basic quiz attempt serializer"""
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
    from decimal import Decimal
    fraction = serializers.DecimalField(max_digits=3, decimal_places=2, min_value=Decimal('0'), max_value=Decimal('1'))
    feedback = serializers.CharField(required=False, allow_blank=True)
