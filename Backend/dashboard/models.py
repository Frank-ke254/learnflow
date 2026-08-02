from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from django.conf import settings

User = settings.AUTH_USER_MODEL


class UserStats(models.Model):
    """Gamification stats shown on the dashboard."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="stats")
    total_points = models.PositiveIntegerField(default=0)
    streak_days = models.PositiveIntegerField(default=0)
    last_login_date = models.DateField(null=True, blank=True)
    projects_validated = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}'s Stats"


class Score(models.Model):
    """Point tracking for different activities."""
    CATEGORY_CHOICES = (
        ('project', 'Project Validation'),
        ('skills', 'Skill Assessment'),
        ('participation', 'Participation'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    value = models.PositiveIntegerField()
    validated = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.category}"


class Notification(models.Model):
    """User notifications."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


# ========================================
# OLD SKILL SYSTEM (for course-based skills)
# Keep this for backward compatibility with existing course system
# ========================================

class Skill(models.Model):
    """
    A skill/module within a course.
    Linked to courses.Course (not LearningPath).
    Auto-created when user enrolls in a course via signal.
    NOTE: This is the OLD system - new lessons use SkillWeek/SkillTopic above
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="dashboard_skills"
    )

    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name="dashboard_skills",
        null=True,
        blank=True
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=7)

    class Meta:
        ordering = ['order']
        unique_together = ('user', 'course', 'name')

    def __str__(self):
        return f"{self.user.username} — {self.name}"

    def calculate_progress(self):
        """
        Calculate progress based on completed topics.
        Returns 0 if no topics exist (prevents AttributeError).
        """
        # Check if this skill has any topics linked to it via old SkillTopic model
        # Since the old SkillTopic is commented out, this will always return 0
        # This is fine - old skills just show 0% progress
        return 0


class Activity(models.Model):
    """
    Tracks all user activities for the Recent Activity feed.
    This creates a unified timeline of everything the user does.
    """
    
    ACTIVITY_TYPES = (
        ('lesson_completed', 'Lesson Completed'),
        ('quiz_completed', 'Quiz Completed'),
        ('project_submitted', 'Project Submitted'),
        ('project_approved', 'Project Approved'),
        ('project_rejected', 'Project Rejected'),
        ('badge_earned', 'Badge Earned'),
        ('discussion_posted', 'Discussion Posted'),
        ('discussion_reply', 'Discussion Reply'),
        ('course_enrolled', 'Course Enrolled'),
        ('course_completed', 'Course Completed'),
        ('streak_milestone', 'Streak Milestone'),
        ('points_milestone', 'Points Milestone'),
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    
    activity_type = models.CharField(
        max_length=50,
        choices=ACTIVITY_TYPES
    )
    
    title = models.CharField(
        max_length=255,
        help_text="Main heading shown in activity feed"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Additional details about the activity"
    )
    
    # Optional references to related objects
    related_topic_id = models.IntegerField(null=True, blank=True)
    related_project_id = models.IntegerField(null=True, blank=True)
    related_discussion_id = models.IntegerField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    is_visible = models.BooleanField(
        default=True,
        help_text="Hide sensitive activities if needed"
    )
    
    class Meta:
        ordering = ['-created_at']  # Newest first
        verbose_name_plural = 'Activities'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['activity_type']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
    
    @classmethod
    def create_lesson_completed(cls, user, topic_title, score=None):
        """Helper to create lesson completion activity"""
        description = f"Score: {score}%" if score else "Completed successfully"
        return cls.objects.create(
            user=user,
            activity_type='lesson_completed',
            title=f"Completed {topic_title}",
            description=description
        )
    
    @classmethod
    def create_project_activity(cls, user, project_name, action='submitted'):
        """Helper to create project-related activities"""
        activity_map = {
            'submitted': ('project_submitted', 'Submitted'),
            'approved': ('project_approved', 'Project Approved'),
            'rejected': ('project_rejected', 'Needs Revision')
        }
        activity_type, action_text = activity_map.get(action, ('project_submitted', 'Submitted'))
        
        return cls.objects.create(
            user=user,
            activity_type=activity_type,
            title=f"{action_text} - {project_name}",
            description=project_name
        )
    
    @classmethod
    def create_badge_earned(cls, user, badge_name, badge_description=''):
        """Helper to create badge earned activity"""
        return cls.objects.create(
            user=user,
            activity_type='badge_earned',
            title=f"Badge Earned: {badge_name}",
            description=badge_description
        )
    
    @classmethod
    def create_discussion_activity(cls, user, discussion_title, is_reply=False):
        """Helper to create discussion activities"""
        if is_reply:
            return cls.objects.create(
                user=user,
                activity_type='discussion_reply',
                title='New Reply',
                description=discussion_title
            )
        else:
            return cls.objects.create(
                user=user,
                activity_type='discussion_posted',
                title='Posted Question',
                description=discussion_title
            )
    
    @classmethod
    def create_course_enrolled(cls, user, course_name):
        """Helper to create course enrollment activity"""
        return cls.objects.create(
            user=user,
            activity_type='course_enrolled',
            title='Started New Course',
            description=course_name
        )


class SkillWeek(models.Model):
    """Represents a week in the learning curriculum"""
    skill = models.ForeignKey(Skill, related_name="weeks", on_delete=models.CASCADE, null=True, blank=True)
    number = models.IntegerField(unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    class Meta:
        ordering = ['number']
    
    def __str__(self):
        return f"Week {self.number}: {self.title}"


# ========================================
# NEW LESSON SYSTEM (SkillWeek/SkillTopic)
# ========================================

class SkillTopic(models.Model):
    """Individual lesson/topic within a week"""
    CONTENT_TYPE_CHOICES = [
        ('html', 'HTML Content'),
        ('markdown', 'Markdown'),
        ('structured', 'Structured JSON'),
    ]
    
    week = models.ForeignKey(SkillWeek, on_delete=models.CASCADE, related_name='topics', null=True, blank=True)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True, null=True)
    description = models.TextField(default="")
    
    # Content storage
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES, default='html')
    content = models.TextField(help_text="Main lesson content (HTML)", default="")
    
    # Structured content (optional)
    sections = models.JSONField(default=list, blank=True)
    key_points = models.JSONField(default=list, blank=True)
    
    # Metadata
    duration = models.CharField(max_length=50, default="15 minutes")
    order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=True)
    
    # Completion tracking
    completed_by = models.ManyToManyField(User, through='TopicCompletion', related_name='completed_topics')
    
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['week__number', 'order']
        unique_together = [['week', 'order']]
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.week} - {self.title}"


class TopicCompletion(models.Model):
    """Tracks completion of SkillTopics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.ForeignKey(SkillTopic, on_delete=models.CASCADE)
    completed_at = models.DateTimeField(auto_now_add=True)
    progress_percentage = models.IntegerField(default=0)
    
    class Meta:
        unique_together = [['user', 'topic']]
    
    def __str__(self):
        return f"{self.user.username} - {self.topic.title} ({self.progress_percentage}%)"



class UserSkillTopic(models.Model):
    """
    Tracks which topics a user has completed.
    NOTE: This links to the NEW SkillTopic (week-based), not the old commented-out one
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    topic = models.ForeignKey(SkillTopic, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'topic')

    def __str__(self):
        return f"{self.user.username} - {self.topic.title} ({'✓' if self.completed else '✗'})"

