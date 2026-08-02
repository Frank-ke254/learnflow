# seed_skill_topics_content.py
# Run using: python manage.py shell
# exec(open('seed_skill_topics_content.py').read())

from dashboard.models import SkillWeek, SkillTopic

print("Seeding Week 1 topics with detailed beginner-friendly content...")

# Get or create Week 1
week, created = SkillWeek.objects.get_or_create(
    number=1,
    defaults={
        "title": "Week 1: HTML & CSS Foundations",
        "description": "Learn the basics of how websites are structured and styled."
    }
)

# Clear existing topics to avoid duplicates
SkillTopic.objects.filter(week=week).delete()

# -----------------------------
# Topic 1: HTML Structure
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="HTML Structure & Tags",
    description="Understand how a web page is built using HTML.",
    duration="20 minutes",
    order=1,
    content="""
<h2>What is HTML?</h2>
<p>
HTML stands for <strong>HyperText Markup Language</strong>. It is the language used to create the structure of web pages.
Think of HTML as the <strong>skeleton</strong> of a website — it defines what appears on the page, such as headings, text, images, and links.
</p>

<h3>Basic HTML Page Structure</h3>
<pre>
&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;head&gt;
    &lt;title&gt;My First Web Page&lt;/title&gt;
  &lt;/head&gt;
  &lt;body&gt;
    &lt;h1&gt;Hello World&lt;/h1&gt;
    &lt;p&gt;This is my first website.&lt;/p&gt;
  &lt;/body&gt;
&lt;/html&gt;
</pre>

<p>
Every HTML page has these main parts:
</p>
<ul>
<li><strong>&lt;html&gt;</strong> — the root element</li>
<li><strong>&lt;head&gt;</strong> — contains page information</li>
<li><strong>&lt;body&gt;</strong> — contains visible content</li>
</ul>

<h3>Common HTML Tags</h3>
<ul>
<li>&lt;h1&gt; to &lt;h6&gt; — headings</li>
<li>&lt;p&gt; — paragraph</li>
<li>&lt;a&gt; — link</li>
<li>&lt;img&gt; — image</li>
<li>&lt;div&gt; — container</li>
</ul>
""",
    sections=[
        {
            "title": "What is HTML",
            "content": "HTML is used to structure content on the web."
        },
        {
            "title": "Page Structure",
            "content": "Every web page contains html, head, and body sections."
        },
        {
            "title": "Common Tags",
            "content": "Tags define elements like text, images, and links."
        }
    ],
    key_points=[
        "HTML creates the structure of a web page",
        "Tags are used to define content",
        "Every page has html, head, and body"
    ]
)

# -----------------------------
# Topic 2: CSS Box Model
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="CSS Box Model",
    description="Learn how spacing and layout work in CSS.",
    duration="25 minutes",
    order=2,
    content="""
<h2>What is CSS?</h2>
<p>
CSS stands for <strong>Cascading Style Sheets</strong>. It is used to style and design web pages.
CSS controls colors, spacing, layout, fonts, and responsiveness.
</p>

<h3>The CSS Box Model</h3>
<p>
Every element on a web page is treated like a rectangular box.
This box has four parts:
</p>

<ul>
<li><strong>Content</strong> — the text or image</li>
<li><strong>Padding</strong> — space inside the box</li>
<li><strong>Border</strong> — the edge around the box</li>
<li><strong>Margin</strong> — space outside the box</li>
</ul>

<h3>Example CSS</h3>
<pre>
div {
  width: 200px;
  padding: 20px;
  border: 2px solid black;
  margin: 10px;
}
</pre>

<p>
Understanding the box model is important because it controls spacing and layout.
</p>
""",
    sections=[
        {
            "title": "CSS Basics",
            "content": "CSS is used to style HTML elements."
        },
        {
            "title": "Box Model Components",
            "content": "Content, padding, border, and margin form the box model."
        }
    ],
    key_points=[
        "CSS controls layout and design",
        "Every element is a box",
        "Margins create space outside elements"
    ]
)

# -----------------------------
# Topic 3: Flexbox Layout
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Flexbox Layout Basics",
    description="Learn how to arrange elements in rows and columns.",
    duration="25 minutes",
    order=3,
    content="""
<h2>What is Flexbox?</h2>
<p>
Flexbox is a layout system in CSS that allows you to align and distribute elements efficiently.
It is commonly used to create navigation bars, card layouts, and responsive designs.
</p>

<h3>Basic Flexbox Example</h3>
<pre>
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</pre>

<p>
This will arrange items in a row and space them evenly.
</p>

<h3>Common Flexbox Properties</h3>
<ul>
<li>display: flex</li>
<li>justify-content</li>
<li>align-items</li>
<li>flex-direction</li>
</ul>
""",
    sections=[
        {
            "title": "Flexbox Purpose",
            "content": "Flexbox helps align elements easily."
        },
        {
            "title": "Key Properties",
            "content": "Use justify-content and align-items to control layout."
        }
    ],
    key_points=[
        "Flexbox arranges elements",
        "Used for responsive layouts",
        "Simplifies alignment"
    ]
)

# -----------------------------
# Topic 4: Weekly Project
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Week 1 Project: Build a Landing Page",
    description="Apply HTML and CSS skills to build a simple webpage.",
    duration="1 hour",
    order=13,
    content="""
<h2>Week 1 Project</h2>

<p>
You will build a simple landing page using HTML and CSS.
This project helps you practice everything learned this week.
</p>

<h3>Project Requirements</h3>
<ul>
<li>Create a header section</li>
<li>Add a navigation menu</li>
<li>Add an image</li>
<li>Add at least two sections of content</li>
<li>Style the page using CSS</li>
<li>Make the layout responsive</li>
</ul>

<h3>Submission Instructions</h3>
<ol>
<li>Create a GitHub repository</li>
<li>Upload your project files</li>
<li>Copy the repository link</li>
<li>Submit the link in the platform</li>
</ol>

<h3>Example Repository Name</h3>
<pre>
week-1-landing-page
</pre>
""",
    sections=[
        {
            "title": "Project Goal",
            "content": "Build a simple responsive landing page."
        }
    ],
    key_points=[
        "Apply HTML and CSS skills",
        "Practice layout design",
        "Submit GitHub repository"
    ]
)

print("SUCCESS: Detailed beginner-friendly Week 1 content created.")
