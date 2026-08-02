from django.urls import path
from .views import AchievementsView, IssueCertificateView, AwardBadgeView

urlpatterns = [
    # GET — user's certificates, badges, and stats
    path('', AchievementsView.as_view(), name='achievements'),

    # POST — staff/mentor issues a certificate
    path('issue-certificate/', IssueCertificateView.as_view(), name='issue-certificate'),

    # POST — staff/mentor awards a badge
    path('award-badge/', AwardBadgeView.as_view(), name='award-badge'),
]