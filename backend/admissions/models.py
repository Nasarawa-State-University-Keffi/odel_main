from django.db import models
from django.conf import settings
from users.models import Applicant
from programmes.models import Programme
from core.logging import get_logger

logger = get_logger(__name__)


class Application(models.Model):
    """Main application model for applicants"""
    
    MODE_OF_ENTRY_CHOICES = (
        ('100', '100 Level'),
        ('200', '200 Level'),
        ('300', '300 Level'),
    )
    
    SITTING_TYPE_CHOICES = (
        ('one', 'One Sitting'),
        ('two', 'Two Sittings'),
    )
    
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('verified', 'Verified'),
        ('failed_verification', 'Failed Verification'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    application_id = models.CharField(max_length=32, unique=True, editable=False, blank=True)
    is_active = models.BooleanField(default=True)
    applicant = models.ForeignKey(
    Applicant,
    on_delete=models.CASCADE,
    related_name='applications'
)
    session = models.CharField(max_length=20, help_text="e.g., 2024/2025")
    programme = models.ForeignKey(
        Programme, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='applications'
    )
    mode_of_entry = models.CharField(
        max_length=10, 
        choices=MODE_OF_ENTRY_CHOICES,
        help_text="Entry level (100, 200, or 300)"
    )
    sitting_type = models.CharField(
        max_length=10, 
        choices=SITTING_TYPE_CHOICES, 
        default='one'
    )
    status = models.CharField(
        max_length=30, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['applicant', 'is_active']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['applicant'],
                condition=models.Q(is_active=True),
                name='unique_active_application_per_applicant'
            )
        ]
    
    def __str__(self):
        return f"{self.application_id} - {self.applicant.applicant_id} - {self.status}"
    
    def save(self, *args, **kwargs):
        # Generate application_id if not exists
        if not self.application_id:
            from users.utils import generate_application_id
            self.application_id = generate_application_id()
        
        # Ensure only one active application per applicant
        if self.is_active:
            # Deactivate all other applications for this applicant
            Application.objects.filter(
                applicant=self.applicant,
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)
            
            logger.info(
                f"Deactivated previous applications for applicant "
                f"{self.applicant.applicant_id} - New active: {self.application_id}"
            )
        
        super().save(*args, **kwargs)
    
    def is_complete(self):
        """
        Validate if application is complete and ready for submission
        Returns: (is_valid: bool, errors: list)
        """
        errors = []
        
        # Check required applicant fields
        user = self.applicant.user
        required_user_fields = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': user.phone,
            'gender': user.gender,
            'country': user.country,
            'state': user.state,
        }
        
        for field, value in required_user_fields.items():
            if not value:
                errors.append(f"Applicant {field.replace('_', ' ')} is required")
        
        # Check programme selection
        if not self.programme:
            errors.append("Programme selection is required")
        
        # Check mode of entry
        if not self.mode_of_entry:
            errors.append("Mode of entry is required")
        
        # Check exam results based on sitting type
        exam_results = self.exam_results.all()
        expected_sittings = 1 if self.sitting_type == 'one' else 2
        
        if exam_results.count() != expected_sittings:
            errors.append(
                f"Expected {expected_sittings} exam result(s), "
                f"but found {exam_results.count()}"
            )
        
        # Validate each exam result
        for result in exam_results:
            result_errors = result.validate()
            if result_errors:
                errors.extend([
                    f"Sitting {result.sitting_number}: {err}" 
                    for err in result_errors
                ])
        
        return (len(errors) == 0, errors)


class ExamResult(models.Model):
    """O'Level exam results (WAEC, NECO, etc.)"""
    
    EXAM_TYPE_CHOICES = (
        ('WAEC', 'WAEC'),
        ('NECO', 'NECO'),
        ('GCE', 'GCE'),
        ('NECO_GCE', 'NECO GCE'),
    )
    
    application = models.ForeignKey(
        Application, 
        on_delete=models.CASCADE, 
        related_name='exam_results'
    )
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    exam_year = models.IntegerField(help_text="Year exam was taken")
    exam_number = models.CharField(
        max_length=50, 
        help_text="Examination number"
    )
    scratch_card_pin = models.CharField(
        max_length=50, 
        blank=True,
        help_text="Scratch card PIN for verification"
    )
    sitting_number = models.IntegerField(
        choices=((1, 'First Sitting'), (2, 'Second Sitting')),
        default=1
    )
    
    # Verification status
    is_verified = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=100, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['sitting_number']
        unique_together = ['application', 'sitting_number']
    
    def __str__(self):
        return (
            f"{self.exam_type} - {self.exam_year} - "
            f"Sitting {self.sitting_number}"
        )
    
    def validate(self):
        """Validate exam result completeness"""
        errors = []
        
        # Check required fields
        if not self.exam_number:
            errors.append("Exam number is required")
        if not self.exam_year:
            errors.append("Exam year is required")
        
        # Check minimum subjects (at least 6)
        subject_count = self.exam_subjects.count()
        if subject_count < 6:
            errors.append(
                f"Minimum 6 subjects required, but only {subject_count} provided"
            )
        
        # Validate each subject
        for subject in self.exam_subjects.all():
            if not subject.subject or not subject.grade:
                errors.append("All subjects must have subject name and grade")
        
        return errors


class ExamSubject(models.Model):
    """Individual subject within an exam result"""
    
    GRADE_CHOICES = (
        ('A1', 'A1 - Excellent'),
        ('B2', 'B2 - Very Good'),
        ('B3', 'B3 - Good'),
        ('C4', 'C4 - Credit'),
        ('C5', 'C5 - Credit'),
        ('C6', 'C6 - Credit'),
        ('D7', 'D7 - Pass'),
        ('E8', 'E8 - Pass'),
        ('F9', 'F9 - Fail'),
    )
    
    exam_result = models.ForeignKey(
        ExamResult, 
        on_delete=models.CASCADE, 
        related_name='exam_subjects'
    )
    subject = models.CharField(max_length=100)
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['subject']
    
    def __str__(self):
        return f"{self.subject} - {self.grade}"
    
    def is_credit_pass(self):
        """Check if grade is C6 or better"""
        credit_grades = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6']
        return self.grade in credit_grades
