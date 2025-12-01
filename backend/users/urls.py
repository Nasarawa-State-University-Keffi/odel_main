from django.urls import path
from .views import (
    ApplicantSignupView, 
    StaffSignupView, 
    JWTLoginView, 
    ApplicantProfileView,
    VerifyEmailView,
    ResendVerificationEmailView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('signup/applicant/', ApplicantSignupView.as_view(), name='signup-applicant'),
    path('signup/staff/', StaffSignupView.as_view(), name='signup-staff'),
    path('login/', JWTLoginView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend-verification'),
    path('applicant/profile/', ApplicantProfileView.as_view(), name='applicant-profile'),
]
