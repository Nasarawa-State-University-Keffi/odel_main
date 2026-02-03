"""
Assessment app URLs - Moodle-style Quiz System

URL patterns for assignments, question bank, quizzes, and attempts.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import apis

urlpatterns = [
    # Explicitly separate routes for student and staff
    path('student/', include('assessment.student_urls')),
    path('staff/', include('assessment.staff_urls')),
]

