"""
Permission classes for assessment app.
"""
from rest_framework import permissions

from portal_auth.permissions import IsPortalStudent as PortalStudentPermission


class IsInstructorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow instructors to edit assignments and quizzes.
    """
    
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to instructors (staff users)
        return request.user and request.user.is_staff


class IsPortalStudent(PortalStudentPermission):
    """
    Custom permission to allow students (authenticated portal users)
    access to their own assignments and quizzes.
    """
    pass
