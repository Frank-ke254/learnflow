// =============================================================
//  profile.js — Profile page: load, update, password change
//  Depends on: config.js, utils.js, auth.js (load all before this)
//  Only loaded on: profile.html
//
//  What changed from original:
//  - Uses CONFIG.API_BASE / CONFIG.BASE_URL instead of hardcoded URLs
//  - Uses authFetch() — handles token refresh + 401 automatically
//  - All alert() calls replaced with showToast()
//  - Password change validates match + min length before fetch
//  - Uses setValue() / setText() helpers to reduce null-guard noise
// =============================================================

document.addEventListener('DOMContentLoaded', () => {

    const API_ME = `${CONFIG.API_BASE}/users/me/`;
    const isMentorProfilePage = window.location.pathname.endsWith('/mentor-profile.html') || window.location.pathname.endsWith('mentor-profile.html');


    // ── 1. LOAD PROFILE DATA ──────────────────────────────────

    async function loadProfile() {
        try {
            const response = await authFetch(API_ME);
            if (!response || !response.ok) return;

            const user = await response.json();

            // Guard: prevent students from viewing mentor-only profile page
            if (isMentorProfilePage && (user.role || '').toLowerCase() !== 'mentor') {
                showToast('Access denied. Mentors only.', 'error');
                setTimeout(() => { window.location.href = ROUTES.dashboard; }, 1200);
                return;
            }

            // Text fields
            setText('displayRole',  (user.role || 'Student').toUpperCase());
            setValue('profUsername', user.username || '');
            setValue('profEmail',    user.email    || '');
            setValue('profBio',      user.bio      || '');
            setText('navUserName',   user.username || 'User');

            // Profile picture
            if (user.profile_picture) {
                const fullImageUrl = user.profile_picture.startsWith('http')
                    ? user.profile_picture
                    : CONFIG.BASE_URL + user.profile_picture;
                updateAvatarUI(fullImageUrl);
            }

            const openPortfolioBtn = document.getElementById('openPublicPortfolioBtn');
            const copyPortfolioBtn = document.getElementById('copyPublicPortfolioBtn');
            const publicUrl = `${window.location.origin}${window.location.pathname.replace('profile.html', 'portfolio.html')}?user=${encodeURIComponent(user.username)}`;

            if (openPortfolioBtn && user.username) {
                openPortfolioBtn.onclick = () => {
                    window.open(publicUrl, '_blank');
                };
            }
            if (copyPortfolioBtn && user.username) {
                copyPortfolioBtn.onclick = async () => {
                    try {
                        await navigator.clipboard.writeText(publicUrl);
                        showToast('Public portfolio link copied!', 'success');
                    } catch (e) {
                        showToast('Could not copy link. You can copy it from the address bar.', 'warning');
                    }
                };
            }

        } catch (err) {
            console.warn('Profile load error:', err);
        }
    }


    // ── 2. HELPER — UPDATE ALL AVATARS ON PAGE ────────────────
    // Updates both the profile preview img and the nav avatar div.

    function updateAvatarUI(url) {
        const profilePreview = document.getElementById('profilePreview');
        if (profilePreview) profilePreview.src = url;

        const navAvatar = document.getElementById('navAvatar');
        if (navAvatar) {
            navAvatar.style.backgroundImage    = `url('${url}')`;
            navAvatar.style.backgroundSize     = 'cover';
            navAvatar.style.backgroundPosition = 'center';
            navAvatar.textContent              = ''; // Clear initials
        }
    }


    // ── 3. UPDATE PROFILE (Bio & Image) ───────────────────────

    async function handleUpdateProfile(e) {
        e.preventDefault();

        const formData  = new FormData();
        const bioField  = document.getElementById('profBio');
        const fileInput = document.getElementById('avatarInput');

        if (bioField)                        formData.append('bio', bioField.value);
        if (fileInput && fileInput.files[0]) formData.append('profile_picture', fileInput.files[0]);

        try {
            const response = await authFetch(API_ME, {
                method: 'PATCH',
                // NOTE: Do NOT set Content-Type header here —
                // the browser sets it automatically with the correct multipart boundary.
                body: formData,
            });

            if (response && response.ok) {
                const updatedUser = await response.json();
                showToast('Profile updated successfully!', 'success');

                if (updatedUser.profile_picture) {
                    const newUrl = updatedUser.profile_picture.startsWith('http')
                        ? updatedUser.profile_picture
                        : CONFIG.BASE_URL + updatedUser.profile_picture;
                    updateAvatarUI(newUrl);
                }
            } else {
                showToast('Update failed. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Update error:', err);
            showToast('Something went wrong.', 'error');
        }
    }


    // ── 4. PASSWORD CHANGE ────────────────────────────────────

    async function handlePasswordChange(e) {
        e.preventDefault();

        const oldPw     = document.getElementById('old_password').value;
        const newPw     = document.getElementById('new_password').value;
        const confirmPw = document.getElementById('confirm_password').value;

        // Client-side validation before any network call
        if (!oldPw || !newPw || !confirmPw) {
            showToast('Please fill in all password fields.', 'warning');
            return;
        }
        if (newPw !== confirmPw) {
            showToast("New passwords don't match.", 'warning');
            return;
        }
        if (newPw.length < 8) {
            showToast('Password must be at least 8 characters.', 'warning');
            return;
        }

        const payload = {
            old_password:     oldPw,
            new_password:     newPw,
            confirm_password: confirmPw,
        };

        try {
            const response = await authFetch(`${API_ME}change-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response && response.ok) {
                showToast('Password updated!', 'success');
                document.getElementById('passwordForm').reset();
            } else {
                // Use server message if present, otherwise a generic fallback
                showToast(data.error || 'Password update failed.', 'error');
            }
        } catch (err) {
            console.error('Password change error:', err);
            showToast('Something went wrong.', 'error');
        }
    }


    // ── INIT — Wire up listeners and load data ─────────────────

    loadProfile();

    const profileForm = document.getElementById('profileForm');
    if (profileForm) profileForm.addEventListener('submit', handleUpdateProfile);

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) passwordForm.addEventListener('submit', handlePasswordChange);

});