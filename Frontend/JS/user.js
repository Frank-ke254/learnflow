// =============================================================
//  user.js — Nav user info, role-based UI, profile dropdown
//  Depends on: config.js, utils.js, auth.js (load all before this)
//  Shared with: ALL pages that include the top nav + sidebar
//
//  What changed from original:
//  - Token no longer fetched at module scope (was stale/fragile)
//  - handleLogout() removed — now lives in auth.js
//  - authFetch() used instead of raw fetch (auto token refresh)
//  - toggleProfileMenu properly toggles aria-expanded
//  - applyRoleBasedUI still globally accessible for other pages
// =============================================================


// ── NAV & AVATAR POPULATION ───────────────────────────────────

async function fetchUserDashboard() {
    const navAvatar = document.getElementById('navAvatar');

    // Show spinner while loading
    if (navAvatar) {
        navAvatar.innerHTML = '<div class="spinner"></div>';
    }

    // Auth guard — read token fresh inside the function, not at module scope
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = ROUTES.login;
        return;
    }

    try {
        const response = await authFetch(`${CONFIG.API_BASE}/users/me/`);
        if (!response || !response.ok) throw new Error('Unauthorized');

        const user = await response.json();

        setText('navUserName', user.username);

        if (navAvatar) {
            if (user.profile_picture) {
                const avatarUrl = user.profile_picture.startsWith('http')
                    ? user.profile_picture
                    : `${CONFIG.BASE_URL}${user.profile_picture}`;
                navAvatar.style.backgroundImage = `url('${avatarUrl}')`;
                navAvatar.style.backgroundSize = 'cover';
                navAvatar.style.backgroundPosition = 'center';
                navAvatar.textContent = '';
            } else if (!navAvatar.style.backgroundImage) {
                // If profile.js has already set a background image, don't overwrite with initials
                navAvatar.textContent = user.username.charAt(0).toUpperCase();
            }
        }

        // Role-gated UI (mentor nav link, etc.)
        applyRoleBasedUI(user.role || localStorage.getItem('user_role'));

    // ✓ Only logout on actual auth failures, not script errors
    } catch (err) {
        console.error('User load error:', err);
        // Only redirect if it's genuinely an auth failure, not a missing dependency
        if (err instanceof TypeError && err.message.includes('authFetch')) {
            console.error('Dependency missing: make sure config.js, utils.js, and auth.js load before user.js');
        } else {
            handleLogout();
        }
    }
}


// ── ROLE-BASED UI ─────────────────────────────────────────────
// Kept global so other pages can call applyRoleBasedUI() directly.

function applyRoleBasedUI(role) {
    const activeRole    = role || localStorage.getItem('user_role');
    const mentorNavLink = document.getElementById('mentorNavLink');

    if (mentorNavLink) {
        mentorNavLink.style.display = activeRole === 'mentor' ? 'flex' : 'none';
    }
}

// ── NAV HELPER — GO TO CORRECT PROFILE PAGE ───────────────────
// Used by pages that share the same top-right profile menu.
function goToMyProfile() {
    const role = (localStorage.getItem('user_role') || '').toLowerCase();
    if (role === 'mentor') {
        window.location.href = 'mentor-profile.html';
    } else {
        window.location.href = ROUTES.profile;
    }
}


// ── PROFILE DROPDOWN ──────────────────────────────────────────
// Kept global — called by onclick in dash.html (and other nav pages).

function toggleProfileMenu(event) {
    event.stopPropagation();
    const menu   = document.getElementById('profileMenu');
    const avatar = document.querySelector('.avatar-circle');
    if (!menu) return;

    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';

    // Keep aria-expanded in sync for screen readers
    if (avatar) avatar.setAttribute('aria-expanded', String(!isVisible));
}

// Close dropdown when clicking anywhere outside the nav profile area
window.addEventListener('click', (event) => {
    const menu        = document.getElementById('profileMenu');
    const profileArea = document.querySelector('.user-profile');

    if (menu && menu.style.display === 'block') {
        if (profileArea && !profileArea.contains(event.target)) {
            menu.style.display = 'none';
            const avatar = document.querySelector('.avatar-circle');
            if (avatar) avatar.setAttribute('aria-expanded', 'false');
        }
    }
});

// Close dropdown on Escape key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const menu   = document.getElementById('profileMenu');
        const avatar = document.querySelector('.avatar-circle');
        if (menu) menu.style.display = 'none';
        if (avatar) avatar.setAttribute('aria-expanded', 'false');
    }
});


// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetchUserDashboard();
    
    // Wire up sidebar links that use data-href attribute (for accessibility)
    document.querySelectorAll('[role="link"][data-href]').forEach(link => {
        link.addEventListener('click', function() {
            const href = this.getAttribute('data-href');
            if (href) window.location.href = href;
        });
        
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const href = this.getAttribute('data-href');
                if (href) window.location.href = href;
            }
        });
    });
});