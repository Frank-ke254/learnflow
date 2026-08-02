from django.db import models
from django.conf import settings


class Course(models.Model):
    LEVEL_CHOICES = [
        ('Beginner',     'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced',     'Advanced'),
    ]

    title       = models.CharField(max_length=200)
    description = models.TextField()
    category    = models.CharField(max_length=100)
    level       = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='Beginner')
    duration    = models.CharField(max_length=50)   # e.g. "12 Weeks"
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return self.title


class Cohort(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='cohorts')
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('course', 'name')
        ordering = ['course_id', 'name']

    def __str__(self):
        return f"{self.course.title} — {self.name}"


class Enrollment(models.Model):
    """
    Tracks which user is enrolled in which course.
    One user can only be enrolled in one course at a time
    (enforced in the view) to match the dashboard's
    single active learning path concept.
    """
    user       = models.ForeignKey(
                    settings.AUTH_USER_MODEL,
                    on_delete=models.CASCADE,
                    related_name='enrollments'
                 )
    course     = models.ForeignKey(
                    Course,
                    on_delete=models.CASCADE,
                    related_name='enrollments'
                 )
    cohort     = models.ForeignKey(
                    Cohort,
                    on_delete=models.SET_NULL,
                    null=True,
                    blank=True,
                    related_name='enrollments'
                 )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    is_active   = models.BooleanField(default=True)

    class Meta:
        # Prevent duplicate enrollments for the same user/course
        unique_together = ('user', 'course')
        ordering = ['-enrolled_at']
        constraints = [
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(is_active=True),
                name='unique_active_enrollment_per_user'
            )
        ]

    def __str__(self):
        return f"{self.user.username} → {self.course.title}"