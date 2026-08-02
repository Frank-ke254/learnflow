# check_and_publish_topics.py
# Run: python manage.py shell < check_and_publish_topics.py

from dashboard.models import SkillTopic

print("\n" + "="*60)
print("CHECKING TOPIC STATUS")
print("="*60 + "\n")

all_topics = SkillTopic.objects.all().order_by('week__number', 'order')

print(f"Total topics: {all_topics.count()}\n")

unpublished = []
published = []

for topic in all_topics:
    status = "PUBLISHED ✓" if topic.is_published else "UNPUBLISHED ✗"
    week_info = f"Week {topic.week.number}" if topic.week else "No Week"
    
    print(f"ID: {topic.id:3} | {week_info} | Order: {topic.order:2} | {status} | {topic.title}")
    
    if not topic.is_published:
        unpublished.append(topic)
    else:
        published.append(topic)

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print(f"Published: {len(published)}")
print(f"Unpublished: {len(unpublished)}")

if unpublished:
    print(f"\n🔧 FIXING: Publishing {len(unpublished)} topics...")
    for topic in unpublished:
        topic.is_published = True
        topic.save()
        print(f"  ✓ Published: {topic.title}")
    
    print("\n✅ All topics are now published!")

print("\n" + "="*60)
print("AVAILABLE LESSON URLs")
print("="*60)

for topic in SkillTopic.objects.filter(is_published=True, week__isnull=False)[:5]:
    print(f"lesson.html?week={topic.week.number}&topic={topic.id} - {topic.title}")

print("\n")