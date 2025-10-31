from django.urls import path
from .views import ApplicantSignupView, StaffSignupView, JWTLoginView, ApplicantProfileView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/applicant/', ApplicantSignupView.as_view(), name='signup-applicant'),
    path('signup/staff/', StaffSignupView.as_view(), name='signup-staff'),
    path('login/', JWTLoginView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('applicant/profile/', ApplicantProfileView.as_view(), name='applicant-profile'),
]
