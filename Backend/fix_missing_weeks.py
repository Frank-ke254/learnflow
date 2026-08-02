# fix_missing_weeks_v2.py
# Run: python manage.py shell < fix_missing_weeks_v2.py

from django.db import models
from dashboard.models import SkillWeek, SkillTopic

print("\n" + "="*60)
print("FIXING TOPICS WITH MISSING WEEKS (v2)")
print("="*60 + "\n")

# Get or create Week 1
week1, created = SkillWeek.objects.get_or_create(
    number=1,
    defaults={
        'title': 'HTML & CSS Fundamentals',
        'description': 'Master web development basics'
    }
)

if created:
    print(f"Created: {week1}")
else:
    print(f"Using existing: {week1}")

# Find topics without a week
orphan_topics = SkillTopic.objects.filter(week__isnull=True)
print(f"\nFound {orphan_topics.count()} topics without a week\n")

# Get the highest order number currently in Week 1
max_order = SkillTopic.objects.filter(week=week1).aggregate(
    models.Max('order')
)['order__max'] or 0

print(f"Current max order in Week 1: {max_order}")
print(f"Starting new topics at order: {max_order + 1}\n")

# Assign orphan topics to Week 1 with sequential orders
for i, topic in enumerate(orphan_topics, start=max_order + 1):
    topic.week = week1
    topic.order = i
    topic.save()
    print(f"Fixed: {topic.title} (order: {i})")

print("\n" + "="*60)
print("VERIFICATION")
print("="*60 + "\n")

# Show all topics with their weeks
all_topics = SkillTopic.objects.all().order_by('week__number', 'order')

for topic in all_topics:
    if topic.week:
        print(f"ID: {topic.id}, Week: {topic.week.number}, Order: {topic.order}, Title: {topic.title}")
    else:
        print(f"ID: {topic.id}, Week: NONE, Title: {topic.title}")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print(f"Total Topics: {SkillTopic.objects.count()}")
print(f"Topics with Week: {SkillTopic.objects.filter(week__isnull=False).count()}")
print(f"Topics without Week: {SkillTopic.objects.filter(week__isnull=True).count()}")

# Show some valid URLs
print("\nVALID URLs:")
for topic in SkillTopic.objects.filter(week__isnull=False)[:5]:
    print(f"  lesson.html?week={topic.week.number}&topic={topic.id} - {topic.title}")

print("\n")