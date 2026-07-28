import logging

from .client import PortalClient
from .models import PortalUser
from .utils import fetch_from_portal

from courses.models import CourseCache, StaffAssignedCourse, StudentRegisteredCourse
from django.db import transaction
import hashlib
import re

logger = logging.getLogger(__name__)

STAFF_ROLES = {"ADMIN", "SUPER_ADMIN", "STAFF"}


def extract_level_title(level_data):
    if isinstance(level_data, dict):
        return level_data.get("title")
    return level_data or None


def resolve_programme(identity_data):
    from synchronization.models import Programme

    programme_data = identity_data.get('programme') or identity_data.get('program') or {}
    upstream_id = identity_data.get('programme_id') or identity_data.get('programmeId')
    code = identity_data.get('programme_code') or identity_data.get('programmeCode')
    if isinstance(programme_data, dict):
        upstream_id = programme_data.get('id') or programme_data.get('upStreamId') or upstream_id
        code = programme_data.get('code') or code
    elif programme_data:
        code = str(programme_data)

    queryset = Programme.objects.all()
    if upstream_id:
        queryset = queryset.filter(up_stream_id=upstream_id)
    elif code:
        queryset = queryset.filter(code__iexact=code)
    else:
        return None

    matches = list(queryset[:2])
    return matches[0] if len(matches) == 1 else None


def get_or_sync_portal_user(token: str) -> PortalUser:
    client = PortalClient(token)

    # Always fetch once to know who the user is
    user_data = client.get_current_user()

    external_id = user_data.get("userId")
    if not external_id:
        raise ValueError("Portal userId missing")

    cache_key = f"portal:user:{external_id}"

    def sync_user():
        roles = user_data.get("roles", [])
        is_staff = any(role in STAFF_ROLES for role in roles)
        programme = resolve_programme(user_data)
        # Extract level title if level is a dict, fallback to None
        level = extract_level_title(user_data.get("level"))
        obj, _ = PortalUser.objects.update_or_create(
            external_id=external_id,
            defaults={
                "full_name": user_data.get("name"),
                "first_name": user_data.get("firstName") or user_data.get("given_name") or "",
                "last_name": user_data.get("lastName") or user_data.get("family_name") or "",
                "email": user_data.get("email"),
                "level": level,
                "roles": roles,
                "profile_picture": user_data.get("profilePicture"),
                "is_staff": is_staff,
                "is_active": True,
                **({'programme': programme} if programme else {}),
            },
        )
        return obj

    return fetch_from_portal(cache_key, sync_user, ttl=300)


# ========================================================
# Student PORTAL COURSE NORMALIZATION
# ========================================================
def normalize_portal_course(course: dict) -> dict:
    department = course.get("department") or {}
    level = course.get("level") or {}

    return {
        "course_external_id": course["id"],
        "course_code": course.get("courseCode"),
        "course_title": course.get("title"),
        "credit_unit": course.get("creditUnit"),
        "department_id": department.get("id"),
        "department_name": department.get("name"),
        "level": level.get("title"),
    }


def normalize_session_name(value: str) -> str:
    value = value.strip()
    if re.fullmatch(r"\d{4}-\d{4}", value):
        return value.replace("-", "/")
    return value


def normalize_semester_name(value: str) -> str:
    return " ".join(value.replace("-", " ").split())


def course_sync_cache_key(prefix: str, *parts: str) -> str:
    digest = hashlib.sha256("\x1f".join(parts).encode("utf-8")).hexdigest()
    return f"portal:{prefix}:courses:{digest}"


# ========================================================
# STUDENT REGISTERED COURSES SYNC
# ========================================================
def get_or_sync_student_registered_courses(
    *,
    student_external_id: str,
    session: str,
    semester: str,
) -> list[StudentRegisteredCourse]:
    client = PortalClient()
    session = normalize_session_name(session)
    semester = normalize_semester_name(semester)

    cache_key = course_sync_cache_key(
        "student",
        student_external_id,
        session,
        semester,
    )

    # 1️⃣ Fetch RAW portal data (cached)
    raw_courses = fetch_from_portal(
        cache_key=cache_key,
        fetcher=lambda: client.get_student_registered_courses(
            student_external_id=student_external_id,
            session=session,
            semester=semester,
        ),
        ttl=300,
    )
    enrollments = []

    # 2️⃣ Sync DB safely
    with transaction.atomic():
        for raw_course in raw_courses:
            normalized = normalize_portal_course(raw_course)

            course_obj, _ = CourseCache.objects.update_or_create(
                course_external_id=normalized["course_external_id"],
                defaults={
                    "course_code": normalized["course_code"],
                    "course_title": normalized["course_title"],
                    "credit_unit": normalized.get("credit_unit"),
                    "department_id": normalized.get("department_id"),
                    "department_name": normalized.get("department_name"),
                    "level": normalized.get("level"),
                },
            )

            enrollment, _ = StudentRegisteredCourse.objects.get_or_create(
                student_external_id=student_external_id,
                course=course_obj,
                session=session,
                semester=semester,
            )

            enrollments.append(enrollment)

        current_course_ids = [enrollment.course_id for enrollment in enrollments]
        stale_enrollments = StudentRegisteredCourse.objects.filter(
            student_external_id=student_external_id,
            session=session,
            semester=semester,
        )
        if current_course_ids:
            stale_enrollments = stale_enrollments.exclude(course_id__in=current_course_ids)
        stale_enrollments.delete()

    return enrollments


# =========================================================
# STAFF REGISTERED COURSES SYNC
# =========================================================
def get_or_sync_staff_registered_courses(
    *,
    staff_external_id: str,
    programme_type_code: str,
    session: str,
    semester: str,
) -> list[StaffAssignedCourse]:
    client = PortalClient()
    programme_type_code = programme_type_code.strip().upper()
    session = normalize_session_name(session)
    semester = normalize_semester_name(semester)

    logger.info(
        "Staff course synchronization starting staff_external_id=%r "
        "programme_type_code=%r session=%r semester=%r",
        staff_external_id,
        programme_type_code,
        session,
        semester,
    )
    cache_key = course_sync_cache_key(
        "staff",
        staff_external_id,
        programme_type_code,
        session,
        semester,
    )

    # 1️⃣ Fetch RAW portal data (cached)
    raw_courses = fetch_from_portal(
        cache_key=cache_key,
        fetcher=lambda: client.get_staff_assigned_courses(
            staff_external_id=staff_external_id,
            programme_type_code=programme_type_code,
            session=session,
            semester=semester,
        ),
        ttl=300,
    )
    logger.info(
        "Staff course data fetched staff_external_id=%r "
        "programme_type_code=%r session=%r semester=%r raw_course_count=%d",
        staff_external_id,
        programme_type_code,
        session,
        semester,
        len(raw_courses),
    )

    assignments = []

    # 2️⃣ Sync DB safely
    with transaction.atomic():
        for raw_course in raw_courses:
            course_obj, _ = CourseCache.objects.update_or_create(
                course_external_id=raw_course["id"],
                defaults={
                    "course_code": raw_course["courseCode"],
                    "course_title": raw_course["title"],
                },
            )

            enrollment, _ = StaffAssignedCourse.objects.update_or_create(
                staff_external_id=staff_external_id,
                course=course_obj,
                programme_type_code=programme_type_code,
                defaults={"role": "INSTRUCTOR"},
            )

            assignments.append(enrollment)

        current_course_ids = [assignment.course_id for assignment in assignments]
        stale_assignments = StaffAssignedCourse.objects.filter(
            staff_external_id=staff_external_id,
            programme_type_code=programme_type_code,
        )
        if current_course_ids:
            stale_assignments = stale_assignments.exclude(course_id__in=current_course_ids)
        stale_deleted_count, _ = stale_assignments.delete()

    logger.info(
        "Staff course synchronization completed staff_external_id=%r "
        "programme_type_code=%r session=%r semester=%r assignment_count=%d "
        "stale_record_count=%d",
        staff_external_id,
        programme_type_code,
        session,
        semester,
        len(assignments),
        stale_deleted_count,
    )
    return assignments
