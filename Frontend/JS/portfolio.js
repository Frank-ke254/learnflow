(async function initPortfolio() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('user');

    if (!username) {
        document.getElementById('portfolioName').textContent = 'Portfolio not found';
        return;
    }

    try {
        const res = await fetch(`${CONFIG.API_BASE}/users/portfolio/${encodeURIComponent(username)}/`);
        if (!res.ok) throw new Error('Failed to load portfolio');
        const data = await res.json();

        renderPortfolio(data);
    } catch (err) {
        document.getElementById('portfolioName').textContent = 'Unable to load portfolio';
    }
})();

function renderPortfolio(data) {
    const user = data.user || {};
    document.getElementById('portfolioName').textContent = user.username || 'Unknown user';
    document.getElementById('portfolioRole').textContent = (user.role || 'student').toUpperCase();
    document.getElementById('portfolioBio').textContent = user.bio || 'No bio yet.';

    if (user.profile_picture) {
        const full = user.profile_picture.startsWith('http')
            ? user.profile_picture
            : `${CONFIG.BASE_URL}${user.profile_picture}`;
        document.getElementById('portfolioAvatar').src = full;
    }

    const stats = data.stats || {};
    document.getElementById('portfolioStats').innerHTML = `
        <div class="stat-card"><div class="stat-info"><p>Points</p><h3>${stats.total_points || 0}</h3></div></div>
        <div class="stat-card"><div class="stat-info"><p>Courses</p><h3>${stats.courses_completed || 0}</h3></div></div>
        <div class="stat-card"><div class="stat-info"><p>Validated</p><h3>${stats.projects_validated || 0}</h3></div></div>
        <div class="stat-card"><div class="stat-info"><p>Streak</p><h3>${stats.current_streak || 0}</h3></div></div>
    `;

    const projects = data.projects || [];
    const projectsList = document.getElementById('projectsList');
    if (!projects.length) {
        projectsList.innerHTML = '<p style="color: var(--text-sub);">No verified projects yet.</p>';
    } else {
        projectsList.innerHTML = projects.map(p => `
            <article class="project-item">
                <h3>${p.title}</h3>
                <p>${p.description || ''}</p>
                <p class="project-meta">${p.category} • <a href="${p.github_url}" target="_blank" rel="noopener noreferrer">GitHub</a></p>
                ${p.feedback ? `<p class="project-meta">Mentor feedback: "${p.feedback}"</p>` : ''}
            </article>
        `).join('');
    }

    const badges = data.badges || [];
    const badgesList = document.getElementById('badgesList');
    badgesList.innerHTML = badges.length
        ? badges.map(b => `<div class="badge-chip">${b.icon || '⭐'} ${b.name}</div>`).join('')
        : '<p style="color: var(--text-sub);">No badges yet.</p>';
}
