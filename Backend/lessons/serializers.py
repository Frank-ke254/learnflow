from rest_framework import serializers
from .models import Week, Lesson, Quiz, Question, QuizAnswer, QuizAttempt, ProjectSubmission, UserProgress


class LessonSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='lesson_type')

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'type', 'order', 'content', 'video_url', 'image_url', 'duration_minutes']


class QuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ['id', 'choice_text', 'order']
        # Don't expose is_correct in GET requests


class QuestionSerializer(serializers.ModelSerializer):
    choices = QuizAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'order', 'choices']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'passing_score', 'questions']


class WeekSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quiz = QuizSerializer(read_only=True)
    has_project = serializers.SerializerMethodField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = Week
        fields = ['id', 'week_number', 'title', 'description', 'lessons', 'quiz', 'has_project', 'is_locked']

    def get_has_project(self, obj):
        # Check if this week has a project submission requirement
        return ProjectSubmission.objects.filter(week=obj, user=self.context['request'].user).exists()

    def get_is_locked(self, obj):
        user = self.context['request'].user
        try:
            progress = UserProgress.objects.get(user=user, course=obj.course)
            return not progress.can_access_week(obj.week_number)
        except UserProgress.DoesNotExist:
            return obj.week_number > 1  # Week 1 always unlocked


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ['id', 'score', 'passed', 'submitted_at']


class ProjectSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectSubmission
        fields = ['id', 'github_url', 'notes', 'status', 'submitted_at']