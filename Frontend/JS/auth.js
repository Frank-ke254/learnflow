// =============================================================
//  auth.js — Login, signup, and token refresh
//  Depends on: config.js, utils.js (load both before this)
//  Shared with: login.html, signup.html
// =============================================================

// ── TOKEN REFRESH ────────────────────────────────────────────
// Called automatically by authFetch() on 401 responses.
// Returns true if a new access token was obtained, false otherwise.

async function refreshAccessToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;

    try {
        const res = await fetch(`${CONFIG.API_BASE}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('access_token', data.access);
            return true;
        }
    } catch (err) {
        console.error('Token refresh failed:', err);
    }
    return false;
}


// ── AUTHENTICATED FETCH WRAPPER ──────────────────────────────
// Use authFetch() instead of fetch() for any authenticated request.
// Automatically attaches the Bearer token and retries once on 401
// (via token refresh) before giving up and logging the user out.

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('access_token');

    const withAuth = (opts) => ({
        ...opts,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            ...opts.headers,
        }
    });

    let response = await fetch(url, withAuth(options));

    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry the original request with the new token
            response = await fetch(url, withAuth(options));
        } else {
            handleLogout();
            return null;
        }
    }

    return response;
}


// ── LOGOUT ───────────────────────────────────────────────────
// Centralised here so auth.js is the single owner of auth state.
// user.js calls this function — it does NOT define its own version.

function handleLogout() {
    // Remove only auth-related keys — preserves theme and other prefs
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    window.location.href = ROUTES.login;
}


// ── LOGIN FORM ───────────────────────────────────────────────

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn      = document.getElementById('loginBtn');
        const loader   = document.getElementById('loader');
        const btnText  = btn.querySelector('.btn-text');

        btn.disabled          = true;
        btnText.style.opacity = '0';
        loader.style.display  = 'block';

        const credentials = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value,
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE}/users/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok && data.access) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('user_role', data.role ? data.role.toLowerCase() : 'learner');
                
                // Role-based redirect
                const userRole = data.role ? data.role.toLowerCase() : 'learner';
                if (userRole === 'mentor') {
                    window.location.href = 'mentor-review.html';
                } else if (userRole === 'admin') {
                    window.location.href = 'admin-dashboard.html'; // If you have one
                } else {
                    window.location.href = ROUTES.dashboard;
                }
            } else {
                throw new Error(data.detail || 'Login failed. Check your credentials.');
            }
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled          = false;
            btnText.style.opacity = '1';
            loader.style.display  = 'none';
        }
    });
}


// ── SIGNUP — MULTI-STEP NAV ───────────────────────────────────
// Kept on window so existing signup HTML onclick="" attributes
// continue to work without changes to that file.

window.nextStep = function () {
    const email = document.getElementById('email')?.value;
    const user  = document.getElementById('regUsername')?.value;

    if (!email || !user) {
        showToast('Please enter your email and username first.', 'warning');
        return;
    }

    const s1 = document.getElementById('step1');
    const s2 = document.getElementById('step2');
    if (s1 && s2) { s1.style.display = 'none'; s2.style.display = 'block'; }
};

window.prevStep = function () {
    const s1 = document.getElementById('step1');
    const s2 = document.getElementById('step2');
    if (s1 && s2) { s1.style.display = 'block'; s2.style.display = 'none'; }
};


// ── SIGNUP FORM ───────────────────────────────────────────────

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn     = document.getElementById('signupBtn');
        const loader  = document.getElementById('loader');
        const btnText = btn.querySelector('.btn-text');

        btn.disabled          = true;
        btnText.style.opacity = '0';
        loader.style.display  = 'block';

        const userData = {
            email:    document.getElementById('email').value,
            username: document.getElementById('regUsername').value,
            password: document.getElementById('regPassword').value,
            role:     document.getElementById('role').value,
            interest: document.getElementById('interest').value,
        };

        try {
            const response = await fetch(`${CONFIG.API_BASE}/users/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                showToast('Account created! Redirecting to login…', 'success');
                setTimeout(() => { window.location.href = ROUTES.login; }, 1800);
            } else {
                const data = await response.json();
                // Map common server field errors to readable messages
                const friendlyErrors = {
                    username: 'That username is already taken.',
                    email:    'An account with that email already exists.',
                    password: 'Password is too weak or too short.',
                };
                let errorMsg = '';
                for (const key in data) {
                    errorMsg = friendlyErrors[key] || `${key}: ${data[key]}`;
                    break; // show first error only
                }
                throw new Error(errorMsg || 'Registration failed. Please try again.');
            }
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled          = false;
            btnText.style.opacity = '1';
            loader.style.display  = 'none';
        }
    });
}