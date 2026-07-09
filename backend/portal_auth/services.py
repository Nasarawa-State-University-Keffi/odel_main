from .client import PortalClient
from .models import PortalUser
from .utils import fetch_from_portal

from courses.models import CourseCache, StaffAssignedCourse, StudentRegisteredCourse
from django.db import transaction

STAFF_ROLES = {"ADMIN", "SUPER_ADMIN", "STAFF"}


def extract_level_title(level_data):
    if isinstance(level_data, dict):
        return level_data.get("title")
    return level_data or None


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


# ========================================================
# STUDENT REGISTERED COURSES SYNC
# ========================================================
def get_or_sync_student_registered_courses(
    *,
    token: str,
    student_external_id: str,
    session_id: int,
    semester_id: int,
) -> list[StudentRegisteredCourse]:

    client = PortalClient(token)

    cache_key = (
        f"portal:student:{student_external_id}:"
        f"session:{session_id}:semester:{semester_id}:courses"
    )

    # 1️⃣ Fetch RAW portal data (cached)
    raw_courses = fetch_from_portal(
        cache_key=cache_key,
        fetcher=lambda: client.get_student_registered_courses(
            student_external_id=student_external_id,
            session_id=session_id,
            semester_id=semester_id,
        ),
        ttl=300,
    )

    enrollments = []

    # 2️⃣ Sync DB safely
    with transaction.atomic():
        for raw_course in raw_courses:
            normalized = normalize_portal_course(raw_course)
            print(f"Normalized course data: {normalized}")

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
                session_id=session_id,
                semester_id=semester_id,
            )

            enrollments.append(enrollment)

    return enrollments


# =========================================================
# STAFF REGISTERED COURSES SYNC
# =========================================================
def get_or_sync_staff_registered_courses(
    *,
    token: str,
    staff_external_id: str,
    programme_id: int,
) -> list[StaffAssignedCourse]:

    client = PortalClient(token)

    cache_key = (
        f"portal:staff:{staff_external_id}:"
        f"programme:{programme_id}:courses"
    )

    # 1️⃣ Fetch RAW portal data (cached)
    raw_courses = fetch_from_portal(
        cache_key=cache_key,
        fetcher=lambda: client.get_staff_assigned_courses(
            staff_external_id=staff_external_id,
            programme_id=programme_id,
        ),
        ttl=300,
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

            enrollment, _ = StaffAssignedCourse.objects.get_or_create(
                staff_external_id=staff_external_id,
                course=course_obj,
            )

            assignments.append(enrollment)

    return assignments
