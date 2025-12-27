from rest_framework.permissions import BasePermission


class IsPortalStaff(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class IsPortalStudent(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and "STUDENT" in getattr(request.user, "roles", [])
        )
