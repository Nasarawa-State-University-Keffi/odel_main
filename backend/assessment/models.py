import uuid
from django.db import models
from django.contrib.postgres.fields import JSONField as PostgresJSONField
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

from courses.models import CourseCache
from portal_auth.models import PortalUser

try:
    # Django 3.1+ has built-in JSONField
    from django.db.models import JSONField
except Exception:
    JSONField = PostgresJSONField


def submission_upload_to(instance, filename):
    """Upload path for assignment submissions"""
    return f'submissions/{instance.assignment.id}/{instance.student_external_id}/{filename}'

class Assignment(models.Model):
    """
    Assignment definition (teacher-owned).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    course = models.ForeignKey(
        CourseCache,
        on_delete=models.CASCADE,
        related_name='assignments'
    )

    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)

    open_at = models.DateTimeField()
    due_at = models.DateTimeField()
    close_at = models.DateTimeField(null=True, blank=True)

    max_attempts = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Null means unlimited attempts"
    )

    allow_late_submission = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    
    max_marks = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=10.00,
        help_text="Maximum marks for this assignment"
    )

    created_by = models.ForeignKey(
        PortalUser,
        on_delete=models.PROTECT,
        related_name='created_assignments'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course']),
            models.Index(fields=['open_at', 'due_at']),
        ]

    def __str__(self):
        return self.title
    

class AssignmentContent(models.Model):
    """
    Files attached to assignment (instructions, rubric, datasets, etc.)
    """

    CONTENT_TYPE_CHOICES = (
        ('instruction', 'Instruction'),
        ('resource', 'Resource'),
        ('example', 'Example'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='contents'
    )

    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPE_CHOICES,
        db_index=True
    )

    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)

    storage_path = models.CharField(max_length=512, db_index=True)
    original_filename = models.CharField(max_length=512)
    file_size = models.BigIntegerField(null=True, blank=True)
    mime_type = models.CharField(max_length=100, blank=True)

    storage_backend = models.CharField(max_length=20, default='local')
    content_hash = models.CharField(max_length=64, blank=True, db_index=True)

    uploaded_by = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True
    )

    is_published = models.BooleanField(default=True)
    download_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['assignment', 'content_type']),
        ]

    def __str__(self):
        return f"{self.assignment.title} - {self.title}"

    @property
    def url(self):
        from learning_resources.storage import get_storage_engine
        try:
            return get_storage_engine(self.storage_backend).url(self.storage_path)
        except Exception:
            return ""

    def increment_downloads(self):
        self.download_count = models.F('download_count') + 1
        self.save(update_fields=['download_count'])

    def delete(self, *args, **kwargs):
        """Delete file from storage backend before deleting DB entry"""
        from learning_resources.storage import get_storage_engine
        try:
            engine = get_storage_engine(self.storage_backend)
            engine.delete(self.storage_path)
        except Exception:
            pass
        super().delete(*args, **kwargs)


class AssignmentSubmission(models.Model):
    """
    A single submission attempt by a student.
    """

    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('reopened', 'Reopened'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions'
    )

    student_external = models.ForeignKey(
        PortalUser,
        to_field='external_id',
        db_column='student_external_id',
        on_delete=models.PROTECT,
        related_name='assignment_submissions',
    )

    attempt_number = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )

    submitted_at = models.DateTimeField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    marks = models.DecimalField(
        max_digits=6, decimal_places=2, blank=True, null=True,
        help_text="Final score for this submission attempt"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (
            'assignment',
            'student_external',
            'attempt_number',
        )
        indexes = [
            models.Index(fields=['assignment', 'student_external']),
        ]

    def __str__(self):
        return f"{self.assignment.title} | {self.student_external_id} | Attempt {self.attempt_number}"

class AssignmentSubmissionFile(models.Model):
    """
    Student-uploaded files using same storage abstraction.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    submission = models.ForeignKey(
        AssignmentSubmission,
        on_delete=models.CASCADE,
        related_name='files'
    )

    storage_path = models.CharField(max_length=512)
    original_filename = models.CharField(max_length=512)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)

    storage_backend = models.CharField(max_length=20, default='local')
    content_hash = models.CharField(max_length=64, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.submission.assignment.title} - {self.original_filename}"

    @property
    def url(self):
        from learning_resources.storage import get_storage_engine
        try:
            return get_storage_engine(self.storage_backend).url(self.storage_path)
        except Exception:
            return ""

    def delete(self, *args, **kwargs):
        """Delete file from storage backend before deleting DB entry"""
        from learning_resources.storage import get_storage_engine
        try:
            engine = get_storage_engine(self.storage_backend)
            engine.delete(self.storage_path)
        except Exception:
            pass
        super().delete(*args, **kwargs)


# ==========================================
# MOODLE-STYLE QUIZ SYSTEM
# ==========================================

class QuestionCategory(models.Model):
    """
    Organizes questions into categories for reuse across quizzes.
    Similar to Moodle's question bank categories.
    """
    LEVEL_CHOICES = (
        ('100', '100'),
        ('200', '200'),
        ('300', '300'),
        ('400', '400'),
        ('500', '500'),
        ('all', 'All Levels'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey('courses.CourseCache', on_delete=models.CASCADE, related_name='question_categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    level = models.CharField(
        max_length=50,
        choices=LEVEL_CHOICES,
        default='all',
        help_text="Educational level for questions in this category (100-500)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Question Category'
        verbose_name_plural = 'Question Categories'
        unique_together = [['course', 'name']]

    def __str__(self):
        return f"{self.course} - {self.name}"


class QuestionTypeAvailability(models.Model):
    """
    Global database-configurable settings to control which question types
    are available for different educational levels or contexts.
    
    This allows administrators to restrict certain question types
    (e.g., only multiple choice for elementary, essays for university)
    """
    LEVEL_CHOICES = (
        ('100', '100'),
        ('200', '200'),
        ('300', '300'),
        ('400', '400'),
        ('500', '500'),
        ('all', 'All Levels'),
    )
    
    QUESTION_TYPE_CHOICES = (
        ('multichoice', 'Multiple Choice'),
        ('truefalse', 'True/False'),
        ('shortanswer', 'Short Answer'),
        ('essay', 'Essay'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.CharField(
        max_length=50,
        choices=LEVEL_CHOICES,
        db_index=True,
        help_text="Educational level this setting applies to"
    )
    question_type = models.CharField(
        max_length=32,
        choices=QUESTION_TYPE_CHOICES,
        db_index=True,
        help_text="Type of question"
    )
    is_enabled = models.BooleanField(
        default=True,
        help_text="Whether this question type is enabled for this level"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description or reason for this configuration"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        PortalUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='question_type_settings'
    )
    
    class Meta:
        ordering = ['level', 'question_type']
        verbose_name = 'Question Type Availability'
        verbose_name_plural = 'Question Type Availabilities'
        unique_together = [['level', 'question_type']]
        indexes = [
            models.Index(fields=['level', 'is_enabled']),
            models.Index(fields=['question_type', 'is_enabled']),
        ]
    
    def __str__(self):
        status = "Enabled" if self.is_enabled else "Disabled"
        return f"{self.get_level_display()} - {self.get_question_type_display()}: {status}"
    
    @classmethod
    def is_question_type_allowed(cls, level, question_type):
        """
        Check if a question type is allowed for a given level.
        Returns True if no setting exists (default allow) or if explicitly enabled.
        """
        try:
            setting = cls.objects.get(level=level, question_type=question_type)
            return setting.is_enabled
        except cls.DoesNotExist:
            # If no setting exists, check for 'all' level fallback
            try:
                fallback = cls.objects.get(level='all', question_type=question_type)
                return fallback.is_enabled
            except cls.DoesNotExist:
                # Default to True if no configuration exists
                return True
    
    @classmethod
    def get_available_question_types(cls, level):
        """
        Get list of enabled question types for a given level.
        Returns all types if no restrictions are configured.
        If any restrictions exist for a level, only enabled types are returned.
        """
        all_types = [choice[0] for choice in cls.QUESTION_TYPE_CHOICES]
        
        # Get settings for this level
        settings = cls.objects.filter(level=level)
        if not settings.exists():
            # Check for 'all' level settings
            settings = cls.objects.filter(level='all')
            if not settings.exists():
                # No restrictions configured, return all types
                return all_types
        
        # If settings exist, only return enabled types
        enabled_types = [s.question_type for s in settings if s.is_enabled]
        return enabled_types


class Question(models.Model):
    """
    Reusable question in the question bank.
    Questions are independent of quizzes and can be reused across multiple quizzes.
    
    Question Types:
    - multichoice: Multiple choice with single or multiple correct answers
    - truefalse: True/False question
    - shortanswer: Short text answer with exact or partial matching
    - essay: Long-form answer requiring manual grading
    """
    QUESTION_TYPES = (
        ('multichoice', 'Multiple Choice'),
        ('truefalse', 'True/False'),
        ('shortanswer', 'Short Answer'),
        ('essay', 'Essay'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    category = models.ForeignKey(QuestionCategory, on_delete=models.CASCADE, related_name='questions')
    qtype = models.CharField(max_length=32, choices=QUESTION_TYPES, db_index=True)
    name = models.CharField(max_length=255, help_text="Internal name for question management")
    question_text = models.TextField(help_text="Question text (supports HTML)")
    general_feedback = models.TextField(blank=True, help_text="Feedback shown after answering")
    default_mark = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=1.00,
        validators=[MinValueValidator(0)],
        help_text="Default points for this question"
    )
    penalty = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text="Penalty factor for wrong attempts (0-1)"
    )
    version = models.IntegerField(default=1, help_text="Question version for tracking changes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        indexes = [
            models.Index(fields=['category', 'qtype']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_qtype_display()})"
    
    def clean(self):
        """
        Validate that the question type is allowed for the category's level.
        """
        from django.core.exceptions import ValidationError
        
        if self.category and self.qtype:
            # Check if this question type is allowed for the category's level
            is_allowed = QuestionTypeAvailability.is_question_type_allowed(
                level=self.category.level,
                question_type=self.qtype
            )
            
            if not is_allowed:
                raise ValidationError({
                    'qtype': f"Question type '{self.get_qtype_display()}' is not allowed for {self.category.get_level_display()} level. "
                            f"Please check the Question Type Availability settings or choose a different question type."
                })
    
    def save(self, *args, **kwargs):
        """Override save to call full_clean for validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class QuestionAnswer(models.Model):
    """
    Answer options for questions (used by multichoice, truefalse, etc.)
    
    Fraction values:
    - 1.0: Fully correct answer
    - 0.5: Partially correct (for partial credit)
    - 0.0: Incorrect answer
    - -1.0: Penalty for selecting wrong answer
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField()
    fraction = models.DecimalField(
        max_digits=3, 
        decimal_places=2,
        validators=[MinValueValidator(-1), MaxValueValidator(1)],
        help_text="Grade fraction: 1.0=correct, 0.5=partial, 0.0=wrong, -1.0=penalty"
    )
    feedback = models.TextField(blank=True, help_text="Feedback for this answer option")
    order = models.IntegerField(default=0, help_text="Display order")

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'Question Answer'
        verbose_name_plural = 'Question Answers'

    def __str__(self):
        return f"{self.question.name} - {self.answer_text[:30]}"


class Quiz(models.Model):
    """
    Quiz/Assessment containing questions from the question bank.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey('courses.CourseCache', on_delete=models.CASCADE, related_name='quizzes')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    time_open = models.DateTimeField(null=True, blank=True, help_text="When quiz becomes available")
    time_close = models.DateTimeField(null=True, blank=True, help_text="When quiz closes")
    time_limit = models.IntegerField(
        null=True, 
        blank=True, 
        help_text="Time limit in seconds (null = no limit)"
    )
    max_grade = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=100.00,
        help_text="Maximum grade for this quiz"
    )
    shuffle_questions = models.BooleanField(default=False, help_text="Randomize question order")
    max_attempts = models.IntegerField(default=1, help_text="Maximum attempts allowed (0 = unlimited)")
    show_feedback = models.BooleanField(default=True, help_text="Show feedback after submission")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'

    def __str__(self):
        return self.name


class QuizQuestion(models.Model):
    """
    Slot table linking questions to quizzes with specific ordering and max marks.
    Same question can appear in multiple quizzes with different point values.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='quiz_questions')
    question = models.ForeignKey(Question, on_delete=models.PROTECT, related_name='quiz_slots')
    order = models.IntegerField(help_text="Question order in quiz")
    max_mark = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Maximum points for this question in this quiz (can override default_mark)"
    )

    class Meta:
        ordering = ['quiz', 'order']
        unique_together = [['quiz', 'question'], ['quiz', 'order']]
        verbose_name = 'Quiz Question Slot'
        verbose_name_plural = 'Quiz Question Slots'

    def __str__(self):
        return f"{self.quiz.name} - Q{self.order}: {self.question.name}"


class QuizAttempt(models.Model):
    """
    A user's attempt at a quiz.
    Tracks state, timing, and final score.
    """
    STATE_CHOICES = (
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
        ('abandoned', 'Abandoned'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user_external_id = models.CharField(max_length=255, db_index=True, help_text="External user ID")
    attempt_number = models.IntegerField(help_text="Attempt number for this user/quiz")
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='in_progress', db_index=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    total_score = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Final score for this attempt"
    )

    class Meta:
        ordering = ['-started_at']
        unique_together = [['quiz', 'user_external_id', 'attempt_number']]
        indexes = [
            models.Index(fields=['quiz', 'user_external_id', '-attempt_number']),
            models.Index(fields=['state', 'started_at']),
        ]
        verbose_name = 'Quiz Attempt'
        verbose_name_plural = 'Quiz Attempts'

    def __str__(self):
        return f"{self.user_external_id} - {self.quiz.name} (Attempt #{self.attempt_number})"


class QuestionAttempt(models.Model):
    """
    A user's response to a specific question within a quiz attempt.
    Stores response as JSON and grading results.
    
    Response JSON structure varies by question type:
    - multichoice: {"selected": ["answer_id_1", "answer_id_2"]}
    - truefalse: {"selected": "answer_id"}
    - shortanswer: {"text": "user answer"}
    - essay: {"text": "long form answer"}
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quiz_attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='question_attempts')
    question = models.ForeignKey(Question, on_delete=models.PROTECT, related_name='attempts')
    response = JSONField(default=dict, help_text="Student response (structure depends on question type)")
    fraction = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Grade fraction (0.0-1.0)"
    )
    score = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Actual points earned (fraction × max_mark)"
    )
    graded_at = models.DateTimeField(null=True, blank=True)
    manually_graded = models.BooleanField(default=False, help_text="True if manually graded (e.g., essays)")
    feedback = models.TextField(blank=True, help_text="Specific feedback for this attempt")

    class Meta:
        ordering = ['quiz_attempt', 'question']
        unique_together = [['quiz_attempt', 'question']]
        verbose_name = 'Question Attempt'
        verbose_name_plural = 'Question Attempts'

    def __str__(self):
        return f"Attempt {self.quiz_attempt.id} - {self.question.name}"


# ==========================================
# GRADEBOOK SYSTEM
# ==========================================

class Grade(models.Model):
    """
    Gradebook entry for a student in a course.
    Each grade entry represents one scored item (assignment or quiz attempt).
    Supports multiple attempts by linking to specific submissions.
    """
    
    GRADE_TYPE_CHOICES = (
        ('assignment', 'Assignment'),
        ('quiz', 'Quiz'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    student_external_id = models.CharField(
        max_length=255,
        db_index=True,
        help_text="External student identifier"
    )
    
    course = models.ForeignKey(
        CourseCache,
        on_delete=models.CASCADE,
        related_name='grades',
        help_text="Course this grade belongs to"
    )
    
    grade_type = models.CharField(
        max_length=20,
        choices=GRADE_TYPE_CHOICES,
        db_index=True,
        help_text="Type of graded item"
    )
    
    # Link to specific graded items (one will be set, the other null)
    assignment_submission = models.ForeignKey(
        'AssignmentSubmission',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='grades',
        help_text="Link to graded assignment submission"
    )
    
    quiz_attempt = models.ForeignKey(
        'QuizAttempt',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='grades',
        help_text="Link to graded quiz attempt"
    )
    
    # Score information
    marks = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Score earned by student"
    )
    
    total_possible = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Maximum possible score for this item"
    )
    
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Percentage score (marks/total_possible × 100)"
    )
    
    # Timestamps
    graded_at = models.DateTimeField(
        help_text="When the item was graded"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-graded_at']
        indexes = [
            models.Index(fields=['student_external_id', 'course']),
            models.Index(fields=['course', 'grade_type']),
            models.Index(fields=['student_external_id', 'course', 'grade_type']),
        ]
        constraints = [
            # Ensure only one grade per assignment submission
            models.UniqueConstraint(
                fields=['assignment_submission'],
                name='unique_assignment_submission_grade',
                condition=models.Q(assignment_submission__isnull=False)
            ),
            # Ensure only one grade per quiz attempt
            models.UniqueConstraint(
                fields=['quiz_attempt'],
                name='unique_quiz_attempt_grade',
                condition=models.Q(quiz_attempt__isnull=False)
            ),
        ]
        verbose_name = 'Grade'
        verbose_name_plural = 'Grades'
    
    def save(self, *args, **kwargs):
        """Calculate percentage before saving"""
        if self.marks is not None and self.total_possible and self.total_possible > 0:
            self.percentage = (self.marks / self.total_possible) * 100
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validate that exactly one of assignment_submission or quiz_attempt is set"""
        from django.core.exceptions import ValidationError
        
        if self.assignment_submission and self.quiz_attempt:
            raise ValidationError("Grade cannot be linked to both assignment and quiz")
        
        if not self.assignment_submission and not self.quiz_attempt:
            raise ValidationError("Grade must be linked to either assignment submission or quiz attempt")
        
        # Validate grade_type matches the linked item
        if self.assignment_submission and self.grade_type != 'assignment':
            raise ValidationError("grade_type must be 'assignment' when assignment_submission is set")
        
        if self.quiz_attempt and self.grade_type != 'quiz':
            raise ValidationError("grade_type must be 'quiz' when quiz_attempt is set")
    
    def __str__(self):
        if self.assignment_submission:
            item_name = self.assignment_submission.assignment.title
        elif self.quiz_attempt:
            item_name = self.quiz_attempt.quiz.name
        else:
            item_name = "Unknown"
        
        return f"{self.student_external_id} - {item_name}: {self.marks}/{self.total_possible}"
    
    @property
    def item_name(self):
        """Get the name of the graded item"""
        if self.assignment_submission:
            return self.assignment_submission.assignment.title
        elif self.quiz_attempt:
            return self.quiz_attempt.quiz.name
        return "Unknown"
