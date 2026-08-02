document.addEventListener('DOMContentLoaded', () => {
    loadProjectDetails();
});

function loadProjectDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const week = urlParams.get('week') || 1;
    
    // Update UI elements
    const weekBreadcrumb = document.getElementById('weekBreadcrumb');
    const weekBadge = document.getElementById('weekBadge');
    
    if (weekBreadcrumb) weekBreadcrumb.textContent = `Week ${week}`;
    if (weekBadge) weekBadge.textContent = `WEEK ${week}`;
    
    // Mock project data since we don't have a specific project API yet
    const projects = {
        1: {
            title: "Build a Responsive Landing Page",
            time: "2-3 hours",
            desc: "<p>Apply your newly acquired HTML and CSS skills to build a fully responsive landing page from scratch. You will need to implement a navigation bar, a hero section, and a responsive grid layout for features.</p><p>This project will test your understanding of semantic HTML structure, CSS Flexbox and Grid, and media queries for responsive design.</p>",
            reqs: `
                <ul>
                    <li>Create a semantic HTML5 structure with header, main section, and footer</li>
                    <li>Style the application using modern CSS (Flexbox or Grid for layout)</li>
                    <li>Ensure the page is fully responsive on mobile and desktop devices</li>
                    <li>Include at least 3 distinct sections (e.g., Hero, Features, Contact)</li>
                    <li>Implement professional hover states for buttons and links</li>
                </ul>`
        },
        2: {
            title: "Interactive JavaScript To-Do App",
            time: "3-4 hours",
            desc: "<p>Build a dynamic, interactive To-Do list application using vanilla JavaScript. You will manage state, handle user inputs, and update the DOM dynamically without page reloads.</p>",
            reqs: `
                <ul>
                    <li>Allow users to add, edit, and delete tasks</li>
                    <li>Implement a feature to mark tasks as complete</li>
                    <li>Persist data using localStorage so tasks remain after refresh</li>
                    <li>Filter tasks by All, Active, and Completed states</li>
                </ul>`
        },
        // default fallback
        default: {
            title: `Week ${week} Capstone Project`,
            time: "3-5 hours",
            desc: "<p>Apply everything you've learned this week to build a comprehensive project. Make sure to follow best practices and create clean, well-commented code.</p>",
            reqs: `
                <ul>
                    <li>Meet all functional requirements discussed in this week's lessons</li>
                    <li>Ensure code quality and readability</li>
                    <li>Deploy the code to a public repository</li>
                </ul>`
        }
    };
    
    const project = projects[week] || projects['default'];
    
    document.getElementById('projectTitle').textContent = project.title;
    document.getElementById('estimatedTime').textContent = project.time;
    
    document.getElementById('projectDescription').innerHTML = project.desc;
    document.getElementById('projectRequirements').innerHTML = project.reqs;
}

function submitProject() {
    const urlParams = new URLSearchParams(window.location.search);
    const week = urlParams.get('week') || 1;
    // Redirect to the submissions page
    window.location.href = `submissions.html?week=${week}`;
}
