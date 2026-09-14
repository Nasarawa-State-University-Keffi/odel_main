from django.urls import path
from . import apis

urlpatterns = [
    # Assignments
    path('assignments/', apis.StudentAssignmentListView.as_view(), name='student-assignment-list'),
    path('assignments/<uuid:pk>/', apis.StudentAssignmentDetailView.as_view(), name='student-assignment-detail'),
    
    # Submissions
    path('submissions/', apis.StudentSubmissionListView.as_view(), name='student-submission-list'),
    path('submissions/create/', apis.StudentSubmissionCreateView.as_view(), name='student-submission-create'),
    path('submissions/<uuid:pk>/', apis.StudentSubmissionDetailView.as_view(), name='student-submission-detail'),
    path('submissions/<uuid:pk>/submit/', apis.StudentSubmissionSubmitView.as_view(), name='student-submission-submit'),
    
    # Quizzes
    path('quizzes/', apis.StudentQuizListView.as_view(), name='student-quiz-list'),
    path('quizzes/<uuid:pk>/', apis.StudentQuizDetailView.as_view(), name='student-quiz-detail'),
    path('quizzes/<uuid:pk>/start/', apis.StudentQuizStartView.as_view(), name='student-quiz-start'),
    
    # Quiz Attempts
    path('attempts/', apis.StudentAttemptListView.as_view(), name='student-attempt-list'),
    path('attempts/<uuid:pk>/', apis.StudentAttemptDetailView.as_view(), name='student-attempt-detail'),
    path('quizzes/<uuid:pk>/attempts/<uuid:attempt_id>/submit/', apis.StudentQuizSubmitResponseView.as_view(), name='student-quiz-submit-response'),
    path('quizzes/<uuid:pk>/attempts/<uuid:attempt_id>/finish/', apis.StudentQuizFinishView.as_view(), name='student-quiz-finish'),

    # Auto-graded assessments
    path('assessments/', apis.StudentAssessmentListView.as_view(), name='student-assessment-list'),
    path('assessments/<uuid:pk>/', apis.StudentAssessmentDetailView.as_view(), name='student-assessment-detail'),
    path('assessments/<uuid:pk>/start/', apis.StudentAssessmentStartView.as_view(), name='student-assessment-start'),
    path('assessments/<uuid:pk>/attempts/<uuid:attempt_id>/submit/', apis.StudentAssessmentSubmitResponseView.as_view(), name='student-assessment-submit-response'),
    path('assessments/<uuid:pk>/attempts/<uuid:attempt_id>/finish/', apis.StudentAssessmentFinishView.as_view(), name='student-assessment-finish'),
    path('assessment-attempts/', apis.StudentAssessmentAttemptListView.as_view(), name='student-assessment-attempt-list'),
    path('assessment-attempts/<uuid:pk>/', apis.StudentAssessmentAttemptDetailView.as_view(), name='student-assessment-attempt-detail'),
]
