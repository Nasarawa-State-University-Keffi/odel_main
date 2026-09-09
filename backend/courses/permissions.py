from rest_framework import permissions
from .models import CourseCache, StaffAssignedCourse, StudentRegisteredCourse


class IsEnrolledStudent(permissions.BasePermission):
    """Allow access only to students enrolled in the course."""

    def has_object_permission(self, request, view, obj):
        # Try to get course from the object
        course = None
        if isinstance(obj, CourseCache):
            course = obj
        else:
            # Try to get course attribute directly
            course = getattr(obj, 'course', None)

        if course is None:
            return False

        user_external = getattr(request.user, 'external_id', None)
        if not user_external:
            return False

        return StudentRegisteredCourse.objects.filter(
            student_external_id=user_external,
            course=course,
        ).exists()


class IsInstructorForCourse(permissions.BasePermission):
    """Allow access only to users who are instructors for the course."""

    def has_object_permission(self, request, view, obj):
        # Try to get course from the object
        course = None
        if isinstance(obj, CourseCache):
            course = obj
        else:
            # Try to get course attribute directly
            course = getattr(obj, 'course', None)

        if course is None:
            # For create view, look in request.data
            course_id = request.data.get('course')
            if course_id:
                try:
                    course = CourseCache.objects.get(pk=course_id)
                except Exception:
                    return False

        if course is None:
            return False

        user_external = getattr(request.user, 'external_id', None)
        if not user_external:
            return False

        return StaffAssignedCourse.objects.filter(
            staff_external_id=user_external,
            course=course,
        ).exists()
