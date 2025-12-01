from django.contrib import admin
from .models import Application, ExamResult, ExamSubject


class ExamSubjectInline(admin.TabularInline):
    """Inline admin for exam subjects"""
    model = ExamSubject
    extra = 1
    fields = ('subject', 'grade', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    """Admin for ExamResult with inline subjects"""
    list_display = (
        'id', 'application', 'exam_type', 'exam_year', 
        'exam_number', 'sitting_number', 'is_verified', 'created_at'
    )
    list_filter = ('exam_type', 'exam_year', 'is_verified', 'sitting_number')
    search_fields = ('exam_number', 'application__applicant__applicant_id')
    readonly_fields = (
        'is_verified', 'verification_status', 'verified_at', 
        'created_at', 'updated_at'
    )
    inlines = [ExamSubjectInline]
    
    fieldsets = (
        ('Exam Information', {
            'fields': (
                'application', 'exam_type', 'exam_year', 
                'exam_number', 'scratch_card_pin', 'sitting_number'
            )
        }),
        ('Verification Status', {
            'fields': (
                'is_verified', 'verification_status', 'verified_at'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ExamResultInline(admin.StackedInline):
    """Inline admin for exam results in Application"""
    model = ExamResult
    extra = 0
    fields = (
        'exam_type', 'exam_year', 'exam_number', 
        'scratch_card_pin', 'sitting_number', 
        'is_verified', 'verification_status'
    )
    readonly_fields = ('is_verified', 'verification_status')
    show_change_link = True


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    """Admin for Application with inline exam results"""
    list_display = (
        'application_id', 'applicant', 'session', 'programme', 
        'mode_of_entry', 'sitting_type', 'status', 
        'is_active', 'is_complete_display', 'submitted_at', 'created_at'
    )
    list_filter = (
        'status', 'is_active', 'mode_of_entry', 'sitting_type', 
        'session', 'programme'
    )
    search_fields = (
        'application_id',
        'applicant__applicant_id', 
        'applicant__user__email',
        'applicant__user__first_name',
        'applicant__user__last_name'
    )
    readonly_fields = (
        'application_id', 'created_at', 'updated_at', 'submitted_at', 
        'is_complete_display', 'completeness_errors'
    )
    inlines = [ExamResultInline]
    actions = ['deactivate_applications']
    
    fieldsets = (
        ('Application ID', {
            'fields': ('application_id',)
        }),
        ('Applicant Information', {
            'fields': ('applicant',)
        }),
        ('Application Details', {
            'fields': (
                'session', 'programme', 'mode_of_entry', 'sitting_type'
            )
        }),
        ('Status', {
            'fields': (
                'status', 'is_active', 'is_complete_display', 'completeness_errors'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'submitted_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_complete_display(self, obj):
        """Display application completeness status"""
        is_complete, _ = obj.is_complete()
        return "✅ Complete" if is_complete else "❌ Incomplete"
    is_complete_display.short_description = 'Completeness'
    
    def completeness_errors(self, obj):
        """Display validation errors"""
        _, errors = obj.is_complete()
        if errors:
            return "\n".join(f"• {error}" for error in errors)
        return "No errors - application is complete"
    completeness_errors.short_description = 'Validation Errors'
    
    def deactivate_applications(self, request, queryset):
        """Admin action to deactivate selected applications"""
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} application(s) deactivated successfully.')
    deactivate_applications.short_description = 'Deactivate selected applications'


@admin.register(ExamSubject)
class ExamSubjectAdmin(admin.ModelAdmin):
    """Admin for ExamSubject"""
    list_display = ('id', 'exam_result', 'subject', 'grade', 'created_at')
    list_filter = ('grade', 'subject')
    search_fields = (
        'subject', 
        'exam_result__exam_number',
        'exam_result__application__applicant__applicant_id'
    )
    readonly_fields = ('created_at',)
