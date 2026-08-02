from django.db.models.signals import post_save
from django.dispatch import receiver
from courses.models import Enrollment
from .models import UserProgress


@receiver(post_save, sender=Enrollment)
def create_user_progress_on_enrollment(sender, instance, created, **kwargs):
    """
    When a user enrolls in a course, create their UserProgress tracker.
    They start at Week 1.
    """
    if not created or not instance.is_active:
        return

    UserProgress.objects.get_or_create(
        user=instance.user,
        course=instance.course,
        defaults={'current_week': 1}
    )