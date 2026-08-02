from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from lessons.models import Week
from courses.models import Course


class Command(BaseCommand):
    help = 'Unlocks the next week for all courses every Monday at 00:00'

    def handle(self, *args, **options):
        """
        Run this command via cron every Monday at 00:00:
        0 0 * * 1 cd /path/to/project && python manage.py unlock_weeks
        """
        now = timezone.now()
        
        # Check if today is Monday (weekday() returns 0 for Monday)
        if now.weekday() != 0:
            self.stdout.write(self.style.WARNING('Not Monday. Skipping week unlock.'))
            return

        courses = Course.objects.filter(is_active=True)
        
        for course in courses:
            # Get all weeks for this course
            weeks = Week.objects.filter(course=course).order_by('week_number')
            
            # Set unlock dates if not already set
            for i, week in enumerate(weeks):
                if not week.unlock_date:
                    # Week 1 unlocks immediately, Week 2+ unlock weekly
                    weeks_since_start = i
                    unlock_date = now + timedelta(weeks=weeks_since_start)
                    
                    # Set unlock to next Monday 00:00
                    days_until_monday = (7 - unlock_date.weekday()) % 7
                    unlock_date = unlock_date + timedelta(days=days_until_monday)
                    unlock_date = unlock_date.replace(hour=0, minute=0, second=0, microsecond=0)
                    
                    # Deadline is 7 days after unlock (next Sunday 23:59)
                    deadline = unlock_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
                    
                    week.unlock_date = unlock_date
                    week.deadline = deadline
                    week.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Set Week {week.week_number} ({course.title}) to unlock on {unlock_date.strftime("%Y-%m-%d %H:%M")}'
                        )
                    )

        self.stdout.write(self.style.SUCCESS('Week unlock completed!'))