// =============================================================
//  my-projects.js — My Projects page (user's own submissions)
//  Depends on: config.js, utils.js, auth.js
//  Only loaded on: projects.html
// =============================================================

let myProjects = [];
let currentFilter = 'all';
let currentUsername = '';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await getCurrentUser();
    await loadMyProjects();
    setupFilters();
}


// ── GET CURRENT USER ──────────────────────────────────────────

async function getCurrentUser() {
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/users/me/`);
        if (response && response.ok) {
            const userData = await response.json();
            currentUsername = userData.username;
        }
    } catch (err) {
        console.error('Failed to get user:', err);
    }
}


// ── LOAD MY PROJECTS ──────────────────────────────────────────

async function loadMyProjects() {
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/community/projects/`);
        
        if (response && response.ok) {
            const allProjects = await response.json();
            
            // Filter to ONLY current user's projects
            myProjects = allProjects.filter(p => p.author === currentUsername);
            
            renderProjects(myProjects);
        }
    } catch (err) {
        console.error('Failed to load projects:', err);
        showToast('Failed to load your projects.', 'error');
    }
}


// ── RENDER PROJECTS GRID ──────────────────────────────────────

function renderProjects(projects) {
    const grid = document.getElementById('myProjectsGrid');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:60px;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" stroke-width="1.5" style="margin:0 auto 20px;">
                    <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z"/>
                </svg>
                <p style="font-size:1.1rem; color:var(--text-main); margin-bottom:8px;">
                    ${currentFilter === 'all' 
                        ? 'No projects yet' 
                        : `No ${currentFilter.replace('_', ' ')} projects`}
                </p>
                <p style="color:var(--text-sub);">
                    Complete lessons and submit your work to see it here.
                </p>
            </div>`;
        return;
    }

    grid.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const submittedDate = new Date(project.submitted_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Status badge styling
        let statusBadge = '';
        if (project.status === 'approved') {
            statusBadge = '<span class="status-badge status-approved">✓ APPROVED</span>';
        } else if (project.status === 'pending') {
            statusBadge = '<span class="status-badge status-pending">⏳ PENDING REVIEW</span>';
        } else if (project.status === 'needs_revision') {
            statusBadge = '<span class="status-badge status-revision">🔄 NEEDS REVISION</span>';
        }

        card.innerHTML = `
            <div class="project-card-header">
                <span class="project-category">${project.category}</span>
                ${statusBadge}
            </div>
            
            <div class="project-card-body">
                <h3>${project.title}</h3>
                <p class="project-description">${project.description || 'No description provided.'}</p>
                
                ${project.feedback ? `
                    <div class="mentor-feedback">
                        <strong>Mentor Feedback:</strong>
                        <p>${project.feedback}</p>
                    </div>
                ` : ''}
                
                <div class="project-meta">
                    <span class="project-date">Submitted ${submittedDate}</span>
                </div>
            </div>
            
            <div class="project-card-footer">
                <a href="${project.github_url}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="view-code-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                    </svg>
                    View Repository
                </a>
            </div>
        `;
        
        grid.appendChild(card);
    });
}


// ── FILTER SETUP ──────────────────────────────────────────────

function setupFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active state
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Filter projects by status
            currentFilter = tab.dataset.filter;
            
            if (currentFilter === 'all') {
                renderProjects(myProjects);
            } else {
                const filtered = myProjects.filter(p => p.status === currentFilter);
                renderProjects(filtered);
            }
        });
    });
}