from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """Allow access only to Admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'

class IsMentor(BasePermission):
    """Allow access only to Mentor users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'mentor'

class IsStudent(BasePermission):
    """Allow access only to Student users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'student'

class IsAdminOrMentor(BasePermission):
    """Allow access to Admins or Mentors"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['admin', 'mentor']
