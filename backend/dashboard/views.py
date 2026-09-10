import logging

from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample


from courses.models import CourseCache, StaffAssignedCourse, StudentRegisteredCourse
from courses.services import resolve_academic_period
from assessment.models import Assignment, AssignmentSubmission, Quiz
from portal_auth.services import (
    get_or_sync_staff_registered_courses,
    get_or_sync_student_registered_courses,
)
from .serializers import (
    AssignmentSummarySerializer,
    CourseSummarySerializer,
    QuizSummarySerializer,
    TeachingAssignmentSummarySerializer,
)
from portal_auth.permissions import IsPortalStudent, IsPortalStaff


from drf_spectacular.utils import OpenApiParameter

logger = logging.getLogger(__name__)


class StudentDashboardView(APIView):
    """
    endpoint for retrieving student dashboard data for summary.
    GET /api/dashboard/students/
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
                            "user": {
                                "full_name": "Student One",
                                "email": "student@example.edu.ng",
                                "level": "400",
                                "roles": ["PORTAL_STUDENTS"],
                                "profile_picture": None,
                            },
                            "courses": [
                                {
                                    "course_external_id": 101,
                                    "course_code": "MTH101",
                                    "course_title": "Mathematics I",
                                }
                            ],
                            "course_count": 1,
                            "pending_quizzes": [
                                {"id": "550e8400-e29b-41d4-a716-446655440000", "name": "Quiz 1", "time_close": "2026-12-30T12:00:00Z"}
                            ],
                            "upcoming_assignments": [
                                {"id": "550e8400-e29b-41d4-a716-446655440001", "title": "Assignment 1", "due_at": "2026-12-29T23:59:59Z"}
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
            is_published=True,
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
            "courses": CourseSummarySerializer(
                courses,
                many=True,
                context={'request': request},
            ).data,
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
            OpenApiParameter(
                name="session",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Academic session, for example 2025/2026 (required)"
            ),
            OpenApiParameter(
                name="semester",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Semester, for example First Semester (required)"
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

        logger.info(
            "Instructor dashboard request received staff_external_id=%r "
            "query_params=%s",
            user.external_id,
            dict(request.query_params.lists()),
        )
        if not programme_type_code:
            logger.warning(
                "Instructor dashboard request rejected staff_external_id=%r "
                "reason=missing_programme_type_code query_params=%s",
                user.external_id,
                dict(request.query_params.lists()),
            )
            return Response({"detail": "programme_type_code is required"}, status=400)
        if not session or not semester:
            missing_params = [
                name
                for name, value in (("session", session), ("semester", semester))
                if not value
            ]
            logger.warning(
                "Instructor dashboard request rejected staff_external_id=%r "
                "reason=missing_academic_period missing_params=%s query_params=%s",
                user.external_id,
                missing_params,
                dict(request.query_params.lists()),
            )
            return Response({"detail": "session and semester are required"}, status=400)
        session, semester = resolve_academic_period(session, semester)

        logger.info(
            "Starting instructor course synchronization staff_external_id=%r "
            "programme_type_code=%r session=%r semester=%r",
            user.external_id,
            programme_type_code,
            session,
            semester,
        )
        teaching_assignments = get_or_sync_staff_registered_courses(
            staff_external_id=user.external_id,
            programme_type_code=programme_type_code,
            session=session,
            semester=semester,
        )
        logger.info(
            "Instructor course synchronization completed staff_external_id=%r "
            "course_count=%d",
            user.external_id,
            len(teaching_assignments),
        )

        teaching_assignments = list(
            StaffAssignedCourse.objects.filter(
                pk__in=[assignment.pk for assignment in teaching_assignments],
            ).select_related(
                'course',
                'course_offering__session',
                'course_offering__semester',
            )
        )
        courses = [assignment.course for assignment in teaching_assignments]
        course_ids = [c.id for c in courses]

          # 3️⃣ Fetch course-scoped quizzes & assignments
        now = timezone.now()

        total_assignments = Assignment.objects.filter(course_id__in=course_ids)
        total_quizzes = Quiz.objects.filter(course_id__in=course_ids)
        pending_grading = AssignmentSubmission.objects.filter(
            assignment__course_id__in=course_ids,
            status='submitted',
        )
        active_quizzes = total_quizzes.filter(
            time_open__lte=now,
            time_close__gt=now,
        )
        data = {
            "context": {
                "programme_type_code": programme_type_code.upper(),
                "session": session,
                "semester": semester,
            },
            "total_courses": TeachingAssignmentSummarySerializer(
                teaching_assignments,
                many=True,
            ).data,
            "total_courses_count": len(courses),
            "total_assignments": AssignmentSummarySerializer(total_assignments, many=True).data,
            "total_assignments_count": total_assignments.count(),
            "total_quizzes": QuizSummarySerializer(total_quizzes, many=True).data,
            "total_quizzes_count": total_quizzes.count(),
            "pending_grading_count": pending_grading.count(),
            "active_quizzes_count": active_quizzes.count(),
        }
        logger.info(
            "Instructor dashboard response ready staff_external_id=%r "
            "programme_type_code=%r session=%r semester=%r course_count=%d "
            "assignment_count=%d quiz_count=%d",
            user.external_id,
            programme_type_code.upper(),
            session,
            semester,
            data["total_courses_count"],
            data["total_assignments_count"],
            data["total_quizzes_count"],
        )
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
                                {
                                    "course_external_id": 101,
                                    "course_code": "MTH101",
                                    "course_title": "Mathematics I",
                                }
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
            is_published=True,
            time_close__gt=now,
        )
        upcoming_assignments = Assignment.objects.filter(
            course_id__in=course_ids,
            due_at__gt=now,
            is_published=True,
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
        parameters=[
            OpenApiParameter(
                name="programme_type_code",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Programme type code, for example UG (required)"
            ),
            OpenApiParameter(
                name="session",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Academic session, for example 2025/2026 (required)"
            ),
            OpenApiParameter(
                name="semester",
                type=str,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Semester, for example First Semester (required)"
            ),
        ],
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

        logger.info(
            "Instructor detail dashboard request received requester_external_id=%r "
            "target_external_id=%r query_params=%s",
            request.user.external_id,
            external_id,
            dict(request.query_params.lists()),
        )
        if not programme_type_code:
            logger.warning(
                "Instructor detail dashboard request rejected target_external_id=%r "
                "reason=missing_programme_type_code query_params=%s",
                external_id,
                dict(request.query_params.lists()),
            )
            return Response({"detail": "programme_type_code is required"}, status=400)
        if not session or not semester:
            missing_params = [
                name
                for name, value in (("session", session), ("semester", semester))
                if not value
            ]
            logger.warning(
                "Instructor detail dashboard request rejected target_external_id=%r "
                "reason=missing_academic_period missing_params=%s query_params=%s",
                external_id,
                missing_params,
                dict(request.query_params.lists()),
            )
            return Response({"detail": "session and semester are required"}, status=400)
        session, semester = resolve_academic_period(session, semester)

        logger.info(
            "Starting instructor detail course synchronization target_external_id=%r "
            "programme_type_code=%r session=%r semester=%r",
            external_id,
            programme_type_code,
            session,
            semester,
        )
        teaching_assignments = get_or_sync_staff_registered_courses(
            staff_external_id=external_id,
            programme_type_code=programme_type_code,
            session=session,
            semester=semester,
        )
        logger.info(
            "Instructor detail course synchronization completed "
            "target_external_id=%r course_count=%d",
            external_id,
            len(teaching_assignments),
        )

        teaching_assignments = list(
            StaffAssignedCourse.objects.filter(
                pk__in=[assignment.pk for assignment in teaching_assignments],
            ).select_related(
                'course',
                'course_offering__session',
                'course_offering__semester',
            )
        )
        courses = [assignment.course for assignment in teaching_assignments]
        course_ids = [c.id for c in courses]

        total_assignments = Assignment.objects.filter(course_id__in=course_ids)
        total_quizzes = Quiz.objects.filter(course_id__in=course_ids)

        data = {
            "context": {
                "programme_type_code": programme_type_code.upper(),
                "session": session,
                "semester": semester,
            },
            "total_courses": TeachingAssignmentSummarySerializer(
                teaching_assignments,
                many=True,
            ).data,
            "total_courses_count": len(courses),
            "total_assignments": AssignmentSummarySerializer(total_assignments, many=True).data,
            "total_assignments_count": total_assignments.count(),
            "total_quizzes": QuizSummarySerializer(total_quizzes, many=True).data,
            "total_quizzes_count": total_quizzes.count(),
        }
        logger.info(
            "Instructor detail dashboard response ready target_external_id=%r "
            "programme_type_code=%r session=%r semester=%r course_count=%d "
            "assignment_count=%d quiz_count=%d",
            external_id,
            programme_type_code.upper(),
            session,
            semester,
            data["total_courses_count"],
            data["total_assignments_count"],
            data["total_quizzes_count"],
        )
        return Response(status=200, data=data)
