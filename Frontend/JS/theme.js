// =============================================================
//  theme.js — Theme toggle and sidebar collapse
//  Depends on: nothing (standalone utility)
//  Shared with: ALL pages
//
//  Load this as the FIRST script on every page so the dark class
//  is applied before anything renders (prevents flash of light mode).
// =============================================================


// ── THEME ─────────────────────────────────────────────────────
// Apply saved theme immediately — before DOMContentLoaded fires —
// to prevent a flash of the wrong theme on page load.

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}

// Called by the theme toggle button (onclick="toggleTheme()" in HTML)
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}


// ── SIDEBAR TOGGLE (mobile) ───────────────────────────────────
// Called on pages that have a mobile hamburger trigger.

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const main    = document.querySelector('.main');
    if (sidebar) sidebar.classList.toggle('open');
    if (main)    main.classList.toggle('shifted');
}

// Auto-close sidebar when viewport widens past mobile breakpoint
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('open');
    }
});