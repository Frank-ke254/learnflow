from django.urls import path
from .views import CourseListView, CourseEnrollView, UserEnrollmentsView

urlpatterns = [
    # GET  — list all active courses (with enrolled flag per user)
    path('', CourseListView.as_view(), name='course-list'),

    # POST — enroll in a course  { "course_id": <int> }
    path('enroll/', CourseEnrollView.as_view(), name='course-enroll'),

    # GET  — current user's enrollment history
    path('my-enrollments/', UserEnrollmentsView.as_view(), name='my-enrollments'),
]