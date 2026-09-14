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
    path('question-bank/categories/<uuid:pk>/copy-from-assessment/', apis.StaffCopyAssessmentQuestionsView.as_view(), name='staff-category-copy-from-assessment'),
    path('question-bank/categories/<uuid:pk>/', apis.StaffQuestionCategoryDetailView.as_view(), name='staff-category-detail'),
    path('question-bank/questions/', apis.StaffQuestionListCreateView.as_view(), name='staff-question-list-create'),
    path('question-bank/questions/<uuid:pk>/', apis.StaffQuestionDetailView.as_view(), name='staff-question-detail'),

    # Assessment question bank (kept separate from the quiz bank)
    path('assessment-question-bank/categories/', apis.StaffAssessmentQuestionCategoryListCreateView.as_view(), name='staff-assessment-category-list-create'),
    path('assessment-question-bank/categories/<uuid:pk>/', apis.StaffAssessmentQuestionCategoryDetailView.as_view(), name='staff-assessment-category-detail'),
    path('assessment-question-bank/questions/', apis.StaffAssessmentBankQuestionListCreateView.as_view(), name='staff-assessment-bank-question-list-create'),
    path('assessment-question-bank/questions/<uuid:pk>/', apis.StaffAssessmentBankQuestionDetailView.as_view(), name='staff-assessment-bank-question-detail'),
    
    # Quizzes
    path('quizzes/', apis.StaffQuizListCreateView.as_view(), name='staff-quiz-list-create'),
    path('quizzes/<uuid:pk>/', apis.StaffQuizDetailView.as_view(), name='staff-quiz-detail'),
    path('quizzes/<uuid:pk>/gradebook/', apis.StaffQuizGradebookView.as_view(), name='staff-quiz-gradebook'),
    path('quizzes/questions/', apis.StaffQuizQuestionListCreateView.as_view(), name='staff-quiz-question-list-create'),
    path('quizzes/questions/<uuid:pk>/', apis.StaffQuizQuestionDetailView.as_view(), name='staff-quiz-question-detail'),

    # Auto-graded assessments
    path('assessments/build/', apis.StaffAssessmentBuildView.as_view(), name='staff-assessment-build'),
    path('assessments/', apis.StaffAssessmentListCreateView.as_view(), name='staff-assessment-list-create'),
    path('assessments/<uuid:pk>/', apis.StaffAssessmentDetailView.as_view(), name='staff-assessment-detail'),
    path('assessments/questions/', apis.StaffAssessmentQuestionListCreateView.as_view(), name='staff-assessment-question-list-create'),
    path('assessments/questions/<uuid:pk>/', apis.StaffAssessmentQuestionDetailView.as_view(), name='staff-assessment-question-detail'),
    path('assessment-attempts/', apis.StaffAssessmentAttemptListView.as_view(), name='staff-assessment-attempt-list'),
    path('assessment-attempts/<uuid:pk>/', apis.StaffAssessmentAttemptDetailView.as_view(), name='staff-assessment-attempt-detail'),
    
    # Quiz Attempts
    path('attempts/', apis.StaffQuizAttemptListView.as_view(), name='staff-attempt-list'),
    path('attempts/<uuid:pk>/', apis.StaffQuizAttemptDetailView.as_view(), name='staff-attempt-detail'),
    path('attempts/<uuid:pk>/questions/<uuid:question_attempt_id>/grade/', apis.StaffQuizManualGradeView.as_view(), name='staff-quiz-manual-grade'),
    
    # Exports
    path('assignments/<uuid:pk>/export/', apis.StaffAssignmentExportView.as_view(), name='staff-assignment-export'),
    path('quizzes/<uuid:pk>/export/', apis.StaffQuizExportView.as_view(), name='staff-quiz-export'),
]
