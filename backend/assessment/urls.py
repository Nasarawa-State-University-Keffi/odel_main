"""
Assessment app URLs - Moodle-style Quiz System

URL patterns for assignments, question bank, quizzes, and attempts.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import apis

router = DefaultRouter()

# ==========================================
# STUDENT ENDPOINTS
# ==========================================

# Student - Assignments
router.register(r'student/assignments', apis.StudentAssignmentViewSet, basename='student-assignment')
router.register(r'student/assignment-submissions', apis.StudentAssignmentSubmissionViewSet, basename='student-assignment-submission')
router.register(r'student/assignment-submission-files', apis.StudentAssignmentSubmissionFileViewSet, basename='student-assignment-submission-file')

# Student - Quizzes
router.register(r'student/quizzes', apis.StudentQuizViewSet, basename='student-quiz')
router.register(r'student/quiz-attempts', apis.StudentQuizAttemptViewSet, basename='student-quiz-attempt')


# ==========================================
# STAFF ENDPOINTS
# ==========================================

# Staff - Assignments
router.register(r'staff/assignments', apis.StaffAssignmentViewSet, basename='staff-assignment')
router.register(r'staff/assignment-submissions', apis.StaffAssignmentSubmissionViewSet, basename='staff-assignment-submission')
router.register(r'staff/assignment-content', apis.StaffAssignmentContentViewSet, basename='staff-assignment-content')

# Staff - Quizzes
router.register(r'staff/quizzes', apis.StaffQuizViewSet, basename='staff-quiz')
router.register(r'staff/quiz-attempts', apis.StaffQuizAttemptViewSet, basename='staff-quiz-attempt')

# Staff - Question Bank
router.register(r'staff/question-categories', apis.StaffQuestionCategoryViewSet, basename='staff-question-category')
router.register(r'staff/question-type-availability', apis.StaffQuestionTypeAvailabilityViewSet, basename='staff-question-type-availability')
router.register(r'staff/questions', apis.StaffQuestionViewSet, basename='staff-question')
router.register(r'staff/quiz-questions', apis.StaffQuizQuestionViewSet, basename='staff-quiz-question')


# ==========================================
# DEPRECATED ENDPOINTS (Backward Compatibility) - REMOVED
# All deprecated endpoints have been removed. Use /student/ or /staff/ prefixed endpoints instead.
# ==========================================

# REMOVED: router.register(r'assignments', apis.AssignmentViewSet, basename='assignment')
# REMOVED: router.register(r'assignment-submissions', apis.AssignmentSubmissionViewSet, basename='assignment-submission')
# REMOVED: router.register(r'assignment-content', apis.AssignmentContentViewSet, basename='assignment-content')
# REMOVED: router.register(r'assignment-submission-files', apis.AssignmentSubmissionFileViewSet, basename='assignment-submission-file')
# REMOVED: router.register(r'question-categories', apis.QuestionCategoryViewSet, basename='question-category')
# REMOVED: router.register(r'questions', apis.QuestionViewSet, basename='question')
# REMOVED: router.register(r'quizzes', apis.QuizViewSet, basename='quiz')
# REMOVED: router.register(r'quiz-questions', apis.QuizQuestionViewSet, basename='quiz-question')
# REMOVED: router.register(r'quiz-attempts', apis.QuizAttemptViewSet, basename='quiz-attempt')

urlpatterns = [
    path('', include(router.urls)),
]
