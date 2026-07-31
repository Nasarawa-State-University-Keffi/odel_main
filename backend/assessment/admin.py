"""
Assessment app admin - Moodle-style Quiz System

Django admin configurations for question bank, quizzes, and attempts.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Assignment, AssignmentContent, AssignmentSubmission, AssignmentSubmissionFile,
    QuestionCategory, QuestionTypeAvailability, Question, QuestionAnswer,
    Quiz, QuizQuestion, QuizAttempt, QuestionAttempt,
    Grade
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
    search_fields = ('student_external__external_id',)
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


@admin.register(QuestionTypeAvailability)
class QuestionTypeAvailabilityAdmin(admin.ModelAdmin):
    """Admin for managing question type availability by educational level"""
    list_display = ('level_display', 'question_type_display', 'is_enabled_icon', 'created_at', 'created_by')
    list_filter = ('level', 'question_type', 'is_enabled', 'created_at')
    search_fields = ('description',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at', 'created_by')
    
    fieldsets = (
        ('Configuration', {
            'fields': ('level', 'question_type', 'is_enabled')
        }),
        ('Details', {
            'fields': ('description',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        })
    )
    
    def level_display(self, obj):
        """Display level with nice formatting"""
        return obj.get_level_display()
    level_display.short_description = 'Educational Level'
    level_display.admin_order_field = 'level'
    
    def question_type_display(self, obj):
        """Display question type with nice formatting"""
        return obj.get_question_type_display()
    question_type_display.short_description = 'Question Type'
    question_type_display.admin_order_field = 'question_type'
    
    def is_enabled_icon(self, obj):
        """Display enabled status with icon"""
        if obj.is_enabled:
            return format_html('<span style="color: green;">✓ Enabled</span>')
        return format_html('<span style="color: red;">✗ Disabled</span>')
    is_enabled_icon.short_description = 'Status'
    is_enabled_icon.admin_order_field = 'is_enabled'
    
    def save_model(self, request, obj, form, change):
        """Automatically set created_by field"""
        if not change:  # Only set on creation
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    actions = ['enable_selected', 'disable_selected']
    
    def enable_selected(self, request, queryset):
        """Bulk enable selected question types"""
        updated = queryset.update(is_enabled=True)
        self.message_user(request, f'{updated} question type(s) enabled.')
    enable_selected.short_description = 'Enable selected question types'
    
    def disable_selected(self, request, queryset):
        """Bulk disable selected question types"""
        updated = queryset.update(is_enabled=False)
        self.message_user(request, f'{updated} question type(s) disabled.')
    disable_selected.short_description = 'Disable selected question types'


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


# ==========================================
# GRADEBOOK ADMIN
# ==========================================

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    """Admin interface for grades"""
    
    list_display = (
        'id',
        'student_external_id',
        'course',
        'grade_type',
        'item_display',
        'marks_display',
        'percentage_display',
        'letter_grade_display',
        'graded_at'
    )
    
    list_filter = (
        'grade_type',
        'course',
        'graded_at',
    )
    
    search_fields = (
        'student_external_id',
        'course__title',
    )
    
    date_hierarchy = 'graded_at'
    
    readonly_fields = (
        'id',
        'percentage',
        'item_name_display',
        'letter_grade_display',
        'created_at',
        'updated_at'
    )
    
    fieldsets = (
        ('Student Information', {
            'fields': ('student_external_id', 'course')
        }),
        ('Graded Item', {
            'fields': ('grade_type', 'assignment_submission', 'quiz_attempt')
        }),
        ('Score', {
            'fields': ('marks', 'total_possible', 'percentage', 'letter_grade_display')
        }),
        ('Metadata', {
            'fields': ('graded_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def item_name_display(self, obj):
        """Display the graded item name"""
        return obj.item_name
    item_name_display.short_description = 'Item Name'
    
    def letter_grade_display(self, obj):
        """Display the letter grade"""
        return obj.letter_grade
    letter_grade_display.short_description = 'Letter Grade'
    
    def item_display(self, obj):
        """Display the graded item name"""
        return obj.item_name
    item_display.short_description = 'Item'
    
    def marks_display(self, obj):
        """Display marks as fraction"""
        return f"{obj.marks}/{obj.total_possible}"
    marks_display.short_description = 'Score'
    
    def percentage_display(self, obj):
        """Display percentage with formatting"""
        if obj.percentage is not None:
            return format_html(
                '<span style="font-weight: bold;">{:.2f}%</span>',
                obj.percentage
            )
        return "-"
    percentage_display.short_description = 'Percentage'
    
    def has_add_permission(self, request):
        """Prevent manual creation of grades through admin"""
        return False
    
    actions = ['recalculate_percentages']
    
    def recalculate_percentages(self, request, queryset):
        """Recalculate percentage for selected grades"""
        count = 0
        for grade in queryset:
            grade.save()  # This triggers percentage recalculation
            count += 1
        
        self.message_user(
            request,
            f"Successfully recalculated percentages for {count} grades."
        )
    recalculate_percentages.short_description = "Recalculate percentages"
