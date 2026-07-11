from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample


from courses.models import AcademicSession, CourseCache, Semester, StaffAssignedCourse, StudentRegisteredCourse
from assessment.models import Assignment, Quiz
from portal_auth.services import (
    get_or_sync_staff_registered_courses,
    get_or_sync_student_registered_courses,
    normalize_semester_name,
    normalize_session_name,
)
from .serializers import CourseSummarySerializer, QuizSummarySerializer, AssignmentSummarySerializer
from portal_auth.permissions import IsPortalStudent, IsPortalStaff


from drf_spectacular.utils import OpenApiParameter


def resolve_academic_period(session_name, semester_name):
    normalized_session = normalize_session_name(session_name)
    normalized_semester = normalize_semester_name(semester_name)
    session = AcademicSession.objects.filter(name__iexact=normalized_session).first()
    semester = Semester.objects.filter(name__iexact=normalized_semester).first()

    errors = {}
    if not session:
        errors['session'] = 'Unknown academic session'
    if not semester:
        errors['semester'] = 'Unknown semester'
    if errors:
        raise ValidationError(errors)

    return session.name, semester.name

class StudentDashboardView(APIView):
    """
    endpoint for retrieving student dashboard data for summary.
    GET /api/dashboard/student/
    """
    permission_classes = [IsAuthenticated, IsPortalStudent]

    @extend_schema(
        tags=["Student - Dashboard"],
        operation_id="get_student_dashboard",
        summary="Student Dashboard Summary",
        description="Returns a summary of the student's dashboard including courses, pending quizzes, and upcoming assignments.",
        parameters=[
            OpenApiParameter(
                name="session",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Session name, for example 2025/2026 (required)"
            ),
            OpenApiParameter(
                name="semester",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Semester name, for example First Semester (required)"
            ),
        ],
        responses={
            200: OpenApiResponse(
                description="Dashboard summary data",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            "total_courses": [
                                {"id": 1, "name": "Math 101"},
                                {"id": 2, "name": "Physics 201"}
                            ],
                            "total_courses_count": 2,
                            "pending_quizzes": [
                                {"id": 10, "title": "Quiz 1", "due_date": "2025-12-30T12:00:00Z"}
                            ],
                            "upcoming_assignments": [
                                {"id": 5, "title": "Assignment 1", "due_date": "2025-12-29T23:59:59Z"}
                            ]
                        },
                    )
                ]
            )
        }
    )
    def get(self, request):
        
        user = request.user
        session = request.query_params.get("session")
        semester = request.query_params.get("semester")

        if not session or not semester:
            return Response(
                {"detail": "session and semester are required"},
                status=400
            )

        session, semester = resolve_academic_period(session, semester)

        get_or_sync_student_registered_courses(
            student_external_id=user.external_id,
            session=session,
            semester=semester,
        )

           # 2️⃣ Fetch enrolled courses
        enrollments = StudentRegisteredCourse.objects.select_related("course").filter(
            student_external_id=user.external_id,
            session=session,
            semester=semester,
        )
        courses = [e.course for e in enrollments]
        course_ids = [c.id for c in courses]

          # 3️⃣ Fetch course-scoped quizzes & assignments
        now = timezone.now()

        pending_quizzes = Quiz.objects.filter(
            course_id__in=course_ids,
            time_close__gt=now,
        )

        upcoming_assignments = Assignment.objects.filter(
            course_id__in=course_ids,
            due_at__gt=now,
            is_published=True,
        )
  
        data = {
            "user": {
                "full_name": user.full_name,
                "email": user.email,
                "level": user.level,
                "roles": user.roles,
                "profile_picture": user.profile_picture,
            },
            "courses": CourseSummarySerializer(courses, many=True).data,
            "course_count": len(courses),
            "pending_quizzes": QuizSummarySerializer(pending_quizzes, many=True).data,
            "upcoming_assignments": AssignmentSummarySerializer(
                upcoming_assignments, many=True
            ).data,
        }
        return Response(status=200, data=data)


class InstructorDashboardView(APIView):
    """
    endpoint for retrieving instructor dashboard data for summary.
    GET /api/dashboard/instructor/
    """
    permission_classes = [IsAuthenticated, IsPortalStaff]

    @extend_schema(
        tags=["Staff - Dashboard"],
        operation_id="get_instructor_dashboard",
        summary="Instructor Dashboard Summary",
        description="Returns a summary of the instructor's dashboard including courses, assignments, and quizzes.",
        parameters=[
            OpenApiParameter(
                name="programme_type_code",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Programme type code, for example UG (required)"
            ),
        ],
        responses={
            200: OpenApiResponse(
                description="Dashboard summary data",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            "total_courses": [
                                {"id": 1, "name": "Math 101"}
                            ],
                            "total_courses_count": 1,
                            "total_assignments": [
                                {"id": 5, "title": "Assignment 1"}
                            ],
                            "total_assignments_count": 1,
                            "total_quizzes": [
                                {"id": 10, "title": "Quiz 1"}
                            ],
                            "total_quizzes_count": 1
                        },
                    )
                ]
            )
        }
    )
    def get(self, request):
        programme_type_code = request.query_params.get("programme_type_code")
        session = request.query_params.get("session")
        semester = request.query_params.get("semester")
        user = request.user

        if not programme_type_code:
            return Response({"detail": "programme_type_code is required"}, status=400)
        if bool(session) != bool(semester):
            return Response({"detail": "session and semester must be supplied together"}, status=400)
        if session and semester:
            session, semester = resolve_academic_period(session, semester)

        get_or_sync_staff_registered_courses(
            staff_external_id=user.external_id,
            programme_type_code=programme_type_code,
            session=session,
            semester=semester,
        )

        course_assigned = StaffAssignedCourse.objects.filter(
            staff_external_id=user.external_id,
            programme_type_code=programme_type_code.upper(),
        )
        courses = [e.course for e in course_assigned]
        course_ids = [c.id for c in courses]

          # 3️⃣ Fetch course-scoped quizzes & assignments
        now = timezone.now()

        total_assignments = Assignment.objects.filter(course_id__in=course_ids)
        total_quizzes = Quiz.objects.filter(course_id__in=course_ids)
        data = {
            "total_courses": CourseSummarySerializer(courses, many=True).data,
            "total_courses_count": len(courses),
            "total_assignments": AssignmentSummarySerializer(total_assignments, many=True).data,
            "total_assignments_count": total_assignments.count(),
            "total_quizzes": QuizSummarySerializer(total_quizzes, many=True).data,
            "total_quizzes_count": total_quizzes.count(),
        }
        return Response(status=200, data=data)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from dashboard.serializers import CourseSummarySerializer, QuizSummarySerializer, AssignmentSummarySerializer
from portal_auth.services import get_or_sync_student_registered_courses, get_or_sync_staff_registered_courses
from courses.models import StudentRegisteredCourse, StaffAssignedCourse
from assessment.models import Quiz, Assignment
from django.utils import timezone
from portal_auth.permissions import IsPortalStaff

class StudentDetailDashboardView(APIView):
    """
    Endpoint for retrieving a specific student's dashboard data.
    GET /api/dashboard/students/<external_id>/
    """
    permission_classes = [IsAuthenticated, IsPortalStaff]
    
    @extend_schema(
        tags=["Staff - Dashboard"],
        operation_id="get_student_detail_dashboard",
        responses={
            200: OpenApiResponse(
                description="Student Detail Dashboard summary data",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            "courses": [
                                {"id": 1, "name": "Math 101"}
                            ],
                            "course_count": 1,
                            "pending_quizzes": [
                                {"id": 10, "title": "Quiz 1"}
                            ],
                            "upcoming_assignments": [
                                {"id": 5, "title": "Assignment 1"}
                            ]
                        },
                    )
                ]
            )
        }
    )
    def get(self, request, external_id):
        session = request.query_params.get("session")
        semester = request.query_params.get("semester")

        if not session or not semester:
            return Response(
                {"detail": "session and semester are required"},
                status=400
            )

        session, semester = resolve_academic_period(session, semester)

        get_or_sync_student_registered_courses(
            student_external_id=external_id,
            session=session,
            semester=semester,
        )

        enrollments = StudentRegisteredCourse.objects.select_related("course").filter(
            student_external_id=external_id,
            session=session,
            semester=semester,
        )
        courses = [e.course for e in enrollments]
        course_ids = [c.id for c in courses]

        now = timezone.now()
        pending_quizzes = Quiz.objects.filter(
            course_id__in=course_ids,
            end_time__gt=now
        )
        upcoming_assignments = Assignment.objects.filter(
            course_id__in=course_ids,
            due_date__gt=now
        )

        data = {
            "courses": CourseSummarySerializer(courses, many=True).data,
            "course_count": len(courses),
            "pending_quizzes": QuizSummarySerializer(pending_quizzes, many=True).data,
            "upcoming_assignments": AssignmentSummarySerializer(upcoming_assignments, many=True).data,
        }
        return Response(status=200, data=data)


class InstructorDetailDashboardView(APIView):
    """
    Endpoint for retrieving a specific instructor's dashboard data.
    GET /api/dashboard/instructors/<external_id>/
    """
    permission_classes = [IsAuthenticated, IsPortalStaff]
    
    @extend_schema(
        tags=["Staff - Dashboard"],
        operation_id="get_instructor_detail_dashboard",
        responses={
            200: OpenApiResponse(
                description="Instructor Detail Dashboard summary data",
                examples=[
                    OpenApiExample(
                        'Example Response',
                        value={
                            "total_courses": [
                                {"id": 1, "name": "Math 101"}
                            ],
                            "total_courses_count": 1,
                            "total_assignments": [
                                {"id": 5, "title": "Assignment 1"}
                            ],
                            "total_assignments_count": 1,
                            "total_quizzes": [
                                {"id": 10, "title": "Quiz 1"}
                            ],
                            "total_quizzes_count": 1
                        },
                    )
                ]
            )
        }
    )
    def get(self, request, external_id):
        programme_type_code = request.query_params.get("programme_type_code")
        session = request.query_params.get("session")
        semester = request.query_params.get("semester")

        if not programme_type_code:
            return Response({"detail": "programme_type_code is required"}, status=400)
        if bool(session) != bool(semester):
            return Response({"detail": "session and semester must be supplied together"}, status=400)
        if session and semester:
            session, semester = resolve_academic_period(session, semester)
        
        get_or_sync_staff_registered_courses(
            staff_external_id=external_id,
            programme_type_code=programme_type_code,
            session=session,
            semester=semester,
        )

        course_assigned = StaffAssignedCourse.objects.filter(
            staff_external_id=external_id,
            programme_type_code=programme_type_code.upper(),
        )
        courses = [e.course for e in course_assigned]
        course_ids = [c.id for c in courses]

        total_assignments = Assignment.objects.filter(course_id__in=course_ids)
        total_quizzes = Quiz.objects.filter(course_id__in=course_ids)

        data = {
            "total_courses": CourseSummarySerializer(courses, many=True).data,
            "total_courses_count": len(courses),
            "total_assignments": AssignmentSummarySerializer(total_assignments, many=True).data,
            "total_assignments_count": total_assignments.count(),
            "total_quizzes": QuizSummarySerializer(total_quizzes, many=True).data,
            "total_quizzes_count": total_quizzes.count(),
        }
        return Response(status=200, data=data)
