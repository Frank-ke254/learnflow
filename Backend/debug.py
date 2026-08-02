# python manage.py shell

from dashboard.models import SkillWeek, SkillTopic, TopicCompletion
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(username='Lucy')  # Replace with actual username

print("\n=== WEEK ANALYSIS ===\n")

for week in SkillWeek.objects.all().order_by('number'):
    total = week.topics.filter(is_published=True).count()
    completed = week.topics.filter(is_published=True, completed_by=user).count()
    
    print(f"Week {week.number}: {week.title}")
    print(f"  Progress: {completed}/{total} ({completed/total*100 if total > 0 else 0:.0f}%)")
    print(f"  Status: {'COMPLETE' if completed == total else 'IN PROGRESS' if completed > 0 else 'NOT STARTED'}")
    
    # Show first incomplete topic
    first_incomplete = week.topics.filter(
        is_published=True
    ).exclude(completed_by=user).first()
    
    if first_incomplete:
        print(f"  Next lesson: {first_incomplete.title} (ID: {first_incomplete.id})")
        print(f"  Resume URL: lesson.html?week={week.number}&topic={first_incomplete.id}")
    
    print()

print("=== CURRENT WEEK SHOULD BE ===")
# Find first week with incomplete topics
for week in SkillWeek.objects.all().order_by('number'):
    total = week.topics.filter(is_published=True).count()
    completed = week.topics.filter(is_published=True, completed_by=user).count()
    
    if completed < total:
        print(f"Week {week.number}")
        break