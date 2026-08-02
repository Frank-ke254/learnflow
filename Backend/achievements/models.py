from django.db import models
from django.conf import settings


class Certificate(models.Model):
    """
    A certificate awarded to a user for completing a course or milestone.
    """
    CERT_TYPE_CHOICES = [
        ('Full Course',  'Full Course'),
        ('Milestone',    'Milestone'),
        ('Specialization', 'Specialization'),
    ]

    STATUS_CHOICES = [
        ('Verified',  'Verified'),
        ('Pending',   'Pending'),
        ('Revoked',   'Revoked'),
    ]

    user        = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.CASCADE,
                    related_name='certificates'
                  )
    title       = models.CharField(max_length=200)
    course_name = models.CharField(max_length=200, blank=True)
    cert_type   = models.CharField(max_length=50, choices=CERT_TYPE_CHOICES, default='Full Course')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Verified')
    issued_date = models.DateField(auto_now_add=True)
    pdf_url     = models.URLField(blank=True)   # link to generated certificate PDF

    class Meta:
        ordering = ['-issued_date']

    def __str__(self):
        return f"{self.user.username} — {self.title}"


class Badge(models.Model):
    """
    A badge earned by a user for specific achievements
    (e.g., 7-day streak, top reviewer, 10 projects completed).
    """
    BADGE_TYPES = [
        ('streak',      'Streak Achievement'),
        ('reviewer',    'Top Reviewer'),
        ('projects',    'Project Milestone'),
        ('community',   'Community Contributor'),
        ('mentor',      'Mentor Excellence'),
    ]

    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon        = models.CharField(max_length=10, default='⭐')  # emoji or icon code
    badge_type  = models.CharField(max_length=30, choices=BADGE_TYPES)
    awarded_to  = models.ManyToManyField(
                    settings.AUTH_USER_MODEL,
                    related_name='badges',
                    blank=True
                  )

    def __str__(self):
        return self.name


class UserStats(models.Model):
    """
    Aggregated stats for a user — used to display on the achievements page.
    These stats are updated by signals or periodic tasks when relevant
    events happen (course completion, project validation, etc.).
    """
    user                 = models.OneToOneField(
                            settings.AUTH_USER_MODEL,
                            on_delete=models.CASCADE,
                            related_name='achievement_stats'
                           )
    total_points         = models.IntegerField(default=0)
    current_streak       = models.IntegerField(default=0)
    longest_streak       = models.IntegerField(default=0)
    projects_validated   = models.IntegerField(default=0)
    courses_completed    = models.IntegerField(default=0)
    last_activity_date   = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} — {self.total_points} pts"