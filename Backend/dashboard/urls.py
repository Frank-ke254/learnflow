from django.urls import path
from . import views
from .views import DashboardView, SkillsView, ToggleSkillTopicView, SkillTopicListView, EnrollmentView, DashboardWidgetsView

urlpatterns = [
    path('', DashboardView.as_view()),
    path("skills/", SkillsView.as_view()),
    path("skills-topics/", SkillTopicListView.as_view()),
    path("skills/topics/<int:topic_id>/toggle/", ToggleSkillTopicView.as_view()),
    path('enroll/', EnrollmentView.as_view(), name='enroll'),
    
     # Get all weeks with topics
    path('weeks/', views.get_all_weeks, name='all-weeks'),
    
    # Get topics for specific week
    path('weeks/<int:week_number>/topics/', views.get_week_topics, name='week-topics'),
    
    # Get lesson content
    path('lessons/<int:week_number>/<int:topic_id>/', views.get_lesson_content, name='lesson-content'),
    
    # Mark lesson complete
    path('lessons/complete/', views.mark_lesson_complete, name='lesson-complete'),
    
    # Get user progress
    path('progress/', views.get_user_progress, name='user-progress'),

    # path('widgets/', views.get_dashboard_widgets, name='dashboard_widgets'),
    path('widgets/', DashboardWidgetsView.as_view(), name='dashboard-widgets'),
]
