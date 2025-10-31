from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
import random


def generate_applicant_id() -> str:
    return f'odel{random.randint(10000, 99999)}'


class User(AbstractUser):
    ROLE_CHOICES = (
        ('applicant', 'Applicant'),
        ('student', 'Student'),
        ('staff', 'Staff'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='applicant')


class Applicant(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applicant_profile')
    applicant_id = models.CharField(max_length=32, unique=True, default=generate_applicant_id)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    programme_choice = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=32, default='pending')  # pending, admitted, rejected

    def __str__(self):
        return f'{self.applicant_id} - {self.user.get_full_name() or self.user.username}'


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
