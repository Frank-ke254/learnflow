// =============================================================
//  config.js — Single source of truth for API & routes
//  Used by: auth.js, user.js, dashboard.js, profile.js
//  NOTE: Only change API_BASE when deploying. All other files
//        read from this object — no find-and-replace needed.
// =============================================================

const CONFIG = {
    API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/api'
        : 'https://your-production-api.com/api',   // <-- update before deploying

    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000'
        : 'https://your-production-api.com',
};

// Page routes — update filenames here if they ever change
const ROUTES = {
    login:      'login.html',
    signup:     'signup.html',
    dashboard:  'dash.html',
    courses:    'courses.html',
    skills:     'skills.html',
    profile:    'profile.html',
    community:  'community.html',
    achievements: 'achievements.html',
    mentorReview: 'mentor-review.html',
};