import logging

from django.db.models import Avg, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample


from courses.models import CourseCache, CourseOffering, StaffAssignedCourse, StudentRegisteredCourse
from courses.services import resolve_academic_period
from assessment.models import Assessment, AssessmentAttempt, Assignment, AssignmentSubmission, Quiz, QuizAttempt
from portal_auth.models import PortalUser
from portal_auth.services import (
    get_or_sync_staff_registered_courses,
    get_or_sync_student_registered_courses,
)
from .serializers import (
    AssignmentSummarySerializer,
    CourseSummarySerializer,
    QuizSummarySerializer,
    TeachingAssignmentSummarySerializer,
    AdminDirectoryUserSerializer,
)
from portal_auth.permissions import IsPortalAdmin, IsPortalStudent, IsPortalStaff


from drf_spectacular.utils import OpenApiParameter

logger = logging.getLogger(__name__)

ADMIN_ROLE_NAMES = {'ADMIN', 'SUPER_ADMIN', 'PORTAL_ADMIN', 'PORTAL_ADMINS'}
STAFF_ROLE_NAMES = {'STAFF', 'PORTAL_STAFF'}
STUDENT_ROLE_NAMES = {'STUDENT', 'PORTAL_STUDENTS'}


def normalized_roles(user):
    return {str(role).upper() for role in (user.roles or [])}


def user_audience(user):
    """Classify a portal identity for administrator directories."""
    roles = normalized_roles(user)
    if roles & ADMIN_ROLE_NAMES:
        return 'admin'
    if user.is_staff or roles & STAFF_ROLE_NAMES:
        return 'staff'
    if roles & STUDENT_ROLE_NAMES:
        return 'student'
    return 'other'


def get_active_quizzes(course_ids, now):
    """Return quizzes an enrolled student can begin right now."""
    return Quiz.objects.filter(
        course_id__in=course_ids,
        is_published=True,
    ).filter(
        Q(time_open__isnull=True) | Q(time_open__lte=now),
        Q(time_close__isnull=True) | Q(time_close__gt=now),
    ).order_by('time_close', 'name')


def get_active_assignments(course_ids, now):
    """Return assignments whose submission window is currently open."""
    return Assignment.objects.filter(
        course_id__in=course_ids,
        is_published=True,
        open_at__lte=now,
    ).filter(
        Q(due_at__gt=now)
        | (
            Q(allow_late_submission=True)
            & (Q(close_at__isnull=True) | Q(close_at__gt=now))
        )
    ).order_by('due_at', 'title')


class AdminDashboardOverviewView(APIView):
    """Institution-wide counts and term-specific assessment activity."""

    permission_classes = [IsAuthenticated, IsPortalAdmin]

    @extend_schema(
        tags=['Admin - Dashboard'],
        summary='Administrator dashboard overview',
        parameters=[
            OpenApiParameter(name='session', type=str, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter(name='semester', type=str, location=OpenApiParameter.QUERY, required=False),
        ],
    )
    def get(self, request):
        session = request.query_params.get('session')
        semester = request.query_params.get('semester')
        if bool(session) != bool(semester):
            return Response({'detail': 'session and semester must be supplied together'}, status=400)

        users = list(PortalUser.objects.all().only('id', 'roles', 'is_staff', 'is_active'))
        directory_counts = {
            'staff': sum(user_audience(user) == 'staff' for user in users),
            'students': sum(user_audience(user) == 'student' for user in users),
            'active_users': sum(user.is_active for user in users),
        }

        context = {'session': None, 'semester': None}
        offering_queryset = CourseOffering.objects.none()
        if session and semester:
            session, semester = resolve_academic_period(session, semester)
            context = {'session': session, 'semester': semester}
            offering_queryset = CourseOffering.objects.filter(
                session__name=session,
                semester__name=semester,
                status='active',
            )

        course_ids = offering_queryset.values_list('course_id', flat=True)
        quiz_queryset = Quiz.objects.filter(course_id__in=course_ids) if session else Quiz.objects.all()
        assessment_queryset = Assessment.objects.filter(course_offering__in=offering_queryset) if session else Assessment.objects.all()
        quiz_attempts = QuizAttempt.objects.filter(quiz__in=quiz_queryset)
        assessment_attempts = AssessmentAttempt.objects.filter(assessment__in=assessment_queryset)

        def assessment_metrics(queryset, attempts):
            return {
                'total': queryset.count(),
                'published': queryset.filter(is_published=True).count(),
                'attempts': attempts.count(),
                'completed_attempts': attempts.filter(state='finished').count(),
                'average_score': attempts.filter(state='finished', total_score__isnull=False).aggregate(value=Avg('total_score'))['value'],
            }

        active_students = (
            StudentRegisteredCourse.objects.filter(session=session, semester=semester)
            .values('student_external_id').distinct().count()
            if session else directory_counts['students']
        )
        active_staff = (
            StaffAssignedCourse.objects.filter(course_offering__in=offering_queryset)
            .values('staff_external_id').distinct().count()
            if session else directory_counts['staff']
        )

        return Response({
            'context': context,
            'people': {
                **directory_counts,
                'active_staff': active_staff,
                'active_students': active_students,
            },
            'courses': {'active_offerings': offering_queryset.count() if session else CourseCache.objects.count()},
            'quizzes': assessment_metrics(quiz_queryset, quiz_attempts),
            'assessments': assessment_metrics(assessment_queryset, assessment_attempts),
        })


class AdminDirectoryView(APIView):
    """A paginated, admin-only directory for staff or student identities."""

    permission_classes = [IsAuthenticated, IsPortalAdmin]
    audience = None

    def get(self, request):
        if self.audience not in {'staff', 'student'}:
            return Response({'detail': 'Unknown directory'}, status=404)

        query = request.query_params.get('search', '').strip().lower()
        try:
            page = max(1, int(request.query_params.get('page', 1)))
            page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
        except ValueError:
            return Response({'detail': 'page and page_size must be whole numbers'}, status=400)

        users = [
            user for user in PortalUser.objects.all().order_by('full_name', 'external_id')
            if user_audience(user) == self.audience
        ]
        if query:
            users = [
                user for user in users
                if query in user.full_name.lower()
                or query in user.external_id.lower()
                or query in (user.email or '').lower()
            ]

        count = len(users)
        start = (page - 1) * page_size
        results = users[start:start + page_size]
        return Response({
            'count': count,
            'page': page,
            'page_size': page_size,
            'next': page + 1 if start + page_size < count else None,
            'previous': page - 1 if page > 1 else None,
            'results': AdminDirectoryUserSerializer(results, many=True).data,
        })


class AdminStaffDirectoryView(AdminDirectoryView):
    audience = 'staff'


class AdminStudentDirectoryView(AdminDirectoryView):
    audience = 'student'


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

        pending_quizzes = get_active_quizzes(course_ids, now)
        upcoming_assignments = get_active_assignments(course_ids, now)
  
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
        pending_quizzes = get_active_quizzes(course_ids, now)
        upcoming_assignments = get_active_assignments(course_ids, now)

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
