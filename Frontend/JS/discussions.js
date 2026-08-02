// =============================================================
//  discussions.js — Q&A Discussion Forum
//  Depends on: config.js, utils.js, auth.js
//  Only loaded on: discussions.html
// =============================================================

let allThreads = [];
let currentFilter = 'all';
let currentUser = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await getCurrentUser();
    showCorrectSidebar(); // Show sidebar based on role
    await loadThreads();
    setupFilters();
}


// ── SHOW CORRECT SIDEBAR BASED ON ROLE ────────────────────────

function showCorrectSidebar() {
    const studentSidebar = document.getElementById('studentSidebar');
    const mentorSidebar = document.getElementById('mentorSidebar');
    
    if (currentUser && currentUser.role === 'mentor') {
        // Show mentor sidebar
        if (mentorSidebar) mentorSidebar.style.display = 'block';
        if (studentSidebar) studentSidebar.style.display = 'none';
    } else {
        // Show student sidebar (default)
        if (studentSidebar) studentSidebar.style.display = 'block';
        if (mentorSidebar) mentorSidebar.style.display = 'none';
    }
}


// ── GET CURRENT USER ──────────────────────────────────────────

async function getCurrentUser() {
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/users/me/`);
        if (response && response.ok) {
            currentUser = await response.json();
        }
    } catch (err) {
        console.error('Failed to get user:', err);
    }
}


// ── LOAD THREADS ──────────────────────────────────────────────

async function loadThreads() {
    try {
        const url = currentFilter === 'all' 
            ? `${CONFIG.API_BASE}/community/threads/` 
            : `${CONFIG.API_BASE}/community/threads/?filter=${currentFilter}`;
            
        const response = await authFetch(url);
        if (response && response.ok) {
            allThreads = await response.json();
            renderThreads(allThreads);
        }
    } catch (err) {
        console.error('Failed to load threads:', err);
    }
}

function getMockThreads() {
    return [
        {
            id: 1,
            title: "How do I center a div vertically and horizontally?",
            category: "HTML/CSS",
            author: "Lucy",
            created_at: new Date().toISOString(),
            replies_count: 3,
            status: "solved",
            last_activity: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 2,
            title: "Array.map() vs Array.forEach() - when to use which?",
            category: "JavaScript",
            author: "Mike",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            replies_count: 5,
            status: "active",
            last_activity: new Date(Date.now() - 1800000).toISOString()
        },
        {
            id: 3,
            title: "Best practices for responsive navigation menus",
            category: "Design",
            author: "Sarah",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            replies_count: 2,
            status: "active",
            last_activity: new Date(Date.now() - 43200000).toISOString()
        }
    ];
}


// ── RENDER THREADS LIST ───────────────────────────────────────

function renderThreads(threads) {
    const list = document.getElementById('discussionsList');
    if (!list) return;

    if (threads.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="text-align:center; padding:60px;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" stroke-width="1.5" style="margin:0 auto 20px;">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p style="font-size:1.1rem; color:var(--text-main); margin-bottom:8px;">
                    No discussions yet
                </p>
                <p style="color:var(--text-sub); margin-bottom:20px;">
                    Be the first to ask a question!
                </p>
                <button class="resume-btn" onclick="showNewThreadModal()">+ New Question</button>
            </div>`;
        return;
    }

    list.innerHTML = '';

    threads.forEach(thread => {
        const item = document.createElement('div');
        item.className = 'thread-item';
        
        const timeAgo = getTimeAgo(thread.last_activity);
        const statusBadge = thread.status === 'solved' 
            ? '<span class="thread-status solved">✓ Solved</span>'
            : '';

        item.innerHTML = `
            <div class="thread-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </div>
            
            <div class="thread-content">
                <div class="thread-header">
                    <h3 onclick="viewThread(${thread.id})">${thread.title}</h3>
                    ${statusBadge}
                </div>
                
                <div class="thread-meta">
                    <span class="thread-category">${thread.category}</span>
                    <span>•</span>
                    <span>by @${thread.author}</span>
                    <span>•</span>
                    <span>${thread.replies_count} ${thread.replies_count === 1 ? 'reply' : 'replies'}</span>
                    <span>•</span>
                    <span>${timeAgo}</span>
                </div>
            </div>
        `;
        
        list.appendChild(item);
    });
}


// ── NEW THREAD MODAL ──────────────────────────────────────────

function showNewThreadModal() {
    document.getElementById('newThreadModal').style.display = 'flex';
    document.getElementById('threadTitle').focus();
}

function closeNewThreadModal() {
    document.getElementById('newThreadModal').style.display = 'none';
    document.getElementById('newThreadForm').reset();
}

// Handle new thread form submission
const newThreadForm = document.getElementById('newThreadForm');
if (newThreadForm) {
    newThreadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const threadData = {
            title: document.getElementById('threadTitle').value,
            category: document.getElementById('threadCategory').value,
            description: document.getElementById('threadDescription').value,
        };
        
        try {
            const response = await authFetch(`${CONFIG.API_BASE}/community/threads/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(threadData)
            });
            if (response && response.ok) {
                showToast('Question posted successfully!', 'success');
                closeNewThreadModal();
                loadThreads();
            }
        } catch (err) {
            console.error('Failed to post thread:', err);
            showToast('Failed to post thread', 'error');
        }
    });
}


// ── THREAD DETAIL VIEW ────────────────────────────────────────

function viewThread(threadId) {
    const thread = allThreads.find(t => t.id === threadId);
    if (!thread) return;
    
    const modal = document.getElementById('threadDetailModal');
    const content = document.getElementById('threadDetailContent');
    const title = document.getElementById('threadDetailTitle');
    
    title.textContent = thread.title;
    
    // Fetch real replies data
    authFetch(`${CONFIG.API_BASE}/community/threads/${threadId}/replies/`)
        .then(response => response.json())
        .then(replies => {
            renderThreadDetail(thread, replies, modal, content);
        });
}

function renderThreadDetail(thread, replies, modal, content) {
    let repliesHTML = '';
    replies.forEach(reply => {
        const isMentor = reply.author_role === 'mentor' || reply.author_role === 'MENTOR';
        repliesHTML += `
            <div class="reply-item ${isMentor ? 'mentor-reply' : ''}">
                <div class="reply-header">
                    <div class="reply-author">
                        <strong>@${reply.author}</strong>
                        ${isMentor ? '<span class="mentor-badge">Mentor</span>' : ''}
                    </div>
                    <span class="reply-time">${getTimeAgo(reply.created_at)}</span>
                </div>
                <div class="reply-content">
                    ${reply.content}
                </div>
            </div>
        `;
    });
    
    content.innerHTML = `
        <div class="thread-detail">
            <div class="thread-detail-header">
                <div class="thread-detail-meta">
                    <span class="thread-category">${thread.category}</span>
                    ${thread.status === 'solved' ? '<span class="thread-status solved">✓ Solved</span>' : ''}
                </div>
                <div style="margin-top:8px;">
                    <span>Asked by <strong>@${thread.author}</strong></span>
                    <span style="margin-left:16px; color:var(--text-sub);">${getTimeAgo(thread.created_at)}</span>
                </div>
            </div>
            
            <div class="thread-description">
                <h4 style="margin:0 0 12px 0;">Question Details:</h4>
                <p>${thread.description || ''}</p>
            </div>
            
            <div class="replies-section">
                <h4 style="margin:24px 0 16px 0;">${replies.length} ${replies.length === 1 ? 'Reply' : 'Replies'}</h4>
                <div class="replies-list">
                    ${repliesHTML || '<p style="color:var(--text-sub); text-align:center; padding:20px;">No replies yet. Be the first to help!</p>'}
                </div>
            </div>
            
            <div class="reply-form-section">
                <h4 style="margin:24px 0 12px 0;">Your Reply</h4>
                <form id="replyForm" onsubmit="submitReply(event, ${thread.id})">
                    <textarea id="replyContent" rows="4" placeholder="Share your thoughts, code snippets, or solutions..." required></textarea>
                    <div style="display:flex; justify-content:flex-end; margin-top:12px; gap:12px;">
                        ${thread.author === (currentUser?.username || 'You') && thread.status !== 'solved' ? 
                            '<button type="button" class="btn-secondary" onclick="markAsSolved(' + thread.id + ')">✓ Mark as Solved</button>' : ''
                        }
                        <button type="submit" class="resume-btn">Post Reply</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function getMockThreadDescription(threadId) {
    const descriptions = {
        1: "I'm trying to center a div both vertically and horizontally on the page. I've tried using margin: auto but it only centers horizontally. What's the best modern approach for this?",
        2: "I'm confused about when to use Array.map() versus Array.forEach(). They both loop through arrays, but when should I use each one? Is there a performance difference?",
        3: "I'm building a responsive navigation menu and wondering what the current best practices are. Should I use a hamburger menu on mobile? What about accessibility?"
    };
    return descriptions[threadId] || "Thread description would appear here.";
}

function getMockReplies(threadId) {
    const repliesData = {
        1: [
            {
                id: 1,
                author: "Mentor_Sarah",
                author_role: "mentor",
                content: "Great question! The modern approach is to use Flexbox or CSS Grid. Here's a simple Flexbox solution:\n\n<code>display: flex;\njustify-content: center;\nalign-items: center;\nheight: 100vh;</code>\n\nThis centers the content both horizontally and vertically!",
                created_at: new Date(Date.now() - 3000000).toISOString()
            },
            {
                id: 2,
                author: "Mike",
                author_role: "student",
                content: "You can also use CSS Grid with place-items: center. Both work great!",
                created_at: new Date(Date.now() - 2400000).toISOString()
            },
            {
                id: 3,
                author: "Lucy",
                author_role: "student",
                content: "Thanks everyone! The Flexbox solution worked perfectly. ✓",
                created_at: new Date(Date.now() - 1800000).toISOString()
            }
        ],
        2: [
            {
                id: 4,
                author: "Mentor_John",
                author_role: "mentor",
                content: "Key difference:\n\n• <strong>map()</strong>: Returns a NEW array with transformed values. Use when you need the results.\n• <strong>forEach()</strong>: Returns undefined. Use when you just want to perform side effects.\n\nExample:\n<code>const doubled = [1,2,3].map(x => x * 2); // [2, 4, 6]\n[1,2,3].forEach(x => console.log(x)); // just logs</code>",
                created_at: new Date(Date.now() - 1500000).toISOString()
            }
        ],
        3: [
            {
                id: 5,
                author: "Sarah",
                author_role: "student",
                content: "I recommend keeping it simple. Hamburger menus are still the standard for mobile. Just make sure to include proper ARIA labels for screen readers!",
                created_at: new Date(Date.now() - 900000).toISOString()
            }
        ]
    };
    return repliesData[threadId] || [];
}

async function submitReply(event, threadId) {
    event.preventDefault();
    
    const content = document.getElementById('replyContent').value;
    if (!content.trim()) return;
    
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/community/threads/${threadId}/replies/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        
        if (response && response.ok) {
            showToast('Reply posted successfully!', 'success');
            closeThreadDetailModal();
            loadThreads();
        }
    } catch (err) {
        showToast('Failed to post reply.', 'error');
    }
}

async function markAsSolved(threadId) {
    const thread = allThreads.find(t => t.id === threadId);
    if (!thread) return;
    
    if (thread.author !== (currentUser?.username || 'You')) {
        showToast('Only the thread author can mark as solved.', 'error');
        return;
    }
    
    try {
        const response = await authFetch(`${CONFIG.API_BASE}/community/threads/${threadId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'solved' })
        });
        
        if (response && response.ok) {
            showToast('Thread marked as solved!', 'success');
            closeThreadDetailModal();
            loadThreads();
        }
    } catch (err) {
        showToast('Failed to update thread.', 'error');
    }
}

function closeThreadDetailModal() {
    document.getElementById('threadDetailModal').style.display = 'none';
}


// ── FILTER SETUP ──────────────────────────────────────────────

function setupFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentFilter = tab.dataset.filter;
            loadThreads(); // re-fetch with new filter
        });
    });
}


// ── HELPER FUNCTIONS ──────────────────────────────────────────

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}


// Close modals on outside click
window.addEventListener('click', (e) => {
    const newThreadModal = document.getElementById('newThreadModal');
    const detailModal = document.getElementById('threadDetailModal');
    
    if (e.target === newThreadModal) {
        closeNewThreadModal();
    }
    if (e.target === detailModal) {
        closeThreadDetailModal();
    }
});


// Close modals on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeNewThreadModal();
        closeThreadDetailModal();
    }
});