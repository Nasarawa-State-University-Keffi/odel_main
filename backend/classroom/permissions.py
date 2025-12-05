from rest_framework import permissions
from .models import EnrollmentCache, Classroom


class IsEnrolledStudent(permissions.BasePermission):
    """Allow access only to students enrolled in the classroom's course."""

    def has_object_permission(self, request, view, obj):
        # obj can be Classroom or Session or Assignment
        course = None
        if isinstance(obj, Classroom):
            course = obj.course
        else:
            # try to get classroom
            course = getattr(obj, 'classroom', None)
            if course is not None:
                course = course.course

        if course is None:
            return False

        user_external = getattr(request.user, 'username', None) or request.META.get('HTTP_X_USER_EXTERNAL_ID')
        if not user_external:
            return False

        return EnrollmentCache.objects.filter(user_external_id=user_external, course=course, role='student').exists()


class IsInstructorForCourse(permissions.BasePermission):
    """Allow access only to users who are instructors for the course."""

    def has_object_permission(self, request, view, obj):
        course = None
        if isinstance(obj, Classroom):
            course = obj.course
        else:
            course = getattr(obj, 'classroom', None)
            if course is not None:
                course = course.course

        if course is None:
            # for create view, look in request.data
            course_id = request.data.get('course')
            if course_id:
                try:
                    from .models import CourseCache
                    course = CourseCache.objects.get(pk=course_id)
                except Exception:
                    return False

        user_external = getattr(request.user, 'username', None) or request.META.get('HTTP_X_USER_EXTERNAL_ID')
        if not user_external:
            return False

        return EnrollmentCache.objects.filter(user_external_id=user_external, course=course, role='instructor').exists()
