// =============================================================
//  community.js — Community feed: peer projects + skill gating
//  Depends on: config.js, utils.js, auth.js (load all before this)
//  Only loaded on: community.html
// =============================================================

document.addEventListener('DOMContentLoaded', initCommunity);

function openPeerReviewModal(projectId) {
    const existing = document.getElementById('peerReviewModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'peerReviewModal';
    modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:9999;';
    modal.innerHTML = `
        <div style="width:min(560px, 92vw); background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:18px;">
            <h3 style="margin:0 0 12px 0;">Peer Review Rubric (0-3)</h3>
            <p style="margin:0 0 10px 0; color:var(--text-sub); font-size:0.9rem;">
                0 = Poor, 1 = Basic, 2 = Good, 3 = Excellent
            </p>
            <div style="display:grid; gap:10px;">
                <label>Syntax: <input id="peerSyntax" type="range" min="0" max="3" value="2"> <span id="peerSyntaxVal">2</span></label>
                <label>Structure: <input id="peerStructure" type="range" min="0" max="3" value="2"> <span id="peerStructureVal">2</span></label>
                <label>Functionality: <input id="peerFunctionality" type="range" min="0" max="3" value="2"> <span id="peerFunctionalityVal">2</span></label>
                <label>Documentation: <input id="peerDocumentation" type="range" min="0" max="3" value="2"> <span id="peerDocumentationVal">2</span></label>
                <div style="font-weight:600; color:var(--text-main);">
                    Total: <span id="peerTotal">8</span>/12
                </div>
                <div style="font-weight:600; color:var(--text-main);">
                    Rating: <span id="peerRating">3.33</span>/5
                </div>
                <textarea id="peerFeedbackText" rows="4" placeholder="Optional feedback..." style="width:100%; padding:10px; border:1px solid var(--border); border-radius:8px; background:var(--bg); color:var(--text-main);"></textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:14px;">
                <button id="peerReviewCancel" class="resume-btn" style="background:var(--text-sub);">Cancel</button>
                <button id="peerReviewSubmit" class="resume-btn">Submit Review</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    ['Syntax', 'Structure', 'Functionality', 'Documentation'].forEach(key => {
        const input = document.getElementById(`peer${key}`);
        const val = document.getElementById(`peer${key}Val`);
        input.addEventListener('input', () => {
            val.textContent = input.value;
            const total = Number(document.getElementById('peerSyntax').value)
                + Number(document.getElementById('peerStructure').value)
                + Number(document.getElementById('peerFunctionality').value)
                + Number(document.getElementById('peerDocumentation').value);
            document.getElementById('peerTotal').textContent = total;
            document.getElementById('peerRating').textContent = ((total / 12) * 5).toFixed(2);
        });
    });

    return new Promise(resolve => {
        document.getElementById('peerReviewCancel').addEventListener('click', () => {
            modal.remove();
            resolve(null);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(null);
            }
        });
        document.getElementById('peerReviewSubmit').addEventListener('click', () => {
            const payload = {
                projectId,
                syntax_score: Number(document.getElementById('peerSyntax').value),
                structure_score: Number(document.getElementById('peerStructure').value),
                functionality_score: Number(document.getElementById('peerFunctionality').value),
                documentation_score: Number(document.getElementById('peerDocumentation').value),
                feedback_text: document.getElementById('peerFeedbackText').value.trim(),
            };
            modal.remove();
            resolve(payload);
        });
    });
}

async function initCommunity() {
    try {
        // 1. Fetch user info to check which projects are theirs
        const userRes = await authFetch(`${CONFIG.API_BASE}/users/me/`);

        // 2. Fetch visible community projects
        const projectsRes = await authFetch(`${CONFIG.API_BASE}/community/projects/`);

        if (!userRes || !userRes.ok || !projectsRes || !projectsRes.ok) {
            throw new Error('API unavailable');
        }

        const userData = await userRes.json();
        const projects = await projectsRes.json();

        renderCommunityFeed(projects, userData.username);

    } catch (err) {
        console.warn('Community feed: using fallback UI —', err.message);
        renderFallbackFeed();
    }
}


// ── RENDER FEED ───────────────────────────────────────────────

function renderCommunityFeed(projects, currentUsername) {
    const feed = document.getElementById('projectFeed');
    if (!feed) return;

    if (projects.length === 0) {
        feed.innerHTML = `
            <div class="learning-status-card" style="text-align:center; padding: 48px;">
                <p style="color: var(--text-sub); font-size: 1rem;">
                    No projects submitted yet. Be the first!
                </p>
            </div>`;
        return;
    }

    feed.innerHTML = '';

    projects.forEach(project => {
        // Visibility/eligibility is now enforced by backend.
        const isOwnProject = project.author === currentUsername;
        const isUnlocked = true;

        const card = document.createElement('div');
        card.className = `learning-status-card review-card ${isUnlocked ? '' : 'locked'}`;

        card.innerHTML = `
            ${!isUnlocked ? `
                <div class="lock-overlay">
                    <div class="lock-box">
                        <span class="lock-icon">🔒</span>
                        <p>Enroll in <b>${project.category}</b> course to unlock peer reviews.</p>
                        <button class="resume-btn nav-to-skills"
                                style="padding: 8px 16px; font-size: 12px;">
                            View Courses
                        </button>
                    </div>
                </div>` : ''}
            <div class="card-content">
                <div class="learning-header">
                    <div>
                        <span class="week-badge">${project.category}</span>
                        ${project.submitted_cohort_name ? `<span class="week-badge" style="margin-left: 8px; background: rgba(99,102,241,0.1); color: var(--accent);">Cohort: ${project.submitted_cohort_name}</span>` : ''}
                        ${project.status === 'pending' ? 
                            '<span class="week-badge" style="background: rgba(251, 191, 36, 0.1); color: #b8860b; margin-left: 8px;">⏳ PENDING REVIEW</span>' :
                          project.status === 'needs_revision' ?
                            '<span class="week-badge" style="background: rgba(239, 68, 68, 0.1); color: var(--danger); margin-left: 8px;">🔄 NEEDS REVISION</span>' :
                            '<span class="week-badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; margin-left: 8px;">✓ APPROVED</span>'
                        }
                        <h2>${project.title}</h2>
                        <p class="course-context">Submitted by @${project.author}</p>
                    </div>
                </div>
                <div class="project-actions" style="margin-top: 20px;">
                    <a href="${isUnlocked ? project.github_url : '#'}"
                       class="text-link"
                       style="font-weight: 700; text-decoration: none;
                              ${!isUnlocked ? 'cursor: not-allowed; opacity: 0.5; pointer-events: none;' : ''}"
                       ${isUnlocked ? 'target="_blank" rel="noopener noreferrer"' : 'aria-disabled="true"'}>
                        View Repository 🔗
                    </a>
                    ${isUnlocked && !isOwnProject ? `
                        <button class="resume-btn peer-review-btn"
                                data-project-id="${project.id}"
                                ${project.peer_reviews_count > 0 ? 'disabled' : ''}
                                style="margin-left:12px; padding:8px 14px; font-size:12px;">
                            ${project.peer_reviews_count > 0 ? 'Peer Feedback Locked' : 'Give Peer Feedback'}
                        </button>
                    ` : ''}
                    ${project.peer_reviews_count > 0 ? `
                        <div style="margin-top:8px; color:var(--text-sub); font-size:0.8rem;">
                            Peer feedback is locked after the first submission.
                        </div>
                    ` : ''}
                    <div style="margin-top:10px; color:var(--text-sub); font-size:0.85rem;">
                        Peer: ${project.peer_average_score || 0}/5 (${project.peer_reviews_count || 0}) ·
                        Mentor: ${project.mentor_average_score || 0}/5 (${project.mentor_reviews_count || 0}) ·
                        Total: <strong style="color:var(--text-main);">${project.total_score || 0}/5</strong>
                    </div>
                </div>
            </div>
        `;

        feed.appendChild(card);
    });

    // Wire "View Courses" buttons — avoids inline onclick
    feed.querySelectorAll('.nav-to-skills').forEach(btn => {
        btn.addEventListener('click', () => { window.location.href = ROUTES.courses; });
    });

    // Peer review action
    feed.querySelectorAll('.peer-review-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.disabled) return;
            const projectId = btn.dataset.projectId;
            const payload = await openPeerReviewModal(projectId);
            if (!payload) return;

            try {
                const res = await authFetch(`${CONFIG.API_BASE}/community/projects/${projectId}/peer-review/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (res && res.ok) {
                    showToast('Peer feedback submitted!', 'success');
                    initCommunity();
                } else {
                    const data = await res.json();
                    if (res.status === 403) {
                        showToast('Only same-course and same-cohort peers can review this project.', 'warning');
                    } else {
                        showToast(data.error || 'Failed to submit peer feedback.', 'error');
                    }
                }
            } catch (e) {
                showToast('Failed to submit peer feedback.', 'error');
            }
        });
    });
}


// ── FALLBACK (offline / API down) ─────────────────────────────

function renderFallbackFeed() {
    const projects = [
        { title: 'Personal Portfolio', author: 'Njeri_Dev',  category: 'Front-End Development', github_url: '#', status: 'approved' },
        { title: 'Automation Script',  author: 'Otieno_J',   category: 'Python Basics',          github_url: '#', status: 'approved' },
    ];
    renderCommunityFeed(projects, 'current_user');
}