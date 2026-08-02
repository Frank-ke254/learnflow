// =============================================================
//  mentor-history.js — Review history page
//  Depends on: config.js, utils.js, auth.js
//  Only loaded on: review-history.html
// =============================================================

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

    loadReviewHistory();
}


// ── LOAD REVIEW HISTORY ───────────────────────────────────────

async function loadReviewHistory() {
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/community/projects/`);
        
        if (response && response.ok) {
            const projects = await response.json();
            
            // Filter to reviewed projects (approved or needs_revision)
            const reviewed = projects.filter(p => 
                p.status === 'approved' || p.status === 'needs_revision'
            );
            
            renderHistory(reviewed);
        }
    } catch (err) {
        console.error('Failed to load history:', err);
        showToast('Failed to load review history.', 'error');
    }
}


// ── RENDER HISTORY LIST ───────────────────────────────────────

function renderHistory(projects) {
    const list = document.getElementById('historyList');
    if (!list) return;

    if (projects.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:60px; color:var(--text-sub);">
                <p style="font-size:1.1rem; margin-bottom:8px;">No reviews yet</p>
                <p style="font-size:0.9rem;">Completed project reviews will appear here.</p>
            </div>`;
        return;
    }

    list.innerHTML = '';

    // Sort by most recent first (assuming submitted_at field)
    const sorted = projects.sort((a, b) => 
        new Date(b.submitted_at) - new Date(a.submitted_at)
    );

    sorted.forEach(project => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const statusBadge = project.status === 'approved' 
            ? '<span class="status-badge status-approved">✓ APPROVED</span>'
            : '<span class="status-badge status-revision">🔄 NEEDS REVISION</span>';
        
        const submittedDate = new Date(project.submitted_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        item.innerHTML = `
            <div class="history-header">
                <div>
                    <h3>${project.title}</h3>
                    <p class="history-meta">
                        by @${project.author} • ${project.category} • ${submittedDate}
                    </p>
                </div>
                ${statusBadge}
            </div>
            
            ${project.feedback ? `
                <div class="history-feedback">
                    <strong>Your Feedback:</strong>
                    <p>${project.feedback}</p>
                </div>
            ` : ''}
            
            <div class="history-actions">
                <a href="${project.github_url}" target="_blank" rel="noopener noreferrer" class="text-link">
                    View Repository →
                </a>
            </div>
        `;
        
        list.appendChild(item);
    });
}