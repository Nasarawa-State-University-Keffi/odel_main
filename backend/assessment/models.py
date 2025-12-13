import uuid
from django.db import models
from django.contrib.postgres.fields import JSONField as PostgresJSONField
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal

try:
    # Django 3.1+ has built-in JSONField
    from django.db.models import JSONField
except Exception:
    JSONField = PostgresJSONField


def submission_upload_to(instance, filename):
    """Upload path for assignment submissions"""
    return f'submissions/{instance.assignment.id}/{instance.student_external_id}/{filename}'


class Assignment(models.Model):
    """Assignment model for coursework"""
    course = models.ForeignKey('courses.CourseCache', on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True)
    due_at = models.DateTimeField()
    created_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'

    def __str__(self):
        return f"{self.title}"


class Submission(models.Model):
    """Student submissions for assignments"""
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student_external_id = models.CharField(max_length=255)
    file = models.FileField(upload_to=submission_upload_to)
    marks = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Submission'
        verbose_name_plural = 'Submissions'

    def __str__(self):
        return f"{self.student_external_id} - {self.assignment.title}"


# ==========================================
# MOODLE-STYLE QUIZ SYSTEM
# ==========================================

class QuestionCategory(models.Model):
    """
    Organizes questions into categories for reuse across quizzes.
    Similar to Moodle's question bank categories.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey('courses.CourseCache', on_delete=models.CASCADE, related_name='question_categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Question Category'
        verbose_name_plural = 'Question Categories'
        unique_together = [['course', 'name']]

    def __str__(self):
        return f"{self.course} - {self.name}"


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
