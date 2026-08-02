// =============================================================
//  profile-enhanced.js — Enhanced Profile Features
//  Add this to your existing profile.js or load separately
// =============================================================

let profileData = null;

// Load profile enhancements on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadProfileEnhancements();
        setupFormSync();
    }, 500);
    setupTabs();
});


// ── LOAD PROFILE DATA ─────────────────────────────────────────

async function loadProfileEnhancements() {
    profileData = await getRealProfileData();
    
    // Render all sections
    renderProfileHeader();
    renderCurrentCourses();
    renderProgressChart();
    renderAchievements();
    renderActivityFeed();
    
    // Sync the header avatar with the form avatar
    syncAvatars();
}

async function getRealProfileData() {
    try {
        const meRes = await authFetch(`${CONFIG.API_BASE}/users/me/`);
        if (!meRes || !meRes.ok) throw new Error('Unable to load profile.');
        const me = await meRes.json();

        const portfolioRes = await fetch(`${CONFIG.API_BASE}/users/portfolio/${encodeURIComponent(me.username)}/`);
        if (!portfolioRes.ok) throw new Error('Unable to load portfolio data.');
        const portfolio = await portfolioRes.json();

        const achievementsRes = await authFetch(`${CONFIG.API_BASE}/achievements/`);
        const achievementsData = achievementsRes && achievementsRes.ok ? await achievementsRes.json() : { badges: [] };
        const enrollmentsRes = await authFetch(`${CONFIG.API_BASE}/courses/my-enrollments/`);
        const enrollments = enrollmentsRes && enrollmentsRes.ok ? await enrollmentsRes.json() : [];
        const dashboardRes = await authFetch(`${CONFIG.API_BASE}/dashboard/`);
        const dashboardData = dashboardRes && dashboardRes.ok ? await dashboardRes.json() : {};

        const userName = me.username || 'User';
        const avatar = me.profile_picture
            ? (me.profile_picture.startsWith('http') ? me.profile_picture : `${CONFIG.BASE_URL}${me.profile_picture}`)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4f46e5&color=fff&size=120`;

        const badges = (portfolio.badges || []).map(b => ({
            emoji: b.icon || '⭐',
            name: b.name,
            date: 'Verified',
            locked: false
        }));

        const activeEnrollments = enrollments.filter(e => e.is_active && e.course);
        const activeCourses = activeEnrollments.map(e => ({
            name: e.course.title,
            // Use dashboard progress for the active course when available
            progress: (dashboardData.learning_status && dashboardData.learning_status.course_title === e.course.title)
                ? (dashboardData.learning_status.progress_percentage || 0)
                : 0
        }));

        const progressPercent = dashboardData.learning_status?.progress_percentage || 0;

        return {
            user: {
                name: userName,
                username: userName,
                bio: me.bio || 'No bio yet.',
                avatar
            },
            stats: {
                totalPoints: portfolio.stats?.total_points || 0,
                coursesCompleted: portfolio.stats?.courses_completed || 0,
                projectsCount: (portfolio.projects || []).length,
                badgesCount: (portfolio.badges || []).length,
                streakCount: portfolio.stats?.current_streak || 0
            },
            miniBadges: (portfolio.badges || []).slice(0, 3).map(b => ({
                emoji: b.icon || '⭐',
                label: b.name
            })),
            courses: activeCourses,
            overallProgress: {
                // Keep these aligned with real learner progress until granular quiz/lesson metrics are exposed
                lessons: progressPercent,
                quizzes: progressPercent,
                projects: Math.min(100, ((portfolio.projects || []).length * 20))
            },
            achievements: badges.length ? badges : (achievementsData.badges || []).map(b => ({
                emoji: b.icon || '⭐',
                name: b.name || 'Badge',
                date: 'Earned',
                locked: false
            })),
            activity: (portfolio.projects || []).slice(0, 5).map(p => ({
                title: 'Verified Project',
                detail: p.title,
                time: new Date(p.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }))
        };
    } catch (err) {
        console.error(err);
        return {
            user: { name: 'User', username: 'user', bio: 'No bio yet.', avatar: 'https://ui-avatars.com/api/?name=User&background=4f46e5&color=fff&size=120' },
            stats: { totalPoints: 0, coursesCompleted: 0, projectsCount: 0, badgesCount: 0, streakCount: 0 },
            miniBadges: [],
            courses: [],
            overallProgress: { lessons: 0, quizzes: 0, projects: 0 },
            achievements: [],
            activity: []
        };
    }
}


// ── RENDER PROFILE HEADER ─────────────────────────────────────

function renderProfileHeader() {
    // Update avatar
    const avatarLarge = document.getElementById('profileAvatarLarge');
    if (avatarLarge) avatarLarge.src = profileData.user.avatar;
    
    // Update name and bio
    setText('profileDisplayName', profileData.user.name);
    setText('profileUsername', profileData.user.username);
    setText('profileBioDisplay', profileData.user.bio);
    
    // Stats
    setText('totalPoints', profileData.stats.totalPoints.toLocaleString());
    setText('coursesCompleted', profileData.stats.coursesCompleted);
    setText('projectsCount', profileData.stats.projectsCount);
    setText('badgesCount', profileData.stats.badgesCount);
    setText('streakCount', profileData.stats.streakCount);
    
    // Mini badges
    const badgesMini = document.getElementById('profileBadgesMini');
    if (badgesMini) {
        badgesMini.innerHTML = '';
        profileData.miniBadges.forEach(badge => {
            const span = document.createElement('span');
            span.className = 'badge-mini';
            span.innerHTML = `${badge.emoji} ${badge.label}`;
            badgesMini.appendChild(span);
        });
    }
}


// ── RENDER CURRENT COURSES ────────────────────────────────────

function renderCurrentCourses() {
    const container = document.getElementById('currentCourses');
    if (!container) return;
    
    container.innerHTML = '';
    if (!profileData.courses.length) {
        container.innerHTML = '<p style="color:var(--text-sub);">No active courses to show yet.</p>';
        return;
    }

    profileData.courses.forEach(course => {
        const div = document.createElement('div');
        div.className = 'course-item-profile';
        
        div.innerHTML = `
            <p class="course-name">${course.name}</p>
            <div class="course-progress-bar">
                <div class="course-progress-fill" style="width: ${course.progress}%"></div>
            </div>
            <p class="course-progress-text">${course.progress}% Complete</p>
        `;
        
        container.appendChild(div);
    });
}


// ── RENDER PROGRESS CHART ─────────────────────────────────────

function renderProgressChart() {
    const container = document.getElementById('progressChart');
    if (!container) return;
    
    const progress = profileData.overallProgress;
    
    container.innerHTML = `
        <div class="progress-circle-container">
            ${createCircle(progress.lessons, 'Lessons')}
            ${createCircle(progress.quizzes, 'Quizzes')}
            ${createCircle(progress.projects, 'Projects')}
        </div>
    `;
}

function createCircle(percentage, label) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return `
        <div class="progress-circle">
            <svg class="circle-svg" viewBox="0 0 100 100">
                <circle class="circle-bg" cx="50" cy="50" r="${radius}"/>
                <circle class="circle-progress" cx="50" cy="50" r="${radius}"
                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};"/>
                <text class="circle-text" x="50" y="55" text-anchor="middle">${percentage}%</text>
            </svg>
            <span class="circle-label">${label}</span>
        </div>
    `;
}


// ── RENDER ACHIEVEMENTS ───────────────────────────────────────

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    if (!profileData.achievements.length) {
        grid.innerHTML = '<p style="color:var(--text-sub);">No achievements yet.</p>';
        return;
    }
    
    profileData.achievements.forEach(achievement => {
        const card = document.createElement('div');
        card.className = `achievement-card ${achievement.locked ? 'locked' : ''}`;
        
        card.innerHTML = `
            <div class="achievement-icon">${achievement.emoji}</div>
            <p class="achievement-name">${achievement.name}</p>
            <p class="achievement-date">${achievement.date}</p>
        `;
        
        grid.appendChild(card);
    });
}


// ── RENDER ACTIVITY FEED ──────────────────────────────────────

function renderActivityFeed() {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;
    
    timeline.innerHTML = '';
    if (!profileData.activity.length) {
        timeline.innerHTML = '<p style="color:var(--text-sub);">No recent activity yet.</p>';
        return;
    }
    
    profileData.activity.forEach(item => {
        const div = document.createElement('div');
        div.className = 'activity-item-profile';
        
        div.innerHTML = `
            <div class="activity-dot"></div>
            <div class="activity-content-profile">
                <p class="activity-title-profile">${item.title}</p>
                <p class="activity-detail-profile">${item.detail}</p>
                <p class="activity-time-profile">${item.time}</p>
            </div>
        `;
        
        timeline.appendChild(div);
    });
}


// ── TABS FUNCTIONALITY ────────────────────────────────────────

function setupTabs() {
    const tabs = document.querySelectorAll('.activity-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs and contents
            document.querySelectorAll('.activity-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabName = tab.dataset.tab;
            const content = document.getElementById(`${tabName}-tab`);
            if (content) content.classList.add('active');
        });
    });
}


// ── HELPER FUNCTION ───────────────────────────────────────────

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}


// ── SYNC AVATARS ──────────────────────────────────────────────

function syncAvatars() {
    // When user uploads new avatar in the form, update the header too
    const avatarInput = document.getElementById('avatarInput');
    if (!avatarInput) return;
    
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageUrl = event.target.result;
            
            // Update BOTH avatars
            const headerAvatar = document.getElementById('profileAvatarLarge');
            const formAvatar = document.getElementById('profilePreview');
            
            if (headerAvatar) headerAvatar.src = imageUrl;
            if (formAvatar) formAvatar.src = imageUrl;
        };
        
        reader.readAsDataURL(file);
    });
}


// ── SYNC FORM FIELDS WITH HEADER ──────────────────────────────

// Listen to form changes and update header in real-time
function setupFormSync() {
    const fullNameInput = document.getElementById('profFullName');
    const bioInput = document.getElementById('profBio');
    
    if (fullNameInput) {
        fullNameInput.addEventListener('input', function() {
            setText('profileDisplayName', this.value || 'Learning Enthusiast');
        });
    }
    
    if (bioInput) {
        bioInput.addEventListener('input', function() {
            setText('profileBioDisplay', this.value || 'Student learning web development');
        });
    }
}