// =============================================================
//  achievements.js — Certificates, badges, and user stats
//  Depends on: config.js, utils.js, auth.js (load all before this)
//  Only loaded on: achievements.html
// =============================================================

document.addEventListener('DOMContentLoaded', initAchievements);

async function initAchievements() {
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/achievements/`);

        if (response && response.ok) {
            const data = await response.json();
            renderAchievements(data);
        } else {
            throw new Error('API unavailable');
        }
    } catch (err) {
        console.warn('Achievements: using mock data —', err.message);
        renderMockAchievements();
    }
}


// ── RENDER ────────────────────────────────────────────────────

function renderAchievements(data) {
    const certGrid   = document.getElementById('certificateGrid');
    const certCount  = document.getElementById('certCount');
    const badgeCount = document.getElementById('badgeCount');

    if (!certGrid) return;

    // Update counts
    if (certCount)  certCount.textContent  = data.certificates.length;
    if (badgeCount) badgeCount.textContent = data.badges.length;

    // Render certificates
    if (data.certificates.length === 0) {
        certGrid.innerHTML = `
            <div class="learning-status-card" style="text-align:center; padding:48px; grid-column:1/-1;">
                <p style="color:var(--text-sub);">
                    Complete a course to earn your first certificate!
                </p>
            </div>`;
    } else {
        certGrid.innerHTML = data.certificates.map(cert => `
            <div class="learning-status-card" style="border-left: 4px solid #ffd700;">
                <div class="learning-header">
                    <div>
                        <span class="week-badge" style="background: rgba(255, 215, 0, 0.1); color: #b8860b;">
                            OFFICIAL
                        </span>
                        <h2 style="margin-top: 10px;">${cert.title}</h2>
                        <p class="course-context">Issued: ${cert.date}</p>
                    </div>
                </div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    ${cert.pdf_url ? `
                        <a href="${cert.pdf_url}"
                           target="_blank"
                           rel="noopener noreferrer"
                           class="resume-btn"
                           style="flex:1; text-decoration:none; text-align:center; background: #000;">
                            Download PDF
                        </a>
                    ` : `
                        <button class="resume-btn" style="flex:1; background:#666; cursor:not-allowed;" disabled>
                            PDF Unavailable
                        </button>
                    `}
                    <button class="icon-btn share-linkedin"
                            style="background: var(--bg); border: 1px solid var(--border); padding: 10px; border-radius: 8px; cursor:pointer;"
                            title="Share to LinkedIn"
                            aria-label="Share certificate on LinkedIn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Wire share buttons
        certGrid.querySelectorAll('.share-linkedin').forEach(btn => {
            btn.addEventListener('click', () => {
                showToast('LinkedIn sharing coming soon!', 'success');
            });
        });
    }

    // Render badges (if there's a badge display container)
    const badgeGrid = document.getElementById('badgeGrid');
    if (badgeGrid && data.badges) {
        badgeGrid.innerHTML = data.badges.map(badge => `
            <div class="badge-item" style="text-align:center; padding:16px;">
                <div style="font-size:2.5rem; margin-bottom:8px;">${badge.icon}</div>
                <strong style="font-size:0.9rem;">${badge.name}</strong>
                ${badge.description ? `<p style="font-size:0.75rem; color:var(--text-sub); margin-top:4px;">${badge.description}</p>` : ''}
            </div>
        `).join('');
    }
}


// ── FALLBACK ──────────────────────────────────────────────────

function renderMockAchievements() {
    const mockData = {
        certificates: [
            {
                id: 1,
                title: 'Front-End Foundations',
                date: 'Dec 2025',
                status: 'Verified',
                type: 'Full Course',
                pdf_url: '',
            }
        ],
        badges: [
            { name: 'Top Reviewer', icon: '⭐', description: 'Reviewed 10+ projects' },
            { name: '7-Day Streak', icon: '🔥', description: 'Maintained learning streak' },
        ],
    };
    renderAchievements(mockData);
}