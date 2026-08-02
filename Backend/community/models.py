from django.db import models
from django.conf import settings


class CommunityProject(models.Model):
    """
    A project submitted by a learner for peer review.
    Visibility to other users is gated by whether THEY have
    completed the matching skill category (enforced in the view).
    """

    STATUS_CHOICES = [
        ('pending',  'Pending Review'),
        ('approved', 'Approved'),
        ('needs_revision', 'Needs Revision'),
        ('rejected', 'Rejected'),
    ]

    author      = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.CASCADE,
                    related_name='submitted_projects'
                  )
    title       = models.CharField(max_length=200)
    category    = models.CharField(max_length=100)   # must match skill name exactly
    description = models.TextField(blank=True)
    github_url  = models.URLField()
    submitted_course = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='community_projects'
    )
    submitted_cohort = models.ForeignKey(
        'courses.Cohort',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='community_projects'
    )
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.title} by {self.author.username} [{self.status}]"

    @property
    def peer_average_score(self):
        reviews = self.peer_reviews.all()
        if not reviews.exists():
            return 0
        return round(sum(r.rating for r in reviews) / reviews.count(), 2)

    @property
    def mentor_average_score(self):
        reviews = self.feedbacks.all()
        if not reviews.exists():
            return 0
        return round(sum(r.rating for r in reviews) / reviews.count(), 2)

    @property
    def total_score(self):
        # Weighted total: peers 40%, mentors 60%
        return round((self.peer_average_score * 0.4) + (self.mentor_average_score * 0.6), 2)

class DiscussionThread(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('solved', 'Solved'),
        ('closed', 'Closed'),
    ]

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    description = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='threads')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_activity']

    def __str__(self):
        return self.title

    @property
    def replies_count(self):
        return self.replies.count()

class DiscussionReply(models.Model):
    thread = models.ForeignKey(DiscussionThread, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='thread_replies')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.author} on {self.thread.title}"

class ProjectFeedback(models.Model):
    project = models.ForeignKey(CommunityProject, on_delete=models.CASCADE, related_name='feedbacks')
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_feedbacks')
    feedback_text = models.TextField()
    rating = models.IntegerField(default=5)  # E.g. 1-5 scale
    syntax_score = models.PositiveSmallIntegerField(default=0)
    structure_score = models.PositiveSmallIntegerField(default=0)
    functionality_score = models.PositiveSmallIntegerField(default=0)
    documentation_score = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback by {self.mentor.username} for {self.project.title}"


class PeerProjectReview(models.Model):
    project = models.ForeignKey(CommunityProject, on_delete=models.CASCADE, related_name='peer_reviews')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='peer_project_reviews')
    feedback_text = models.TextField(blank=True)
    rating = models.IntegerField(default=3)
    syntax_score = models.PositiveSmallIntegerField(default=0)
    structure_score = models.PositiveSmallIntegerField(default=0)
    functionality_score = models.PositiveSmallIntegerField(default=0)
    documentation_score = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('project', 'reviewer')

    def __str__(self):
        return f"Peer review by {self.reviewer.username} for {self.project.title}"