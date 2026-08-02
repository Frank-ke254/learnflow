from rest_framework import serializers
from .models import CommunityProject, ProjectFeedback, PeerProjectReview


class CommunityProjectSerializer(serializers.ModelSerializer):
    # Expose author's username as a plain string (matches what community.js expects)
    author = serializers.CharField(source='author.username', read_only=True)
    feedback = serializers.SerializerMethodField()
    peer_average_score = serializers.SerializerMethodField()
    mentor_average_score = serializers.SerializerMethodField()
    total_score = serializers.SerializerMethodField()
    peer_reviews_count = serializers.SerializerMethodField()
    mentor_reviews_count = serializers.SerializerMethodField()
    has_peer_reviewed = serializers.SerializerMethodField()
    submitted_course_title = serializers.CharField(source='submitted_course.title', read_only=True)
    submitted_cohort_name = serializers.CharField(source='submitted_cohort.name', read_only=True)

    class Meta:
        model  = CommunityProject
        fields = [
            'id',
            'title',
            'category',
            'description',
            'github_url',
            'author',
            'status',
            'submitted_at',
            'feedback',
            'peer_average_score',
            'mentor_average_score',
            'total_score',
            'peer_reviews_count',
            'mentor_reviews_count',
            'has_peer_reviewed',
            'submitted_course_title',
            'submitted_cohort_name',
        ]
        # Status is writable so mentors can approve/reject via the detail endpoint.
        # Learner submissions still use SubmitProjectSerializer, which always set
        # status='pending' on create.
        read_only_fields = ['id', 'author', 'submitted_at']

    def get_feedback(self, obj):
        latest = ProjectFeedback.objects.filter(project=obj).order_by('-created_at').first()
        return latest.feedback_text if latest else None

    def get_peer_average_score(self, obj):
        return obj.peer_average_score

    def get_mentor_average_score(self, obj):
        return obj.mentor_average_score

    def get_total_score(self, obj):
        return obj.total_score

    def get_peer_reviews_count(self, obj):
        return obj.peer_reviews.count()

    def get_mentor_reviews_count(self, obj):
        return obj.feedbacks.count()

    def get_has_peer_reviewed(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.peer_reviews.filter(reviewer=request.user).exists()


class SubmitProjectSerializer(serializers.ModelSerializer):
    """
    Used for POST /api/community/projects/ — learner submitting their own project.
    Author is set automatically from the request user.
    """
    class Meta:
        model  = CommunityProject
        fields = ['title', 'category', 'description', 'github_url']

from .models import DiscussionThread, DiscussionReply, ProjectFeedback

class ProjectFeedbackSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.username', read_only=True)
    project_name = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = ProjectFeedback
        fields = ['id', 'project', 'project_name', 'mentor_name', 'feedback_text', 'rating', 'created_at']
        read_only_fields = ['id', 'mentor_name', 'project_name', 'created_at']


class PeerProjectReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)

    class Meta:
        model = PeerProjectReview
        fields = ['id', 'project', 'reviewer_name', 'feedback_text', 'rating', 'created_at']
        read_only_fields = ['id', 'reviewer_name', 'created_at', 'project']

class DiscussionReplySerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)

    class Meta:
        model = DiscussionReply
        fields = ['id', 'thread', 'author', 'author_role', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'author_role', 'created_at', 'thread']

class DiscussionThreadSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)
    replies_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DiscussionThread
        fields = ['id', 'title', 'category', 'description', 'author', 'status', 'created_at', 'last_activity', 'replies_count']
        read_only_fields = ['id', 'author', 'status', 'created_at', 'last_activity', 'replies_count']
