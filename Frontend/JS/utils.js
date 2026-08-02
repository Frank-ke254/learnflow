// =============================================================
//  utils.js — Shared utility helpers
//  Used by: all pages that need toasts or DOM shortcuts
//  Safe to include on every page — all functions are no-ops
//  if their target elements don't exist.
// =============================================================


// ── 1. TOAST NOTIFICATIONS ──────────────────────────────────
// Replaces all alert() calls across the codebase.
// Usage: showToast("Profile saved!", "success")
//        showToast("Something went wrong.", "error")
//        showToast("Please fill all fields.", "warning")

function showToast(message, type = 'success') {
    // Inject toast container if it doesn't exist yet
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'false');
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icons = { success: '✓', error: '✕', warning: '⚠' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.success}</span><span class="toast-msg">${message}</span>`;

    container.appendChild(toast);

    // Trigger enter animation on next frame
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3500);
}


// ── 2. DOM SHORTHAND HELPERS ─────────────────────────────────
// Reduces the repetitive null-guard pattern across dashboard.js / profile.js

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function setAttr(id, attr, value) {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
}