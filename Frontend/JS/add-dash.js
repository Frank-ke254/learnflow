// =============================================================
//  dashboard-additions.js — Additional Dashboard Features
//  Add this to your existing dashboard.js or include separately
// =============================================================

function loadAdditionalWidgets() {
    // Show quick actions immediately
    const quickActions = document.querySelector('.quick-actions-panel');
    if (quickActions) quickActions.classList.add('loaded');
    
    // loadActivityFeed(); // Handled by dashboard.js for real data
    loadUpcomingDeadlines();
    loadLatestBadges();
    loadMentorFeedback();
    loadStreakCalendar();
}

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for main dashboard to load first
    setTimeout(loadAdditionalWidgets, 500);
});


// ── ACTIVITY FEED ─────────────────────────────────────────────

function loadActivityFeed() {
    const feedSection = document.querySelector('.activity-feed-section');
    const feed = document.getElementById('activityFeed');
    if (!feed || !feedSection) return;
    
    const activities = [
        {
            icon: '✅',
            title: 'Completed Week 3 Quiz',
            detail: 'Score: 85% - CSS Flexbox Quiz',
            time: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
            icon: '🎉',
            title: 'Project Approved',
            detail: 'HTML Portfolio Website',
            time: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
            icon: '🏆',
            title: 'Badge Earned',
            detail: 'First Submission - Keep it up!',
            time: new Date(Date.now() - 259200000) // 3 days ago
        },
        {
            icon: '💬',
            title: 'New Reply',
            detail: 'Array.map() vs forEach() discussion',
            time: new Date(Date.now() - 432000000) // 5 days ago
        },
        {
            icon: '📚',
            title: 'Started New Course',
            detail: 'JavaScript Fundamentals',
            time: new Date(Date.now() - 604800000) // 1 week ago
        }
    ];
    
    feed.innerHTML = '';
    
    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        item.innerHTML = `
            <div class="activity-icon-wrapper">${activity.icon}</div>
            <div class="activity-content">
                <p class="activity-title">${activity.title}</p>
                <p class="activity-detail">${activity.detail}</p>
            </div>
            <span class="activity-time">${formatTimeAgo(activity.time)}</span>
        `;
        
        feed.appendChild(item);
    });
    
    // Show section after loading
    feedSection.classList.add('loaded');
}


// ── UPCOMING DEADLINES ────────────────────────────────────────

function loadUpcomingDeadlines() {
    const section = document.querySelector('.deadlines-section');
    const list = document.getElementById('upcomingDeadlines');
    if (!list || !section) return;
    
    const deadlines = [
        {
            title: 'Week 4 Quiz',
            course: 'Front-End Web Development',
            dueDate: new Date(Date.now() + 172800000), // 2 days
            urgency: 'soon'
        },
        {
            title: 'Submit Week 3 Project',
            course: 'Front-End Web Development',
            dueDate: new Date(Date.now() + 345600000), // 4 days
            urgency: 'normal'
        },
        {
            title: 'JavaScript Assignment',
            course: 'JavaScript Fundamentals',
            dueDate: new Date(Date.now() + 86400000), // 1 day
            urgency: 'urgent'
        }
    ];
    
    // Sort by due date (urgent first)
    deadlines.sort((a, b) => a.dueDate - b.dueDate);
    
    list.innerHTML = '';
    
    deadlines.forEach(deadline => {
        const item = document.createElement('div');
        item.className = `deadline-item ${deadline.urgency}`;
        
        const timeLeft = formatTimeUntil(deadline.dueDate);
        
        item.innerHTML = `
            <div>
                <p class="deadline-title">${deadline.title}</p>
                <p class="deadline-course">${deadline.course}</p>
            </div>
            <span class="deadline-time ${deadline.urgency}">${timeLeft}</span>
        `;
        
        list.appendChild(item);
    });
    
    // Show section after loading
    section.classList.add('loaded');
}


// ── LATEST BADGES ─────────────────────────────────────────────

function loadLatestBadges() {
    const section = document.querySelector('.badges-showcase');
    const carousel = document.getElementById('latestBadges');
    if (!carousel || !section) return;
    
    const badges = [
        { emoji: '🚀', name: 'First Submission', date: '3 days ago' },
        { emoji: '📝', name: 'Quiz Master', date: '1 week ago' },
        { emoji: '🌅', name: 'Early Bird', date: '2 weeks ago' },
        { emoji: '💯', name: 'Perfect Score', date: '3 weeks ago' },
        { emoji: '🔥', name: '7 Day Streak', date: '1 month ago' }
    ];
    
    carousel.innerHTML = '';
    
    badges.forEach(badge => {
        const card = document.createElement('div');
        card.className = 'badge-card';
        
        card.innerHTML = `
            <div class="badge-emoji">${badge.emoji}</div>
            <p class="badge-name">${badge.name}</p>
            <p class="badge-date">${badge.date}</p>
        `;
        
        carousel.appendChild(card);
    });
    
    // Show section after loading
    section.classList.add('loaded');
}


// ── MENTOR FEEDBACK ───────────────────────────────────────────

function loadMentorFeedback() {
    const section = document.getElementById('mentorFeedbackSection');
    const card = document.getElementById('mentorFeedbackCard');
    
    if (!section || !card) return;
    
    // Mock feedback - check if user has any feedback
    const hasFeedback = true; // Replace with actual check
    
    if (!hasFeedback) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    const feedback = {
        project: 'HTML Portfolio Website',
        text: 'Excellent work on semantic HTML! Your structure is clean and accessible. Consider adding more ARIA labels for even better accessibility. Keep up the great work!',
        mentor: 'Mentor Sarah',
        time: '1 day ago'
    };
    
    card.innerHTML = `
        <h3 class="feedback-project-name">${feedback.project}</h3>
        <p class="feedback-text">${feedback.text}</p>
        <div class="feedback-meta">
            <span class="feedback-mentor-name">— ${feedback.mentor}</span>
            <span>${feedback.time}</span>
        </div>
    `;
}


// ── STREAK CALENDAR ──────────────────────────────────────────

function loadStreakCalendar() {
    const section = document.querySelector('.streak-calendar');
    const calendar = document.getElementById('streakCalendar');
    const currentStreakEl = document.getElementById('currentStreak');
    const longestStreakEl = document.getElementById('longestStreak');
    const totalDaysEl = document.getElementById('totalDays');
    
    if (!calendar || !section) return;
    
    // Mock data - replace with real API
    const streakData = {
        currentStreak: 12,
        longestStreak: 18,
        totalDays: 45,
        activeDays: [] // Days with activity
    };
    
    // Update stats
    if (currentStreakEl) currentStreakEl.textContent = streakData.currentStreak;
    if (longestStreakEl) longestStreakEl.textContent = streakData.longestStreak;
    if (totalDaysEl) totalDaysEl.textContent = streakData.totalDays;
    
    // Generate last 28 days calendar (4 weeks)
    const today = new Date();
    const daysToShow = 28;
    
    // Generate mock active days (random for demo)
    for (let i = 0; i < daysToShow; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Randomly mark some days as active (for demo)
        if (Math.random() > 0.3) {
            streakData.activeDays.push(date.toDateString());
        }
    }
    
    calendar.innerHTML = '';
    
    // Add day of week headers (Sun, Mon, Tue, etc.)
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(dayName => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = dayName;
        calendar.appendChild(header);
    });
    
    // Calculate starting position (which day of week to start on)
    const oldestDate = new Date(today);
    oldestDate.setDate(oldestDate.getDate() - (daysToShow - 1));
    const startDayOfWeek = oldestDate.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Add empty cells for alignment
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
    }
    
    // Add actual days
    for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const day = document.createElement('div');
        day.className = 'calendar-day';
        
        const isToday = i === 0;
        const isActive = streakData.activeDays.includes(date.toDateString());
        
        if (isActive) day.classList.add('active');
        if (isToday) day.classList.add('today');
        
        // Show day number inside the box
        const dayNumber = date.getDate();
        day.textContent = dayNumber;
        
        day.title = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        calendar.appendChild(day);
    }
    
    // Show section after loading
    section.classList.add('loaded');
}


// ── HELPER FUNCTIONS ──────────────────────────────────────────

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeUntil(date) {
    const seconds = Math.floor((date - new Date()) / 1000);
    
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m left`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h left`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}