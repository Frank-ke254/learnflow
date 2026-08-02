from rest_framework import serializers
from .models import BlogPost, Comment, Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class BlogPostSerializer(serializers.ModelSerializer):
    # We include the tags and count of comments for a richer UI
    tags = TagSerializer(many=True, read_only=True)
    comment_count = serializers.IntegerField(source='comment_set.count', read_only=True)

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'content', 'image', 
            'category', 'tags', 'created_at', 'comment_count'
        ]

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'name', 'message', 'created_at']