from django.urls import path
from .views import WeekContentView, QuizSubmitView, ProjectSubmitView, UserProgressView

urlpatterns = [
    # GET — content for a specific week
    path('week/<int:week_number>/', WeekContentView.as_view(), name='week-content'),

    # POST — submit quiz answers
    path('quiz/<int:quiz_id>/submit/', QuizSubmitView.as_view(), name='quiz-submit'),

    # POST — submit project
    path('project/submit/', ProjectSubmitView.as_view(), name='project-submit'),

    # GET — user's current week and resume URL
    path('progress/', UserProgressView.as_view(), name='user-progress'),
    # path('quiz/<int:quiz_id>/', get_quiz_detail),
    # path('quiz/<int:quiz_id>/submit/', submit_quiz),
]