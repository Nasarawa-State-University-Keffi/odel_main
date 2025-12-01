from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('applicant', 'Applicant'),
        ('student', 'Student'),
        ('staff', 'Staff'),
    )
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='applicant')
    email = models.EmailField(unique=True, blank=False)
    middle_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    country = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    is_email_verified = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']


class EmailVerificationToken(models.Model):
    """Separate model for email verification tokens"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='verification_token')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'Token for {self.user.email}'
    
    def is_expired(self):
        """Check if token is older than 24 hours"""
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(hours=24)


class Applicant(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('admitted', 'Admitted'),
        ('rejected', 'Rejected'),
    )
    
    MODE_OF_ENTRY_CHOICES = (
        ('100', '100 Level'),
        ('200', '200 Level'),
        ('300', '300 Level'),
    )
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applicant_profile')
    applicant_id = models.CharField(max_length=32, unique=True, editable=False)
    programme_choice = models.CharField(max_length=128, blank=True)
    mode_of_entry = models.CharField(max_length=10, choices=MODE_OF_ENTRY_CHOICES, default='100', help_text='Entry level (100, 200, or 300)')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.applicant_id} - {self.user.get_full_name() or self.user.email}'
    
    def save(self, *args, **kwargs):
        if not self.applicant_id:
            from users.utils import generate_applicant_id
            self.applicant_id = generate_applicant_id()
        super().save(*args, **kwargs)


class Student(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    matric_no = models.CharField(max_length=32, unique=True)
    programme = models.CharField(max_length=128)

    def __str__(self):
        return f'{self.matric_no} - {self.user.get_full_name() or self.user.username}'


class Staff(models.Model):
    ROLE = (
        ('facilitator', 'Facilitator'),
        ('coordinator', 'Coordinator'),
        ('admin', 'Admin'),
        ('admission_officer', 'Admission Officer'),
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.CharField(max_length=32, choices=ROLE)

    def __str__(self):
        return f'{self.user.username} - {self.role}'
