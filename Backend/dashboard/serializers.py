from rest_framework import serializers
from .models import Score, Notification, Skill, SkillTopic, UserSkillTopic, UserStats, TopicCompletion, SkillWeek


class UserStatsSerializer(serializers.ModelSerializer):
    """Serializer for gamification data: streaks, points, and validated projects."""
    class Meta:
        model = UserStats
        fields = ['total_points', 'streak_days', 'projects_validated']


class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class SkillTopicSerializer(serializers.ModelSerializer):
    # Frontend expects 'is_completed' not 'completed', and 'type' not 'content_type'
    is_completed = serializers.SerializerMethodField()
    type = serializers.CharField(source='content_type')

    class Meta:
        model = SkillTopic
        fields = ["id", "title", "order", "is_completed", "type", "content_id"]

    def get_is_completed(self, obj):
        user = self.context["request"].user
        return UserSkillTopic.objects.filter(user=user, topic=obj, completed=True).exists()


class SkillSerializer(serializers.ModelSerializer):
    topics = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = ("id", "name", "description", "progress", "topics")

    def get_topics(self, obj):
        topics = SkillTopic.objects.filter(week__skill_id=obj.id).order_by("week__number", "order")
        
        return SkillTopicSerializer(topics, many=True,context=self.context).data
    
    def get_progress(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            total = SkillTopic.objects.filter(week__skill__id=obj.id).count()
            completed = UserSkillTopic.objects.filter(
                user=request.user, topic__week__skill__id=obj.id, completed=True
            ).count()
            return int((completed / total) * 100) if total > 0 else 0
        return 0




class SkillTopicListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for topic lists"""
    week_number = serializers.IntegerField(source='week.number', read_only=True)
    is_completed = serializers.SerializerMethodField()
    
    class Meta:
        model = SkillTopic
        fields = ['id', 'title', 'slug', 'description', 'duration', 
                  'week_number', 'order', 'is_completed']
    
    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.completed_by.filter(id=request.user.id).exists()
        return False


class SkillTopicDetailSerializer(serializers.ModelSerializer):
    """Full serializer with all lesson content"""
    week_number = serializers.IntegerField(source='week.number', read_only=True)
    week_title = serializers.CharField(source='week.title', read_only=True)
    is_completed = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = SkillTopic
        fields = ['id', 'title', 'slug', 'description', 'content_type',
                  'content', 'sections', 'key_points', 'duration',
                  'week_number', 'week_title', 'order',
                  'is_completed', 'completion_percentage',
                  'created_at', 'updated_at']
    
    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.completed_by.filter(id=request.user.id).exists()
        return False
    
    def get_completion_percentage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            completion = TopicCompletion.objects.filter(
                user=request.user, topic=obj
            ).first()
            return completion.progress_percentage if completion else 0
        return 0


class SkillWeekSerializer(serializers.ModelSerializer):
    topics = SkillTopicListSerializer(many=True, read_only=True)
    total_topics = serializers.SerializerMethodField()
    completed_topics = serializers.SerializerMethodField()
    week_number = serializers.IntegerField(source='number', read_only=True)
    progress = serializers.SerializerMethodField()
    is_current = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()
    has_quiz = serializers.BooleanField(default=False, read_only=True)
    has_project = serializers.BooleanField(default=True, read_only=True)
    quiz_completed = serializers.BooleanField(default=False, read_only=True)
    
    class Meta:
        model = SkillWeek
        fields = ['id', 'number', 'week_number', 'title', 'description',
                  'topics', 'total_topics', 'completed_topics',
                  'progress', 'is_current', 'is_locked', 'has_quiz', 'has_project', 'quiz_completed']
    
    def get_total_topics(self, obj):
        return obj.topics.filter(is_published=True).count()
    
    def get_completed_topics(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.topics.filter(
                is_published=True,
                completed_by=request.user
            ).count()
        return 0

    def get_progress(self, obj):
        total = self.get_total_topics(obj)
        if total == 0: return 0
        completed = self.get_completed_topics(obj)
        return int((completed / total) * 100)
    
    def get_is_current(self, obj):
        # We can keep it simple: the dashboard view calculates progress to find current week,
        # but here we can just do a very basic check: true if this is the first incomplete week.
        request = self.context.get('request')
        if not request or not request.user.is_authenticated: return False
        
        my_progress = self.get_progress(obj)
        if my_progress < 100:
            # Check if all previous weeks are 100%
            prev_weeks = SkillWeek.objects.filter(number__lt=obj.number)
            for pw in prev_weeks:
                p_total = pw.topics.filter(is_published=True).count()
                p_comp = pw.topics.filter(is_published=True, completed_by=request.user).count()
                if p_total > 0 and p_comp < p_total:
                    return False
            return True
        return False
        
    def get_is_locked(self, obj):
        if obj.number <= 1: return False
        request = self.context.get('request')
        if not request or not request.user.is_authenticated: return True
        
        # Locked if immediately preceding week is incomplete
        prev_week = SkillWeek.objects.filter(number=obj.number - 1).first()
        if prev_week:
            p_total = prev_week.topics.filter(is_published=True).count()
            if p_total > 0:
                p_comp = prev_week.topics.filter(is_published=True, completed_by=request.user).count()
                if p_comp < p_total:
                    return True
        return False