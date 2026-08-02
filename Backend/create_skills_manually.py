# Run this in Django shell to manually create skills
# python manage.py shell

from dashboard.models import Skill, SkillTopic
from courses.models import Enrollment
from users.models import User

# Get your user (replace 'your_username' with actual username)
user = User.objects.get(username='Lucy')

# Get active enrollment
enrollment = Enrollment.objects.filter(user=user, is_active=True).first()

if not enrollment:
    print("No active enrollment found!")
else:
    print(f"Found enrollment: {enrollment.course.title}")
    
    # Delete any existing skills to start fresh
    Skill.objects.filter(user=user).delete()
    
    # Front-End Web Development skills
    skill1 = Skill.objects.create(
        user=user,
        course=enrollment.course,
        name='1. HTML & CSS Fundamentals',
        description='Learn semantic HTML5 and modern CSS3 styling.',
        order=1
    )
    
    # Create topics for skill 1
    SkillTopic.objects.create(skill=skill1, title='HTML Structure & Tags', content_type='video', order=1)
    SkillTopic.objects.create(skill=skill1, title='CSS Box Model', content_type='video', order=2)
    SkillTopic.objects.create(skill=skill1, title='Flexbox & Grid Layouts', content_type='quiz', order=3)
    SkillTopic.objects.create(skill=skill1, title='Build a Landing Page', content_type='project', order=4)
    
    skill2 = Skill.objects.create(
        user=user,
        course=enrollment.course,
        name='2. JavaScript Essentials',
        description='Master vanilla JavaScript fundamentals.',
        order=2
    )
    
    SkillTopic.objects.create(skill=skill2, title='Variables & Data Types', content_type='video', order=1)
    SkillTopic.objects.create(skill=skill2, title='Functions & Scope', content_type='video', order=2)
    SkillTopic.objects.create(skill=skill2, title='DOM Manipulation', content_type='quiz', order=3)
    SkillTopic.objects.create(skill=skill2, title='Interactive Web App', content_type='project', order=4)
    
    skill3 = Skill.objects.create(
        user=user,
        course=enrollment.course,
        name='3. Responsive Design',
        description='Build mobile-first, accessible interfaces.',
        order=3
    )
    
    SkillTopic.objects.create(skill=skill3, title='Media Queries', content_type='video', order=1)
    SkillTopic.objects.create(skill=skill3, title='Mobile Navigation Patterns', content_type='reading', order=2)
    SkillTopic.objects.create(skill=skill3, title='Accessibility Basics', content_type='quiz', order=3)
    SkillTopic.objects.create(skill=skill3, title='Portfolio Website', content_type='capstone', order=4, requires_mentor=True)
    
    print("✓ Created 3 skills with topics!")
    print("Skills page should now show content.")


    