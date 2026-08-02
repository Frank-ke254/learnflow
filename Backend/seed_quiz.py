"""
Seed script to populate quiz questions for LearnFlow
Run with: python seed_quiz_questions.py
"""

import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from lessons.models import Week, Quiz, Question
from courses.models import Course


def create_week_1_quiz():
    """Create quiz for Week 1: HTML & CSS Fundamentals"""
    try:
        # Get Week 1
        week = Week.objects.get(week_number=1)
        
        # Create or get quiz
        quiz, created = Quiz.objects.get_or_create(
            week=week,
            defaults={
                'title': 'Week 1: HTML & CSS Fundamentals Quiz',
                'passing_score': 70,
                'time_limit': 15  # 15 minutes
            }
        )
        
        if created:
            print(f"✓ Created quiz: {quiz.title}")
        else:
            print(f"Quiz already exists: {quiz.title}")
            # Clear existing questions
            quiz.questions.all().delete()
            print("  Cleared old questions")
        
        # Define questions
        questions = [
            {
                'text': 'What does HTML stand for?',
                'option_a': 'Hyper Text Markup Language',
                'option_b': 'High Tech Modern Language',
                'option_c': 'Home Tool Markup Language',
                'option_d': 'Hyperlinks and Text Markup Language',
                'correct_answer': 'A',
                'explanation': 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.',
                'order': 1
            },
            {
                'text': 'Which HTML tag is used to define the largest heading?',
                'option_a': '<heading>',
                'option_b': '<h6>',
                'option_c': '<h1>',
                'option_d': '<head>',
                'correct_answer': 'C',
                'explanation': '<h1> defines the largest heading in HTML, while <h6> is the smallest.',
                'order': 2
            },
            {
                'text': 'What is the correct HTML element for inserting a line break?',
                'option_a': '<break>',
                'option_b': '<br>',
                'option_c': '<lb>',
                'option_d': '<newline>',
                'correct_answer': 'B',
                'explanation': 'The <br> tag is used to insert a line break in HTML.',
                'order': 3
            },
            {
                'text': 'Which CSS property is used to change the text color?',
                'option_a': 'text-color',
                'option_b': 'font-color',
                'option_c': 'color',
                'option_d': 'text-style',
                'correct_answer': 'C',
                'explanation': 'The "color" property is used to set the color of text in CSS.',
                'order': 4
            },
            {
                'text': 'What is the correct CSS syntax to make all <p> elements bold?',
                'option_a': 'p {font-weight: bold;}',
                'option_b': 'p {text-size: bold;}',
                'option_c': '<p style="bold">',
                'option_d': 'p {font-style: bold;}',
                'correct_answer': 'A',
                'explanation': 'The correct syntax is p {font-weight: bold;} to make all paragraph elements bold.',
                'order': 5
            },
            {
                'text': 'Which HTML attribute specifies an alternate text for an image?',
                'option_a': 'title',
                'option_b': 'alt',
                'option_c': 'src',
                'option_d': 'longdesc',
                'correct_answer': 'B',
                'explanation': 'The "alt" attribute provides alternate text for an image if it cannot be displayed.',
                'order': 6
            },
            {
                'text': 'What is the purpose of the <div> tag?',
                'option_a': 'To create a division or section',
                'option_b': 'To divide numbers',
                'option_c': 'To create a table',
                'option_d': 'To insert a video',
                'correct_answer': 'A',
                'explanation': 'The <div> tag is a container used to group elements and create sections in HTML.',
                'order': 7
            },
            {
                'text': 'Which CSS property is used to change the background color?',
                'option_a': 'color',
                'option_b': 'bgcolor',
                'option_c': 'background-color',
                'option_d': 'bg-color',
                'correct_answer': 'C',
                'explanation': 'The "background-color" property is used to set the background color of an element.',
                'order': 8
            },
            {
                'text': 'What is the correct HTML for creating a hyperlink?',
                'option_a': '<a url="http://example.com">Link</a>',
                'option_b': '<a href="http://example.com">Link</a>',
                'option_c': '<link href="http://example.com">Link</link>',
                'option_d': '<a>http://example.com</a>',
                'correct_answer': 'B',
                'explanation': 'The correct syntax is <a href="URL">Link Text</a> to create a hyperlink.',
                'order': 9
            },
            {
                'text': 'Which CSS property controls the text size?',
                'option_a': 'font-style',
                'option_b': 'text-size',
                'option_c': 'font-size',
                'option_d': 'text-style',
                'correct_answer': 'C',
                'explanation': 'The "font-size" property is used to control the size of text.',
                'order': 10
            }
        ]
        
        # Create questions
        for q_data in questions:
            question = Question.objects.create(
                quiz=quiz,
                **q_data
            )
            print(f"  ✓ Added Q{question.order}: {question.text[:40]}...")
        
        print(f"\n✅ Successfully created {len(questions)} questions for {quiz.title}")
        return quiz
        
    except Week.DoesNotExist:
        print("❌ Error: Week 1 not found. Please create weeks first.")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def create_week_2_quiz():
    """Create quiz for Week 2: Advanced CSS"""
    try:
        week = Week.objects.get(week_number=2)
        
        quiz, created = Quiz.objects.get_or_create(
            week=week,
            defaults={
                'title': 'Week 2: Advanced CSS Quiz',
                'passing_score': 70,
                'time_limit': 15
            }
        )
        
        if not created:
            quiz.questions.all().delete()
        
        questions = [
            {
                'text': 'What does CSS stand for?',
                'option_a': 'Computer Style Sheets',
                'option_b': 'Cascading Style Sheets',
                'option_c': 'Creative Style Sheets',
                'option_d': 'Colorful Style Sheets',
                'correct_answer': 'B',
                'explanation': 'CSS stands for Cascading Style Sheets.',
                'order': 1
            },
            {
                'text': 'Which CSS property is used with Flexbox to align items along the main axis?',
                'option_a': 'align-items',
                'option_b': 'justify-content',
                'option_c': 'flex-direction',
                'option_d': 'align-content',
                'correct_answer': 'B',
                'explanation': 'justify-content aligns items along the main axis in Flexbox.',
                'order': 2
            },
            {
                'text': 'What is the default value of the position property in CSS?',
                'option_a': 'relative',
                'option_b': 'absolute',
                'option_c': 'static',
                'option_d': 'fixed',
                'correct_answer': 'C',
                'explanation': 'The default value of the position property is "static".',
                'order': 3
            },
            {
                'text': 'Which CSS Grid property defines the columns?',
                'option_a': 'grid-columns',
                'option_b': 'grid-template-columns',
                'option_c': 'column-template',
                'option_d': 'grid-cols',
                'correct_answer': 'B',
                'explanation': 'grid-template-columns is used to define columns in CSS Grid.',
                'order': 4
            },
            {
                'text': 'What is the CSS box model order from inside to outside?',
                'option_a': 'Content, Padding, Border, Margin',
                'option_b': 'Content, Margin, Padding, Border',
                'option_c': 'Content, Border, Padding, Margin',
                'option_d': 'Margin, Border, Padding, Content',
                'correct_answer': 'A',
                'explanation': 'The box model order is: Content → Padding → Border → Margin.',
                'order': 5
            },
            {
                'text': 'Which pseudo-class selects an element when hovering over it?',
                'option_a': ':hover',
                'option_b': ':active',
                'option_c': ':focus',
                'option_d': ':visited',
                'correct_answer': 'A',
                'explanation': 'The :hover pseudo-class is used to select elements when hovering.',
                'order': 6
            },
            {
                'text': 'What does "rem" unit stand for in CSS?',
                'option_a': 'Relative Element Measurement',
                'option_b': 'Root Element Measurement',
                'option_c': 'Root em',
                'option_d': 'Responsive em',
                'correct_answer': 'C',
                'explanation': 'rem stands for "root em" and is relative to the root element font size.',
                'order': 7
            },
            {
                'text': 'Which CSS property creates rounded corners?',
                'option_a': 'corner-radius',
                'option_b': 'border-radius',
                'option_c': 'border-round',
                'option_d': 'corner-style',
                'correct_answer': 'B',
                'explanation': 'border-radius is used to create rounded corners.',
                'order': 8
            },
            {
                'text': 'What is the correct syntax for a CSS media query targeting screens wider than 768px?',
                'option_a': '@media (width > 768px) { }',
                'option_b': '@media screen and (min-width: 768px) { }',
                'option_c': '@media (screen-width: 768px) { }',
                'option_d': '@screen (min-width: 768px) { }',
                'correct_answer': 'B',
                'explanation': 'The correct syntax is @media screen and (min-width: 768px) { }.',
                'order': 9
            },
            {
                'text': 'Which property is used to create a CSS animation?',
                'option_a': 'transition',
                'option_b': 'animation',
                'option_c': 'transform',
                'option_d': 'keyframe',
                'correct_answer': 'B',
                'explanation': 'The "animation" property is used with @keyframes to create animations.',
                'order': 10
            }
        ]
        
        for q_data in questions:
            question = Question.objects.create(quiz=quiz, **q_data)
            print(f"  ✓ Added Q{question.order}: {question.text[:40]}...")
        
        print(f"\n✅ Successfully created {len(questions)} questions for {quiz.title}")
        return quiz
        
    except Week.DoesNotExist:
        print("❌ Error: Week 2 not found.")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def create_all_quizzes():
    """Create all quizzes"""
    print("="*60)
    print("   LEARNFLOW QUIZ SEEDER")
    print("="*60)
    print()
    
    quizzes_created = 0
    
    # Week 1
    print("Creating Week 1 Quiz...")
    print("-"*60)
    if create_week_1_quiz():
        quizzes_created += 1
    print()
    
    # Week 2
    print("Creating Week 2 Quiz...")
    print("-"*60)
    if create_week_2_quiz():
        quizzes_created += 1
    print()
    
    print("="*60)
    print(f"   COMPLETED: {quizzes_created} quizzes created")
    print("="*60)


if __name__ == '__main__':
    create_all_quizzes()