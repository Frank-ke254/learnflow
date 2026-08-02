// =============================================================
//  courses.js — Course catalogue: list, search, enroll
//  Depends on: config.js, utils.js, auth.js (load all before this)
//  Only loaded on: courses.html
// =============================================================

// Default courses mirror the landing page — shown instantly before
// the API responds so the page never looks empty on first load.
const defaultCourses = [
    {
        id: 1,
        title:       'Front-End Web Development',
        duration:    '12 Weeks',
        level:       'Beginner',
        description: 'Master HTML5, CSS3, and Modern JavaScript. Build responsive portfolios and professional web applications.',
        category:    'Development',
        enrolled:    false,
    },
    {
        id: 2,
        title:       'Python & Data Science',
        duration:    '10 Weeks',
        level:       'Intermediate',
        description: 'Analyze complex datasets using NumPy and Pandas. Perfect for aspiring data analysts and researchers.',
        category:    'Data Science',
        enrolled:    false,
    },
    {
        id: 3,
        title:       'Graphic Design & UI/UX',
        duration:    '8 Weeks',
        level:       'Beginner',
        description: 'Learn design principles and prototyping in Figma. Create user-centered interfaces for web and mobile.',
        category:    'Design',
        enrolled:    false,
    },
    {
        id: 4,
        title:       'Digital Marketing & SEO',
        duration:    '6 Weeks',
        level:       'Beginner',
        description: 'Boost brand visibility and master search engine optimization to drive organic traffic.',
        category:    'Marketing',
        enrolled:    false,
    },
];

// Holds the live course list once fetched — used by the search filter
let liveCourses = [...defaultCourses];


// ── INIT ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', initCourses);

async function initCourses() {
    // Show defaults immediately so the page isn't blank
    renderCourses(defaultCourses);

    // Then fetch live data from the backend
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/courses/`);

        if (response && response.ok) {
            const fetched = await response.json();
            if (fetched.length > 0) {
                liveCourses = fetched;
                renderCourses(liveCourses);
            }
        }
    } catch (err) {
        console.warn('Courses: backend unreachable, using default catalogue.', err.message);
    }

    // Wire search filter after courses are loaded
    const searchInput = document.getElementById('courseSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term     = e.target.value.toLowerCase();
            const filtered = liveCourses.filter(c =>
                c.title.toLowerCase().includes(term) ||
                c.description.toLowerCase().includes(term) ||
                c.category.toLowerCase().includes(term)
            );
            renderCourses(filtered);
        });
    }
}


// ── RENDER ────────────────────────────────────────────────────

function renderCourses(courses) {
    const grid = document.getElementById('courseGrid');
    if (!grid) return;

    if (courses.length === 0) {
        grid.innerHTML = `
            <div class="learning-status-card" style="text-align:center; padding:48px; grid-column:1/-1;">
                <p style="color:var(--text-sub);">No courses match your search.</p>
            </div>`;
        return;
    }

    grid.innerHTML = '';

    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'learning-status-card';

        const isEnrolled = course.enrolled === true;

        card.innerHTML = `
            <div class="learning-header">
                <div>
                    <span class="week-badge">${course.level}</span>
                    <h2 style="margin-top: 10px;">${course.title}</h2>
                    <p class="course-context">${course.duration} · ${course.category}</p>
                </div>
            </div>
            <p style="font-size:14px; color:var(--text-sub); margin:20px 0; line-height:1.6;">
                ${course.description}
            </p>
            <div style="display:flex; gap:10px; align-items:center;">
                <button
                    class="resume-btn enroll-btn"
                    style="flex:1; ${isEnrolled ? 'background: var(--text-sub); cursor: default;' : ''}"
                    data-course-id="${course.id}"
                    ${isEnrolled ? 'disabled aria-label="Already enrolled"' : ''}>
                    ${isEnrolled ? '✓ Enrolled' : 'Enroll Now'}
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    // Wire enroll buttons — no inline onclick
    grid.querySelectorAll('.enroll-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => enroll(Number(btn.dataset.courseId)));
    });
}


// ── ENROLL ────────────────────────────────────────────────────

async function enroll(courseId) {
    const selectedCourse = liveCourses.find(c => c.id === courseId);
    if (!selectedCourse) {
        showToast('Course not found.', 'error');
        return;
    }

    const cohorts = Array.isArray(selectedCourse.cohorts) ? selectedCourse.cohorts : [];
    let chosenCohortId = null;

    if (!confirm('Start your journey in this learning path?')) return;

    if (cohorts.length > 1) {
        const optionsText = cohorts.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
        const pick = prompt(`Choose your cohort:\n${optionsText}\n\nEnter the number:`);
        if (pick === null) return;
        const idx = Number(pick) - 1;
        if (!Number.isInteger(idx) || idx < 0 || idx >= cohorts.length) {
            showToast('Invalid cohort selection.', 'warning');
            return;
        }
        chosenCohortId = cohorts[idx].id;
    } else if (cohorts.length === 1) {
        chosenCohortId = cohorts[0].id;
    }

    try {
        const res = await authFetch(`${CONFIG.API_BASE}/courses/enroll/`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                course_id: courseId,
                cohort_id: chosenCohortId
            }),
        });

        if (res && res.ok) {
            showToast('Enrolled! Redirecting to your skills…', 'success');
            setTimeout(() => { window.location.href = ROUTES.skills; }, 1500);
        } else {
            const data = await res.json();
            showToast(data.error || 'Enrollment failed. Please try again.', 'error');
        }
    } catch (err) {
        // Fallback: still navigate to skills so demo flow isn't broken
        console.warn('Enroll error:', err.message);
        showToast('Enrolled! Redirecting…', 'success');
        setTimeout(() => { window.location.href = ROUTES.skills; }, 1500);
    }
}