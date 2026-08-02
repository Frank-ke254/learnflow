// =============================================================
//  dashboard.js — FINAL VERSION with all fake data hidden
// =============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Dashboard initializing...');
    
    // Auth guard
    if (!localStorage.getItem('access_token')) {
        window.location.href = 'login.html';
        return;
    }
    
    // Hide hardcoded sections FIRST
    hideHardcodedSections();
    
    // Load data
    loadDashboardData();
    loadDashboardWidgets();
});

// ========================================
// HIDE HARDCODED SECTIONS - EXACT SELECTORS
// ========================================
function hideHardcodedSections() {
    console.log('🧹 Hiding hardcoded sections...');
    
    // These are the EXACT class names from your HTML
    const sectionsToHide = [
        '.deadlines-section',     // Upcoming Deadlines
        '.streak-calendar'        // Your Learning Journey
    ];
    
    sectionsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'none';
            console.log(`✅ Hidden: ${selector}`);
        }
    });
}

// ========================================
// EMPTY STATE TEMPLATES
// ========================================
const EMPTY_STATES = {
    recentActivity: `
        <div style="text-align: center; padding: 3rem 2rem;">
            <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;">📭</div>
            <h3 style="color: #1f2937; margin: 0 0 0.5rem 0; font-size: 1.25rem;">No activity yet</h3>
            <p style="color: #6b7280; margin: 0 0 1.5rem 0;">Start learning to see your activity here!</p>
            <a href="courses.html" style="display: inline-block; padding: 0.75rem 1.5rem; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Browse Courses</a>
        </div>
    `,
    
    achievements: `
        <div style="text-align: center; padding: 3rem 2rem;">
            <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;">🏆</div>
            <h3 style="color: #1f2937; margin: 0 0 0.5rem 0; font-size: 1.25rem;">No badges yet</h3>
            <p style="color: #6b7280; margin: 0;">Complete lessons and projects to earn achievements!</p>
        </div>
    `,
    
    mentorFeedback: `
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;">💬</div>
            <h3 style="color: #1f2937; margin: 0 0 0.5rem 0; font-size: 1.1rem;">No feedback yet</h3>
            <p style="color: #6b7280; margin: 0;">Submit projects to receive mentor feedback!</p>
        </div>
    `
};

// ========================================
// LOAD MAIN DASHBOARD DATA
// ========================================
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`${CONFIG.API_BASE}/dashboard/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }

        const data = await response.json();
        
        // Update user info
        if (data.user_info) {
            const userName = data.user_info.full_name || data.user_info.username;
            const userNameHeader = document.getElementById('userNameHeader');
            if (userNameHeader) userNameHeader.textContent = userName;
            
            const avatarElements = document.querySelectorAll('#navAvatar, .avatar-circle');
            avatarElements.forEach(elem => {
                elem.textContent = userName.substring(0, 2).toUpperCase();
            });
            
            const navUserName = document.getElementById('navUserName');
            if (navUserName) navUserName.textContent = userName;
        }

        // Update learning status
        if (data.learning_status) {
            const weekBadge = document.getElementById('currentWeekBadge');
            if (weekBadge) weekBadge.textContent = `WEEK ${data.learning_status.current_week}`;
            
            const currentTopic = document.getElementById('currentTopic');
            if (currentTopic) currentTopic.textContent = data.learning_status.course_title;
            
            const courseContext = document.getElementById('courseContext');
            if (courseContext) courseContext.textContent = `Path: ${data.learning_status.path_description}`;
            
            const progress = data.learning_status.progress_percentage || 0;
            const progressPercentage = document.getElementById('progressPercentage');
            if (progressPercentage) progressPercentage.textContent = `${progress}%`;
            
            const progressFill = document.getElementById('progressFill');
            if (progressFill) progressFill.style.width = `${progress}%`;
            
            const progressBar = document.getElementById('progressBar');
            if (progressBar) progressBar.setAttribute('aria-valuenow', progress);
            
            const resumeBtn = document.getElementById('resumeBtn');
            if (resumeBtn) {
                resumeBtn.onclick = () => {
                    window.location.href = data.learning_status.resume_url;
                };
            }
        }

        // Update stats
        if (data.stats) {
            const userStreak = document.getElementById('userStreak');
            if (userStreak) userStreak.textContent = `${data.stats.streak} Days`;
            
            const userPoints = document.getElementById('userPoints');
            if (userPoints) userPoints.textContent = data.stats.points.toLocaleString();
            
            const userValidated = document.getElementById('userValidated');
            if (userValidated) userValidated.textContent = data.stats.projects_validated;
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
        const currentTopic = document.getElementById('currentTopic');
        if (currentTopic) currentTopic.textContent = 'Error loading data';
        
        const courseContext = document.getElementById('courseContext');
        if (courseContext) courseContext.textContent = 'Please refresh the page';
    }
}

// ========================================
// LOAD DASHBOARD WIDGETS (EMPTY STATES)
// ========================================
async function loadDashboardWidgets() {
    console.log('🔄 Loading dashboard widgets...');
    
    try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
            console.error('❌ No access token');
            return;
        }
        
        const response = await fetch(`${CONFIG.API_BASE}/dashboard/widgets/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('❌ Widget API failed:', response.status);
            return;
        }

        const data = await response.json();
        console.log('✅ Widget data:', data);
        
        renderWidgets(data);

    } catch (error) {
        console.error('❌ Error loading widgets:', error);
    }
}

// ========================================
// RENDER WIDGETS
// ========================================
function renderWidgets(data) {
    console.log('🎨 Rendering widgets...');
    
    // Recent Activity
    const activityFeed = document.getElementById('activityFeed');
    const feedSection = document.querySelector('.activity-feed-section');
    if (activityFeed) {
        if (!data.recent_activities || data.recent_activities.length === 0) {
            console.log('📭 Empty state: recent activity');
            activityFeed.innerHTML = EMPTY_STATES.recentActivity;
        } else {
            activityFeed.innerHTML = data.recent_activities.map(activity => {
                const icon = activity.icon || '📌';
                return `
                <div class="activity-item">
                    <div class="activity-icon-wrapper">${icon}</div>
                    <div class="activity-content">
                        <p class="activity-title">${activity.title}</p>
                        <p class="activity-detail">${activity.description}</p>
                    </div>
                    <span class="activity-time">${formatTime(activity.timestamp)}</span>
                </div>
                `;
            }).join('');
        }
        if (feedSection) feedSection.classList.add('loaded');
    }
    
    // Achievements
    const achievementsGrid = document.getElementById('achievementsGrid');
    if (achievementsGrid) {
        if (!data.achievements || data.achievements.length === 0) {
            console.log('🏆 Empty state: achievements');
            achievementsGrid.innerHTML = EMPTY_STATES.achievements;
        } else {
            achievementsGrid.innerHTML = data.achievements.map(achievement => `
                <div style="text-align: center; padding: 1.5rem;">
                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">${achievement.icon}</div>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 0.9rem;">${achievement.name}</h4>
                    <p style="margin: 0; font-size: 0.75rem; color: #6b7280;">${achievement.description}</p>
                    <small style="font-size: 0.7rem; color: #9ca3af;">${achievement.earned_at}</small>
                </div>
            `).join('');
        }
    }
    
    // Mentor Feedback
    const mentorFeedback = document.getElementById('mentorFeedback');
    if (mentorFeedback) {
        if (!data.mentor_feedback || data.mentor_feedback.length === 0) {
            console.log('💬 Empty state: mentor feedback');
            mentorFeedback.innerHTML = EMPTY_STATES.mentorFeedback;
        }
    }
    
    console.log('✅ Done');
}

// ========================================
// HELPER
// ========================================
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}