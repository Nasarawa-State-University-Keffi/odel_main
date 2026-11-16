"""Shared visibility and teaching-assignment checks for learning resources."""

from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from courses.models import StaffAssignedCourse, StudentRegisteredCourse
from .models import CourseModule, LearningContent


def is_resource_admin(user):
    return bool(
        set(str(role).upper() for role in user.roles)
        & {
            'ADMIN',
            'SUPER_ADMIN',
            'PORTAL_ADMIN',
            'PORTAL_ADMINS',
        }
    )


def student_modules(user, session=None, semester=None):
    registrations = StudentRegisteredCourse.objects.filter(
        student_external=user,
        course_id=OuterRef('course_id'),
    )
    if session and semester:
        registrations = registrations.filter(session=session, semester=semester)
    programme_match = Q(
        course_offering__programme_type_code__iexact=OuterRef('programme_type_code')
    )
    if user.programme_id:
        programme_match |= Q(
            course_offering__isnull=True,
            student_external__programme__programme_type__code__iexact=OuterRef(
                'programme_type_code'
            ),
        )
    scoped_registrations = registrations.filter(
        programme_match,
        session=OuterRef('session'),
        semester=OuterRef('semester'),
    )
    now = timezone.now()
    return CourseModule.objects.annotate(
        enrolled_course=Exists(registrations),
        enrolled_context=Exists(scoped_registrations),
    ).filter(
        Q(enrolled_context=True)
        | Q(
            enrolled_course=True,
            programme_type_code='',
            session='',
            semester='',
        ),
        Q(available_from__isnull=True) | Q(available_from__lte=now),
        Q(available_until__isnull=True) | Q(available_until__gte=now),
        is_published=True,
    )


def visible_contents(user, session=None, semester=None):
    queryset = LearningContent.objects.select_related('course', 'module', 'uploaded_by')
    if user.is_staff or is_resource_admin(user):
        return queryset
    registrations = StudentRegisteredCourse.objects.filter(student_external=user)
    if session and semester:
        registrations = registrations.filter(session=session, semester=semester)
    return queryset.filter(
        Q(module__in=student_modules(user, session, semester))
        | Q(module__isnull=True, course_id__in=registrations.values('course_id')),
        is_published=True,
    )


def ensure_can_manage(user, course, module=None, context=None):
    if is_resource_admin(user):
        return
    assignments = StaffAssignedCourse.objects.filter(
        staff_external_id=user.external_id,
        course=course,
    )
    if module is not None:
        context = {
            field: getattr(module, field)
            for field in (
                'programme_type_code',
                'session',
                'semester',
            )
        }
    context = context or {}
    programme = context.get('programme_type_code', '')
    session = context.get('session', '')
    semester = context.get('semester', '')
    if session and semester:
        assignments = assignments.filter(
            Q(
                course_offering__session__name=session,
                course_offering__semester__name=semester,
                course_offering__programme_type_code__iexact=programme,
            )
            | Q(course_offering__isnull=True, programme_type_code__iexact=programme),
        )
    if not user.is_staff or not assignments.exists():
        raise PermissionDenied(
            'You are not assigned to teach this course in this teaching period.'
        )
