from django.db.models.signals import post_save
from django.dispatch import receiver
from courses.models import Enrollment
from .models import Skill, UserStats, Activity
from lessons.models import UserProgress


# Skill templates for each course - matches the ones from the skills app
COURSE_SKILL_TEMPLATES = {
    'Front-End Web Development': [
        {
            'name': '1. HTML & CSS Fundamentals',
            'description': 'Learn semantic HTML5 and modern CSS3 styling.',
            'order': 1,
            'topics': [
                {'title': 'HTML Structure & Tags', 'type': 'video', 'order': 1},
                {'title': 'CSS Box Model', 'type': 'video', 'order': 2},
                {'title': 'Flexbox & Grid Layouts', 'type': 'quiz', 'order': 3},
                {'title': 'Build a Landing Page', 'type': 'project', 'order': 4},
            ]
        },
        {
            'name': '2. JavaScript Essentials',
            'description': 'Master vanilla JavaScript fundamentals.',
            'order': 2,
            'topics': [
                {'title': 'Variables & Data Types', 'type': 'video', 'order': 1},
                {'title': 'Functions & Scope', 'type': 'video', 'order': 2},
                {'title': 'DOM Manipulation', 'type': 'quiz', 'order': 3},
                {'title': 'Interactive Web App', 'type': 'project', 'order': 4},
            ]
        },
        {
            'name': '3. Responsive Design',
            'description': 'Build mobile-first, accessible interfaces.',
            'order': 3,
            'topics': [
                {'title': 'Media Queries', 'type': 'video', 'order': 1},
                {'title': 'Mobile Navigation Patterns', 'type': 'reading', 'order': 2},
                {'title': 'Accessibility Basics', 'type': 'quiz', 'order': 3},
                {'title': 'Portfolio Website', 'type': 'capstone', 'order': 4, 'requires_mentor': True},
            ]
        },
    ],
    'Python & Data Science': [
        {
            'name': '1. Python Fundamentals',
            'description': 'Core Python syntax and programming concepts.',
            'order': 1,
            'topics': [
                {'title': 'Variables & Control Flow', 'type': 'video', 'order': 1},
                {'title': 'Functions & Modules', 'type': 'video', 'order': 2},
                {'title': 'File I/O', 'type': 'quiz', 'order': 3},
                {'title': 'CLI Tool Project', 'type': 'project', 'order': 4},
            ]
        },
        {
            'name': '2. NumPy & Pandas',
            'description': 'Data manipulation with Python libraries.',
            'order': 2,
            'topics': [
                {'title': 'NumPy Arrays', 'type': 'video', 'order': 1},
                {'title': 'Pandas DataFrames', 'type': 'video', 'order': 2},
                {'title': 'Data Cleaning', 'type': 'quiz', 'order': 3},
                {'title': 'Data Analysis Report', 'type': 'capstone', 'order': 4, 'requires_mentor': True},
            ]
        },
    ],
    'Graphic Design & UI/UX': [
        {
            'name': '1. Design Principles',
            'description': 'Fundamentals of visual design and composition.',
            'order': 1,
            'topics': [
                {'title': 'Color Theory', 'type': 'video', 'order': 1},
                {'title': 'Typography Basics', 'type': 'video', 'order': 2},
                {'title': 'Layout Composition', 'type': 'quiz', 'order': 3},
                {'title': 'Brand Identity Project', 'type': 'project', 'order': 4},
            ]
        },
        {
            'name': '2. Figma & Prototyping',
            'description': 'Create interactive prototypes in Figma.',
            'order': 2,
            'topics': [
                {'title': 'Figma Interface', 'type': 'video', 'order': 1},
                {'title': 'Components & Auto Layout', 'type': 'video', 'order': 2},
                {'title': 'Prototyping & Animations', 'type': 'quiz', 'order': 3},
                {'title': 'Mobile App Design', 'type': 'capstone', 'order': 4, 'requires_mentor': True},
            ]
        },
    ],
    'Digital Marketing & SEO': [
        {
            'name': '1. Marketing Fundamentals',
            'description': 'Core digital marketing concepts and channels.',
            'order': 1,
            'topics': [
                {'title': 'Marketing Channels Overview', 'type': 'video', 'order': 1},
                {'title': 'Content Marketing', 'type': 'reading', 'order': 2},
                {'title': 'Social Media Strategy', 'type': 'quiz', 'order': 3},
                {'title': 'Campaign Plan', 'type': 'project', 'order': 4},
            ]
        },
        {
            'name': '2. SEO Mastery',
            'description': 'Search engine optimization best practices.',
            'order': 2,
            'topics': [
                {'title': 'Keyword Research', 'type': 'video', 'order': 1},
                {'title': 'On-Page SEO', 'type': 'video', 'order': 2},
                {'title': 'Technical SEO', 'type': 'quiz', 'order': 3},
                {'title': 'SEO Audit & Report', 'type': 'capstone', 'order': 4, 'requires_mentor': True},
            ]
        },
    ],
}


@receiver(post_save, sender=Enrollment)
def create_skills_on_enrollment(sender, instance, created, **kwargs):
    """
    When a user enrolls in a course, auto-create their skill modules.
    """
    if not created or not instance.is_active:
        return

    course_title = instance.course.title
    templates = COURSE_SKILL_TEMPLATES.get(course_title, [])

    if templates:
        for skill_data in templates:
            # Keep old Skill modules for compatibility with skills endpoints.
            Skill.objects.get_or_create(
                user=instance.user,
                course=instance.course,
                name=skill_data['name'],
                defaults={
                    'description': skill_data['description'],
                    'order': skill_data['order'],
                }
            )
    else:
        # Ensure at least one skill exists for courses without a template.
        Skill.objects.get_or_create(
            user=instance.user,
            course=instance.course,
            name=f"1. {instance.course.title} Core Track",
            defaults={
                'description': instance.course.description or 'Core learning path for this course.',
                'order': 1,
            }
        )

    # NEW lesson system alignment: initialize per-course lesson progress row.
    UserProgress.objects.get_or_create(
        user=instance.user,
        course=instance.course,
        defaults={
            'current_week': 1,
            'completed_weeks': [],
        }
    )

    # Ensure stats exists and log enrollment activity.
    UserStats.objects.get_or_create(user=instance.user)
    Activity.create_course_enrolled(instance.user, instance.course.title)