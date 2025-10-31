from django.urls import path
from .views import DownloadApplicantsCSVView, UploadAdmittedCSVView

urlpatterns = [
    path('download/applicants/', DownloadApplicantsCSVView.as_view(), name='download-applicants'),
    path('upload/admitted/', UploadAdmittedCSVView.as_view(), name='upload-admitted'),
]
