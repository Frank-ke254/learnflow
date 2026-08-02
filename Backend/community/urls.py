from django.urls import path
from .views import CommunityProjectListView, CommunityProjectDetailView, PeerProjectReviewView
from .views import ThreadListView, ThreadDetailView, ThreadRepliesView

urlpatterns = [
    # GET  — list all approved projects
    # POST — submit a new project for review
    path('projects/', CommunityProjectListView.as_view(), name='community-projects'),

    # GET    — single project detail
    # PATCH  — mentor approve/reject
    # DELETE — author withdraws
    path('projects/<int:pk>/', CommunityProjectDetailView.as_view(), name='community-project-detail'),
    path('projects/<int:pk>/peer-review/', PeerProjectReviewView.as_view(), name='community-project-peer-review'),

    # Discussions
    path('threads/', ThreadListView.as_view(), name='thread-list'),
    path('threads/<int:pk>/', ThreadDetailView.as_view(), name='thread-detail'),
    path('threads/<int:pk>/replies/', ThreadRepliesView.as_view(), name='thread-replies'),
]