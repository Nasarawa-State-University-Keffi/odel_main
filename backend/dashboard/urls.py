from django.urls import path
from . views import StudentDashboardView, InstructorDashboardView

urlpatterns = [
    path("students/", StudentDashboardView.as_view(), name="student_dashboard"),
    path("instructors/", InstructorDashboardView.as_view(), name="instructor_dashboard"),
]