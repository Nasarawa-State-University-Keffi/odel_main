from django.urls import path
from . views import (
    AdminDashboardOverviewView,
    AdminStaffDirectoryView,
    AdminStudentDirectoryView,
    StudentDashboardView,
    InstructorDashboardView,
    StudentDetailDashboardView,
    InstructorDetailDashboardView,
)

urlpatterns = [
    path('admin/overview/', AdminDashboardOverviewView.as_view(), name='admin_dashboard_overview'),
    path('admin/staff/', AdminStaffDirectoryView.as_view(), name='admin_staff_directory'),
    path('admin/students/', AdminStudentDirectoryView.as_view(), name='admin_student_directory'),
    path("students/", StudentDashboardView.as_view(), name="student_dashboard"),
    path("students/<str:external_id>/", StudentDetailDashboardView.as_view(), name="student_detail_dashboard"),
    path("instructors/", InstructorDashboardView.as_view(), name="instructor_dashboard"),
    path("instructors/<str:external_id>/", InstructorDetailDashboardView.as_view(), name="instructor_detail_dashboard"),
]
