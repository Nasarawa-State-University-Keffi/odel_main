from django.urls import path
from . import apis

urlpatterns = [
    # Assignments
    path('assignments/', apis.StaffAssignmentListCreateView.as_view(), name='staff-assignment-list-create'),
    path('assignments/<uuid:pk>/', apis.StaffAssignmentDetailView.as_view(), name='staff-assignment-detail'),
    
    # Submissions
    path('submissions/', apis.StaffSubmissionListView.as_view(), name='staff-submission-list'),
    path('submissions/<uuid:pk>/', apis.StaffSubmissionDetailView.as_view(), name='staff-submission-detail'),
    path('submissions/<uuid:pk>/grade/', apis.StaffSubmissionGradeView.as_view(), name='staff-submission-grade'),
    
    # Question Bank
    path('question-bank/categories/', apis.StaffQuestionCategoryListCreateView.as_view(), name='staff-category-list-create'),
    path('question-bank/categories/<uuid:pk>/', apis.StaffQuestionCategoryDetailView.as_view(), name='staff-category-detail'),
    path('question-bank/questions/', apis.StaffQuestionListCreateView.as_view(), name='staff-question-list-create'),
    path('question-bank/questions/<uuid:pk>/', apis.StaffQuestionDetailView.as_view(), name='staff-question-detail'),
    
    # Quizzes
    path('quizzes/', apis.StaffQuizListCreateView.as_view(), name='staff-quiz-list-create'),
    path('quizzes/<uuid:pk>/', apis.StaffQuizDetailView.as_view(), name='staff-quiz-detail'),
    path('quizzes/questions/', apis.StaffQuizQuestionListCreateView.as_view(), name='staff-quiz-question-list-create'),
    path('quizzes/questions/<uuid:pk>/', apis.StaffQuizQuestionDetailView.as_view(), name='staff-quiz-question-detail'),
    
    # Quiz Attempts
    path('attempts/', apis.StaffQuizAttemptListView.as_view(), name='staff-attempt-list'),
    path('attempts/<uuid:pk>/', apis.StaffQuizAttemptDetailView.as_view(), name='staff-attempt-detail'),
    path('attempts/<uuid:pk>/questions/<uuid:question_attempt_id>/grade/', apis.StaffQuizManualGradeView.as_view(), name='staff-quiz-manual-grade'),
]
