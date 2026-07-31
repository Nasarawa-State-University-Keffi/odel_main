from rest_framework.permissions import BasePermission


class IsPortalStaff(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class IsPortalAdmin(BasePermission):
    def has_permission(self, request, view):
        roles = {
            str(role).upper()
            for role in getattr(request.user, "roles", [])
        }
        return bool(
            request.user
            and roles & {"ADMIN", "SUPER_ADMIN", "PORTAL_ADMIN", "PORTAL_ADMINS"}
        )


class IsPortalStudent(BasePermission):
    def has_permission(self, request, view):
        roles = {
            str(role).upper()
            for role in getattr(request.user, "roles", [])
        }
        return bool(
            request.user and "STUDENT" in roles
        )
