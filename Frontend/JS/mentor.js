// =============================================================
//  mentor.js — Mentor review dashboard
//  Depends on: config.js, utils.js, auth.js
//  Only loaded on: mentor-review.html
// =============================================================

let currentProject = null;

function collectRubric(prefix) {
    const syntax = Number(document.getElementById(`${prefix}Syntax`)?.value || 0);
    const structure = Number(document.getElementById(`${prefix}Structure`)?.value || 0);
    const functionality = Number(document.getElementById(`${prefix}Functionality`)?.value || 0);
    const documentation = Number(document.getElementById(`${prefix}Documentation`)?.value || 0);
    return { syntax, structure, functionality, documentation };
}

function calculateRubricTotal(prefix) {
    const r = collectRubric(prefix);
    return r.syntax + r.structure + r.functionality + r.documentation;
}

function bindRubricSummary(prefix) {
    const totalEl = document.getElementById(`${prefix}RubricTotal`);
    const ratingEl = document.getElementById(`${prefix}RubricRating`);
    const update = () => {
        const total = calculateRubricTotal(prefix);
        if (totalEl) totalEl.textContent = `${total}/12`;
        if (ratingEl) ratingEl.textContent = `${((total / 12) * 5).toFixed(2)}/5`;
    };
    ['Syntax', 'Structure', 'Functionality', 'Documentation'].forEach(metric => {
        const input = document.getElementById(`${prefix}${metric}`);
        if (input) input.addEventListener('input', update);
    });
    update();
}

document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Check if user is actually a mentor
    const userRes = await authFetch(`${CONFIG.API_BASE}/users/me/`);
    if (userRes && userRes.ok) {
        const userData = await userRes.json();
        if (userData.role !== 'mentor') {
            showToast('Access denied. Mentors only.', 'error');
            setTimeout(() => window.location.href = ROUTES.dashboard, 2000);
            return;
        }
    }

    loadPendingProjects();
}


// ── LOAD PENDING PROJECTS ────────────────────────────────────

async function loadPendingProjects() {
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/community/projects/`);
        
        if (response && response.ok) {
            const projects = await response.json();
            
            // Filter to pending projects only
            const pending = projects.filter(p => p.status === 'pending');
            
            renderQueue(pending);
        }
    } catch (err) {
        console.error('Failed to load projects:', err);
        showToast('Failed to load submissions.', 'error');
    }
}


// ── RENDER SUBMISSION QUEUE ───────────────────────────────────

function renderQueue(projects) {
    const queue = document.getElementById('submissionQueue');
    if (!queue) return;

    if (projects.length === 0) {
        queue.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-sub);">
                <p>✓ All caught up! No pending submissions.</p>
            </div>`;
        return;
    }

    queue.innerHTML = '';

    projects.forEach(project => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
            <div class="queue-info">
                <strong>${project.title}</strong>
                <p style="font-size:0.85rem; color:var(--text-sub); margin:4px 0 0 0;">
                    by @${project.author} • ${project.category}
                </p>
            </div>
            <button class="queue-btn" data-project-id="${project.id}">Review</button>
        `;
        queue.appendChild(item);
    });

    // Wire review buttons
    queue.querySelectorAll('.queue-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const projectId = Number(btn.dataset.projectId);
            const project = projects.find(p => p.id === projectId);
            if (project) showReviewPanel(project);
        });
    });
}


// ── SHOW REVIEW PANEL ─────────────────────────────────────────

function showReviewPanel(project) {
    currentProject = project;
    const panel = document.getElementById('feedbackPanel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="card-header">
            <h2>${project.title}</h2>
            <span class="week-badge" style="background:rgba(251,191,36,0.1); color:#b8860b;">PENDING</span>
        </div>

        <div style="padding:20px;">
            <div style="margin-bottom:16px;">
                <strong style="display:block; margin-bottom:4px;">Student:</strong>
                <p style="color:var(--text-sub);">@${project.author}</p>
            </div>

            <div style="margin-bottom:16px;">
                <strong style="display:block; margin-bottom:4px;">Category:</strong>
                <p style="color:var(--text-sub);">${project.category}</p>
            </div>

            <div style="margin-bottom:16px;">
                <strong style="display:block; margin-bottom:4px;">Description:</strong>
                <p style="color:var(--text-sub);">${project.description || 'No description provided.'}</p>
            </div>

            <div style="margin-bottom:16px;">
                <strong style="display:block; margin-bottom:4px;">GitHub Repository:</strong>
                <a href="${project.github_url}" target="_blank" rel="noopener noreferrer" 
                   style="color:var(--accent); text-decoration:none; font-weight:600;">
                    ${project.github_url} →
                </a>
            </div>

            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:600; margin-bottom:8px;">Feedback (Optional):</label>
                <textarea id="mentorFeedback" rows="4" 
                          placeholder="Provide constructive feedback to help the student improve..."
                          style="width:100%; padding:12px; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main); font-family:inherit; resize:vertical;"></textarea>
            </div>

            <div style="margin-bottom:20px;">
                <label style="display:block; font-weight:600; margin-bottom:8px;">Mentor Rubric (0-3 per merit)</label>
                <p style="margin:0 0 10px 0; color:var(--text-sub); font-size:0.9rem;">
                    0 = Poor, 1 = Basic, 2 = Good, 3 = Excellent
                </p>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <label>Syntax <input id="mentorSyntax" type="range" min="0" max="3" value="2"></label>
                    <label>Structure <input id="mentorStructure" type="range" min="0" max="3" value="2"></label>
                    <label>Functionality <input id="mentorFunctionality" type="range" min="0" max="3" value="2"></label>
                    <label>Documentation <input id="mentorDocumentation" type="range" min="0" max="3" value="2"></label>
                </div>
                <div style="margin-top:10px; font-weight:600; color:var(--text-main);">
                    Total: <span id="mentorRubricTotal">8/12</span> · Rating: <span id="mentorRubricRating">3.33/5</span>
                </div>
                <div style="margin-top:4px; color:var(--text-sub); font-size:0.85rem;">
                    Total score formula: 40% peer + 60% mentor.
                </div>
            </div>

            <div style="display:flex; gap:12px;">
                <button class="resume-btn" id="approveBtn" style="flex:1; background:#10b981;">
                    ✓ Approve & Complete
                </button>
                <button class="resume-btn" id="rejectBtn" style="flex:1; background:var(--danger);">
                    ✗ Needs Revision
                </button>
            </div>
        </div>
    `;

    // Wire buttons
    document.getElementById('approveBtn').addEventListener('click', approveProject);
    document.getElementById('rejectBtn').addEventListener('click', rejectProject);
    bindRubricSummary('mentor');
}


// ── APPROVE PROJECT ───────────────────────────────────────────

async function approveProject() {
    if (!currentProject) return;

    const feedback = document.getElementById('mentorFeedback')?.value || '';
    const rubric = collectRubric('mentor');

    try {
        // 1. Approve the community project
        const response = await authFetch(
            `${CONFIG.API_BASE}/community/projects/${currentProject.id}/`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'approved',
                    feedback: feedback,
                    mentor_rating: 5,
                    syntax_score: rubric.syntax,
                    structure_score: rubric.structure,
                    functionality_score: rubric.functionality,
                    documentation_score: rubric.documentation
                })
            }
        );

        if (response && response.ok) {
            showToast('✓ Project approved successfully!', 'success');
            
            // Reload queue
            setTimeout(() => {
                loadPendingProjects();
                document.getElementById('feedbackPanel').innerHTML = `
                    <div class="empty-state" style="text-align:center; padding:40px; color:var(--text-sub);">
                        <p>Select another submission to review.</p>
                    </div>`;
            }, 1500);
        } else {
            const error = await response.json();
            showToast(error.error || 'Approval failed.', 'error');
        }
    } catch (err) {
        console.error('Approve error:', err);
        showToast('Something went wrong.', 'error');
    }
}


// ── REJECT PROJECT ────────────────────────────────────────────

async function rejectProject() {
    if (!currentProject) return;

    const feedback = document.getElementById('mentorFeedback')?.value;
    const rubric = collectRubric('mentor');

    if (!feedback || feedback.trim().length < 10) {
        showToast('Please provide feedback explaining what needs revision.', 'warning');
        return;
    }

    try {
        const response = await authFetch(
            `${CONFIG.API_BASE}/community/projects/${currentProject.id}/`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'needs_revision',
                    feedback: feedback,
                    mentor_rating: 3,
                    syntax_score: rubric.syntax,
                    structure_score: rubric.structure,
                    functionality_score: rubric.functionality,
                    documentation_score: rubric.documentation
                })
            }
        );

        if (response && response.ok) {
            showToast('✓ Feedback sent to student.', 'success');
            
            // Reload queue
            setTimeout(() => {
                loadPendingProjects();
                document.getElementById('feedbackPanel').innerHTML = `
                    <div class="empty-state" style="text-align:center; padding:40px; color:var(--text-sub);">
                        <p>Select another submission to review.</p>
                    </div>`;
            }, 1500);
        } else {
            const error = await response.json();
            showToast(error.error || 'Update failed.', 'error');
        }
    } catch (err) {
        console.error('Reject error:', err);
        showToast('Something went wrong.', 'error');
    }
}