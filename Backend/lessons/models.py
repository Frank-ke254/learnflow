from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Week(models.Model):
    """
    A week of content within a course.
    Tracks when it unlocks and when the on-time deadline expires.
    """
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='weeks'
    )
    week_number = models.PositiveIntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_published = models.BooleanField(default=True)
    
    # Auto-unlock and deadline tracking
    unlock_date = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    
    # Project assignment for this week
    project_title = models.CharField(max_length=200, blank=True)
    project_description = models.TextField(blank=True)
    project_requirements = models.TextField(blank=True, help_text="Requirements in markdown format")

    class Meta:
        ordering = ['week_number']
        unique_together = ('course', 'week_number')

    def __str__(self):
        return f"{self.course.title} - Week {self.week_number}: {self.title}"

    def is_unlocked_for_user(self, user):
        """Check if this week is available to the user."""
        if not self.unlock_date:
            return True
        return timezone.now() >= self.unlock_date

    def is_on_time(self):
        """Check if current time is within the week's deadline for 100% weight."""
        if not self.deadline:
            return True
        return timezone.now() <= self.deadline


class Lesson(models.Model):
    """Individual lesson within a week."""
    LESSON_TYPES = [
        ('reading', 'Text Content'),
        ('video', 'Video Lesson'),
        ('diagram', 'Diagram/Visual'),
        ('exercise', 'Practice Exercise'),
    ]

    week = models.ForeignKey(Week, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    lesson_type = models.CharField(max_length=20, choices=LESSON_TYPES)
    order = models.PositiveIntegerField(default=1)
    
    content = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    image_url = models.URLField(blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.week.title} - {self.title}"


class Quiz(models.Model):
    """MCQ quiz at the end of a week."""
    week = models.OneToOneField(Week, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=200)
    passing_score = models.PositiveIntegerField(default=70)
    time_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Time limit in minutes")

    def __str__(self):
        return f"Quiz: {self.week.title}"


class Question(models.Model):
    """
    Individual MCQ question for a quiz.
    This is the corrected model that matches the quiz system.
    """
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField(help_text="The question text")
    
    # Answer options
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    
    # Correct answer (A, B, C, or D)
    correct_answer = models.CharField(max_length=1, choices=[
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    ])
    
    # Optional explanation shown after answering
    explanation = models.TextField(blank=True, help_text="Why this is the correct answer")
    
    order = models.PositiveIntegerField(default=1, help_text="Order of question in quiz")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}"


class QuizAttempt(models.Model):
    """Record of a user's quiz attempt."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.PositiveIntegerField(help_text="Number of correct answers")
    time_taken = models.PositiveIntegerField(help_text="Time taken in seconds")
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} - {self.score}"
    
    @property
    def percentage(self):
        total_questions = self.quiz.questions.count()
        if total_questions == 0:
            return 0
        return round((self.score / total_questions) * 100, 1)
    
    @property
    def passed(self):
        return self.percentage >= self.quiz.passing_score


class QuizAnswer(models.Model):
    """Individual answer for a quiz attempt."""
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer = models.CharField(max_length=1, choices=[
        ('A', 'Option A'),
        ('B', 'Option B'),
        ('C', 'Option C'),
        ('D', 'Option D'),
    ])
    is_correct = models.BooleanField()

    def __str__(self):
        return f"{self.attempt.user.username} - Q{self.question.order} - {'✓' if self.is_correct else '✗'}"


class UserProgress(models.Model):
    """Track user progress through course weeks."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    course = models.ForeignKey('courses.Course', on_delete=models.CASCADE)
    current_week = models.PositiveIntegerField(default=1)
    completed_weeks = models.JSONField(default=list, help_text="List of completed week numbers")
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self):
        return f"{self.user.username} - {self.course.title} - Week {self.current_week}"


class ProjectSubmission(models.Model):
    """GitHub repo submission with late penalty tracking."""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('needs_revision', 'Needs Revision'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    github_url = models.URLField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_late = models.BooleanField(default=False)  # Submitted after deadline
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    community_project = models.ForeignKey(
        'community.CommunityProject',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='submission'
    )

    class Meta:
        unique_together = ('user', 'week')
        ordering = ['-submitted_at']

    def __str__(self):
        late_marker = " [LATE]" if self.is_late else ""
        return f"{self.user.username} - {self.week.title} Project{late_marker}"
