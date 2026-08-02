from django.urls import path
from .views import BlogPostListView, BlogPostDetailView, CommentListCreateView

urlpatterns = [
    # API endpoints
    path('posts/', BlogPostListView.as_view(), name='api_blog_list'),
    path('posts/<int:id>/', BlogPostDetailView.as_view(), name='api_blog_detail'),
    path('posts/<int:post_id>/comments/', CommentListCreateView.as_view(), name='api_comments'),
]