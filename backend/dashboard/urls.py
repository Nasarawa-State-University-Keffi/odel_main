from django.urls import path
from . views import StudentDashboardView, InstructorDashboardView, StudentDetailDashboardView, InstructorDetailDashboardView

urlpatterns = [
    path("students/", StudentDashboardView.as_view(), name="student_dashboard"),
    path("students/<str:external_id>/", StudentDetailDashboardView.as_view(), name="student_detail_dashboard"),
    path("instructors/", InstructorDashboardView.as_view(), name="instructor_dashboard"),
    path("instructors/<str:external_id>/", InstructorDetailDashboardView.as_view(), name="instructor_detail_dashboard"),
]