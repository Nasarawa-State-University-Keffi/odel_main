from django.urls import path
from .views import ListApplicantsView, ListAdmittedStudentsView

urlpatterns = [
    path('applicants/', ListApplicantsView.as_view(), name='staff-applicants'),
    path('admitted/', ListAdmittedStudentsView.as_view(), name='staff-admitted'),
]
