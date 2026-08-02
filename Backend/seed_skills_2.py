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
# Topic 4: Lists and Links
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Working with Lists and Links",
    description="Learn how to organize information using lists and create navigation links.",
    duration="20 minutes",
    order=4,
    content="""
<h2>Lists in HTML</h2>
<p>
Lists help organize content in a clear and readable way. They are commonly used for menus, instructions, and features.
</p>

<h3>Types of Lists</h3>
<ul>
<li><strong>Ordered List</strong> — numbered items</li>
<li><strong>Unordered List</strong> — bullet points</li>
</ul>

<h3>Example</h3>
<pre>
&lt;ul&gt;
  &lt;li&gt;Home&lt;/li&gt;
  &lt;li&gt;About&lt;/li&gt;
  &lt;li&gt;Contact&lt;/li&gt;
&lt;/ul&gt;
</pre>

<h3>Links</h3>
<p>
Links allow users to navigate between pages.
</p>

<pre>
&lt;a href="https://example.com"&gt;Visit Website&lt;/a&gt;
</pre>
""",
    sections=[
        {"title": "Lists", "content": "Lists organize information."},
        {"title": "Links", "content": "Links connect web pages."}
    ],
    key_points=[
        "Lists organize content",
        "Links connect pages",
        "Navigation uses links"
    ]
)

# -----------------------------
# Topic 5: Images and Media
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Adding Images to Web Pages",
    description="Learn how to display images on a webpage.",
    duration="20 minutes",
    order=5,
    content="""
<h2>Images in HTML</h2>
<p>
Images make websites more engaging and easier to understand.
</p>

<h3>Image Tag</h3>
<pre>
&lt;img src="image.jpg" alt="Description" width="300"&gt;
</pre>

<p>
The <strong>alt</strong> attribute describes the image and improves accessibility.
</p>
""",
    sections=[
        {"title": "Image Tag", "content": "Use img to display images."}
    ],
    key_points=[
        "Images improve user experience",
        "Always use alt text",
        "Images require a source"
    ]
)

# -----------------------------
# Topic 6: Forms Basics
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="HTML Forms Basics",
    description="Learn how to collect user input using forms.",
    duration="25 minutes",
    order=6,
    content="""
<h2>What is a Form?</h2>
<p>
Forms allow users to send information to a website. For example, login forms, registration forms, and contact forms.
</p>

<h3>Basic Form Example</h3>
<pre>
&lt;form&gt;
  &lt;label&gt;Name:&lt;/label&gt;
  &lt;input type="text"&gt;
  &lt;button&gt;Submit&lt;/button&gt;
&lt;/form&gt;
</pre>
""",
    sections=[
        {"title": "Form Purpose", "content": "Forms collect user data."}
    ],
    key_points=[
        "Forms collect input",
        "Inputs capture data",
        "Buttons submit forms"
    ]
)

# -----------------------------
# Topic 7: CSS Colors and Fonts
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Styling Text with Colors and Fonts",
    description="Learn how to style text using CSS.",
    duration="20 minutes",
    order=7,
    content="""
<h2>Colors in CSS</h2>
<p>
Colors make websites visually appealing and help users understand content.
</p>

<h3>Example</h3>
<pre>
p {
  color: blue;
  font-size: 18px;
}
</pre>
""",
    sections=[
        {"title": "Text Styling", "content": "CSS styles text."}
    ],
    key_points=[
        "CSS controls colors",
        "Fonts affect readability",
        "Design improves user experience"
    ]
)

# -----------------------------
# Topic 8: Spacing and Layout
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Spacing and Layout",
    description="Understand margins, padding, and spacing.",
    duration="20 minutes",
    order=8,
    content="""
<h2>Spacing in CSS</h2>
<p>
Spacing helps organize content and improves readability.
</p>

<pre>
div {
  margin: 10px;
  padding: 15px;
}
</pre>
""",
    sections=[
        {"title": "Spacing", "content": "Margins and padding control spacing."}
    ],
    key_points=[
        "Spacing improves layout",
        "Margins add outside space",
        "Padding adds inside space"
    ]
)

# -----------------------------
# Topic 9: Responsive Design Basics
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Responsive Design Basics",
    description="Learn how websites adapt to different screen sizes.",
    duration="25 minutes",
    order=9,
    content="""
<h2>Responsive Design</h2>
<p>
Responsive design ensures websites work on phones, tablets, and computers.
</p>

<h3>Media Query Example</h3>
<pre>
@media (max-width: 600px) {
  body {
    background-color: lightgray;
  }
}
</pre>
""",
    sections=[
        {"title": "Responsive", "content": "Websites adapt to screen sizes."}
    ],
    key_points=[
        "Responsive design supports mobile devices",
        "Media queries adjust layout",
        "Mobile-first design is important"
    ]
)

# -----------------------------
# Topic 10: Navigation Bar
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Building a Navigation Bar",
    description="Create a simple website navigation menu.",
    duration="25 minutes",
    order=10,
    content="""
<h2>Navigation Bars</h2>
<p>
Navigation bars help users move between pages.
</p>

<pre>
nav {
  background: black;
  color: white;
}
</pre>
""",
    sections=[
        {"title": "Navigation", "content": "Menus guide users."}
    ],
    key_points=[
        "Navigation improves usability",
        "Menus organize pages",
        "Users rely on navigation"
    ]
)

# -----------------------------
# Topic 11: Debugging HTML and CSS
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Debugging HTML and CSS",
    description="Learn how to fix common errors in web pages.",
    duration="20 minutes",
    order=11,
    content="""
<h2>Debugging</h2>
<p>
Debugging means finding and fixing errors in code.
</p>

<ul>
<li>Check spelling</li>
<li>Check closing tags</li>
<li>Use browser developer tools</li>
</ul>
""",
    sections=[
        {"title": "Debugging", "content": "Fix errors in code."}
    ],
    key_points=[
        "Errors are normal",
        "Debugging improves code",
        "Developers test their work"
    ]
)

# -----------------------------
# Topic 12: Version Control Basics
# -----------------------------
SkillTopic.objects.create(
    week=week,
    title="Introduction to Git and GitHub",
    description="Understand how to save and share code using GitHub.",
    duration="25 minutes",
    order=12,
    content="""
<h2>What is GitHub?</h2>
<p>
GitHub is a platform where developers store and share code. It helps teams collaborate and track changes.
</p>

<h3>Basic Workflow</h3>
<ol>
<li>Create a repository</li>
<li>Add files</li>
<li>Commit changes</li>
<li>Push to GitHub</li>
</ol>
""",
    sections=[
        {"title": "GitHub", "content": "Stores and shares code."}
    ],
    key_points=[
        "GitHub stores projects",
        "Repositories hold files",
        "Version control tracks changes"
    ]
)

# -----------------------------
# Topic 13: Weekly Project
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
