"""
Assessment app admin - Moodle-style Quiz System

Django admin configurations for question bank, quizzes, and attempts.
"""
from django.contrib import admin
from .models import (
    Assignment, AssignmentContent, AssignmentSubmission, AssignmentSubmissionFile,
    QuestionCategory, Question, QuestionAnswer,
    Quiz, QuizQuestion, QuizAttempt, QuestionAttempt
)


# ==========================================
# ASSIGNMENT ADMINS
# ==========================================

class AssignmentContentInline(admin.TabularInline):
    model = AssignmentContent
    extra = 1
    fields = ('content_type', 'title', 'original_filename', 'storage_backend', 'is_published')
    readonly_fields = ('original_filename',)


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'course', 'open_at', 'due_at', 'is_published', 'created_by', 'created_at')
    list_filter = ('course', 'is_published', 'created_at')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'
    inlines = [AssignmentContentInline]
    readonly_fields = ('created_at',)


class AssignmentSubmissionFileInline(admin.TabularInline):
    model = AssignmentSubmissionFile
    extra = 0
    fields = ('original_filename', 'file_size', 'mime_type', 'storage_backend', 'created_at')
    readonly_fields = ('original_filename', 'file_size', 'mime_type', 'created_at')


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'assignment', 'student_external_id', 'attempt_number', 'status', 'submitted_at', 'graded_at')
    list_filter = ('assignment', 'status', 'submitted_at', 'graded_at')
    search_fields = ('student_external_id',)
    date_hierarchy = 'created_at'
    inlines = [AssignmentSubmissionFileInline]
    readonly_fields = ('attempt_number', 'created_at')


@admin.register(AssignmentContent)
class AssignmentContentAdmin(admin.ModelAdmin):
    list_display = ('id', 'assignment', 'title', 'content_type', 'storage_backend', 'file_size', 'download_count', 'is_published')
    list_filter = ('assignment', 'content_type', 'storage_backend', 'is_published')
    search_fields = ('title', 'description', 'original_filename')
    readonly_fields = ('content_hash', 'created_at')


@admin.register(AssignmentSubmissionFile)
class AssignmentSubmissionFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'submission', 'original_filename', 'file_size', 'storage_backend', 'created_at')
    list_filter = ('storage_backend', 'created_at')
    search_fields = ('original_filename',)
    readonly_fields = ('content_hash', 'created_at')


# ==========================================
# QUESTION BANK ADMINS
# ==========================================

@admin.register(QuestionCategory)
class QuestionCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'course', 'created_at')
    list_filter = ('course', 'created_at')
    search_fields = ('name', 'description')
    date_hierarchy = 'created_at'


class QuestionAnswerInline(admin.TabularInline):
    """Inline admin for question answers"""
    model = QuestionAnswer
    extra = 2
    fields = ('answer_text', 'fraction', 'feedback', 'order')
    ordering = ('order',)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'qtype', 'default_mark', 'version', 'created_at')
    list_filter = ('category', 'qtype', 'created_at')
    search_fields = ('name', 'question_text')
    date_hierarchy = 'created_at'
    inlines = [QuestionAnswerInline]
    readonly_fields = ('version', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'qtype', 'name', 'question_text')
        }),
        ('Grading', {
            'fields': ('default_mark', 'penalty')
        }),
        ('Feedback', {
            'fields': ('general_feedback',)
        }),
        ('Metadata', {
            'fields': ('version', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(QuestionAnswer)
class QuestionAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'question', 'answer_text_short', 'fraction', 'order')
    list_filter = ('question__qtype', 'fraction')
    search_fields = ('answer_text', 'question__name')
    
    def answer_text_short(self, obj):
        """Display first 50 chars of answer"""
        return obj.answer_text[:50] + '...' if len(obj.answer_text) > 50 else obj.answer_text
    answer_text_short.short_description = 'Answer'


# ==========================================
# QUIZ ADMINS
# ==========================================

class QuizQuestionSlotInline(admin.TabularInline):
    """Inline admin for quiz-question slots"""
    model = QuizQuestion
    extra = 1
    fields = ('question', 'order', 'max_mark')
    ordering = ('order',)
    autocomplete_fields = ['question']


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'course', 'time_open', 'time_close', 'max_grade', 'max_attempts', 'created_at')
    list_filter = ('course', 'time_open', 'time_close', 'created_at')
    search_fields = ('name', 'description')
    date_hierarchy = 'created_at'
    inlines = [QuizQuestionSlotInline]
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'name', 'description')
        }),
        ('Timing', {
            'fields': ('time_open', 'time_close', 'time_limit')
        }),
        ('Grading', {
            'fields': ('max_grade',)
        }),
        ('Behavior', {
            'fields': ('shuffle_questions', 'max_attempts', 'show_feedback')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'quiz', 'question', 'order', 'max_mark')
    list_filter = ('quiz',)
    search_fields = ('quiz__name', 'question__name')
    ordering = ('quiz', 'order')


# ==========================================
# ATTEMPT ADMINS
# ==========================================

class QuestionAttemptInline(admin.TabularInline):
    """Inline admin for question attempts"""
    model = QuestionAttempt
    extra = 0
    fields = ('question', 'response_preview', 'fraction', 'score', 'manually_graded')
    readonly_fields = ('question', 'response_preview', 'fraction', 'score', 'manually_graded')
    can_delete = False
    
    def response_preview(self, obj):
        """Display first 50 chars of response"""
        response_str = str(obj.response)
        return response_str[:50] + '...' if len(response_str) > 50 else response_str
    response_preview.short_description = 'Response'


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'quiz', 'user_external_id', 'attempt_number', 'state', 'total_score', 'started_at', 'finished_at')
    list_filter = ('quiz', 'state', 'started_at')
    search_fields = ('user_external_id', 'quiz__name')
    date_hierarchy = 'started_at'
    readonly_fields = ('started_at', 'finished_at', 'total_score')
    inlines = [QuestionAttemptInline]
    
    fieldsets = (
        ('Attempt Information', {
            'fields': ('quiz', 'user_external_id', 'attempt_number', 'state')
        }),
        ('Results', {
            'fields': ('total_score', 'started_at', 'finished_at')
        })
    )


@admin.register(QuestionAttempt)
class QuestionAttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'quiz_attempt', 'question', 'fraction', 'score', 'manually_graded', 'graded_at')
    list_filter = ('question__qtype', 'manually_graded', 'graded_at')
    search_fields = ('quiz_attempt__user_external_id', 'question__name')
    readonly_fields = ('quiz_attempt', 'question', 'response', 'graded_at')
    
    fieldsets = (
        ('Attempt Information', {
            'fields': ('quiz_attempt', 'question', 'response')
        }),
        ('Grading', {
            'fields': ('fraction', 'score', 'manually_graded', 'graded_at', 'feedback')
        })
    )
