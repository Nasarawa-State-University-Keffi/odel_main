"""
Custom permission classes for the application
"""
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit.
    Anyone can read.
    
    - GET, HEAD, OPTIONS: Allow anyone
    - POST, PUT, PATCH, DELETE: Require admin/staff user
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write permissions are only allowed to admin users
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object or admins to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner or admin
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.is_staff
        
        return request.user.is_staff
