from rest_framework import permissions


class IsApplicantOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # obj expected to be Applicant
        return obj.user == request.user


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, 'is_authenticated', False):
            return False
        return user.groups.filter(name='Students').exists()


class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, 'is_authenticated', False):
            return False
        return user.groups.filter(name='Staff').exists()


class IsAdmissionOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, 'is_authenticated', False):
            return False
        return user.groups.filter(name='Admission Officers').exists()
