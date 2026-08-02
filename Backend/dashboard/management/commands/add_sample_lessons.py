from django.core.management.base import BaseCommand
from dashboard.models import SkillWeek, SkillTopic


class Command(BaseCommand):
    help = 'Add sample lesson content'

    def handle(self, *args, **kwargs):
        # Create Week 1
        week1, created = SkillWeek.objects.get_or_create(
            number=1,
            defaults={
                'title': 'HTML & CSS Fundamentals',
                'description': 'Master the basics of web development'
            }
        )
        
        # Create sample lesson
        lesson1 = SkillTopic.objects.create(
            week=week1,
            title='Introduction to HTML5',
            description='Learn the fundamentals of HTML5 and semantic elements',
            duration='15 minutes',
            order=1,
            content='''
            <section id="intro">
                <h2>What is HTML?</h2>
                <p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p>
                
                <div class="info-card">
                    <div class="info-card-icon">💡</div>
                    <div class="info-card-content">
                        <h4>Key Concept</h4>
                        <p>HTML5 introduced semantic elements that give meaning to your content.</p>
                    </div>
                </div>
            </section>
            
            <section id="example">
                <h2>Basic Example</h2>
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-language">HTML</span>
                        <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                    </div>
                    <pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html lang="en"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;My Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Hello World&lt;/h1&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>
                </div>
            </section>
            ''',
            key_points=[
                'HTML is the standard markup language',
                'Use semantic elements for better structure',
                'Always include DOCTYPE declaration'
            ]
        )
        
        self.stdout.write(self.style.SUCCESS('Successfully added sample lessons'))