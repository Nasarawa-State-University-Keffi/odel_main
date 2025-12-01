from django.urls import path
from .views import (
    DownloadApplicantsCSVView, 
    UploadAdmittedCSVView,
    ProgrammeListView,
    ApplicationUpdateView,
    ApplicationPreviewView,
    ApplicationSubmitView,
    MyApplicationView,
    MyApplicationsHistoryView,
)

urlpatterns = [
    # New Application endpoints
    path('programmes/', ProgrammeListView.as_view(), name='programmes-list'),
    path('my-application/', MyApplicationView.as_view(), name='my-application'),
    path('my-applications/history/', MyApplicationsHistoryView.as_view(), name='my-applications-history'),
    path('application/<int:application_id>/update/', ApplicationUpdateView.as_view(), name='application-update'),
    path('application/<int:application_id>/preview/', ApplicationPreviewView.as_view(), name='application-preview'),
    path('application/<int:application_id>/submit/', ApplicationSubmitView.as_view(), name='application-submit'),
    
    # Legacy endpoints
    path('download/applicants/', DownloadApplicantsCSVView.as_view(), name='download-applicants'),
    path('upload/admitted/', UploadAdmittedCSVView.as_view(), name='upload-admitted'),
]
