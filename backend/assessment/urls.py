"""
Assessment app URLs - Moodle-style Quiz System

URL patterns for assignments, question bank, quizzes, and attempts.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import apis

router = DefaultRouter()

# Assignment endpoints
router.register(r'assignments', apis.AssignmentViewSet, basename='assignment')
router.register(r'assignment-content', apis.AssignmentContentViewSet, basename='assignment-content')
router.register(r'assignment-submissions', apis.AssignmentSubmissionViewSet, basename='assignment-submission')
router.register(r'assignment-submission-files', apis.AssignmentSubmissionFileViewSet, basename='assignment-submission-file')

# Question bank endpoints
router.register(r'question-categories', apis.QuestionCategoryViewSet, basename='question-category')
router.register(r'questions', apis.QuestionViewSet, basename='question')

# Quiz endpoints
router.register(r'quizzes', apis.QuizViewSet, basename='quiz')
router.register(r'quiz-questions', apis.QuizQuestionViewSet, basename='quiz-question')
router.register(r'quiz-attempts', apis.QuizAttemptViewSet, basename='quiz-attempt')

urlpatterns = [
    path('', include(router.urls)),
]
