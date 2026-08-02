from courses.models import Enrollment
from users.models import User

# Get your user
user = User.objects.get(username='Lucy')  # Replace with your username

# Get active enrollment
enrollment = Enrollment.objects.filter(user=user, is_active=True).first()

if not enrollment:
    print("No active enrollment found!")
else:
    print(f"Found enrollment: {enrollment.course.title}")
    
    # Delete existing skills to avoid duplicates
from dashboard.models import Skill
deleted_count = Skill.objects.filter(user=user).count()
Skill.objects.filter(user=user).delete()
print(f"Deleted {deleted_count} existing skills")
    
    # Manually trigger the signal by re-saving the enrollment
    # This will call create_skills_on_enrollment but with created=False
    # So we need to call the signal function directly instead
    
from dashboard.signals import create_skills_on_enrollment

# Call the signal handler directly with created=True
create_skills_on_enrollment(
    sender=Enrollment,
    instance=enrollment,
    created=True,  # Pretend it was just created
    **{}
)

# Check how many skills were created
skill_count = Skill.objects.filter(user=user).count()
print(f"Created {skill_count} skills!")

if skill_count > 0:
    print("Success! Go to the Skills page - it should now show your skills.")
else:
    print("No skills created. Check that:")
    print("1. Course title exactly matches one in COURSE_SKILL_TEMPLATES")
    print(f"2. Your course title is: '{enrollment.course.title}'")