// ============================================
// SKILLS-ENHANCED.JS - Skills page with topic navigation
// ============================================

let allTopics = [];
let currentWeekData = null;
let selectedTopic = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📚 Enhanced Skills page loaded');
    loadWeeksAndTopics();
});

// ============================================
// LOAD WEEKS AND TOPICS
// ============================================
async function loadWeeksAndTopics() {
    try {
        const token = localStorage.getItem('access_token');
        
        // Load weeks with topics
        const response = await fetch(`${CONFIG.API_BASE}/dashboard/weeks/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load skills');

        const weeks = await response.json();
        
        // Flatten all topics for quick navigation
        allTopics = [];
        weeks.forEach(week => {
            if (week.topics) {
                week.topics.forEach(topic => {
                    allTopics.push({
                        ...topic,
                        week_number: week.week_number,
                        week_title: week.title
                    });
                });
            }
        });
        
        // Render everything
        renderTopicNavigator(allTopics);
        renderWeeksGrid(weeks);
        highlightCurrentWeek(weeks);

    } catch (error) {
        console.error('Error loading skills:', error);
        showToast('Failed to load skills', 'error');
    }
}

// ============================================
// TOPIC NAVIGATOR DROPDOWN
// ============================================
function renderTopicNavigator(topics) {
    const topicsList = document.getElementById('topicsList');
    
    if (!topics || topics.length === 0) {
        topicsList.innerHTML = `
            <div class="empty-topics">
                <p>No topics available yet</p>
            </div>
        `;
        return;
    }
    
    // Group topics by week
    const topicsByWeek = {};
    topics.forEach(topic => {
        const weekKey = `Week ${topic.week_number}`;
        if (!topicsByWeek[weekKey]) {
            topicsByWeek[weekKey] = {
                week_number: topic.week_number,
                week_title: topic.week_title,
                topics: []
            };
        }
        topicsByWeek[weekKey].topics.push(topic);
    });
    
    // Render grouped topics
    topicsList.innerHTML = Object.keys(topicsByWeek).map(weekKey => {
        const weekData = topicsByWeek[weekKey];
        return `
            <div class="week-group">
                <div class="week-group-header">
                    <strong>Week ${weekData.week_number}</strong>
                    <small>${weekData.week_title}</small>
                </div>
                ${weekData.topics.map(topic => `
                    <div class="topic-item ${topic.completed ? 'completed' : ''}" 
                         onclick="navigateToTopic(${topic.id})">
                        <div class="topic-icon">
                            ${topic.completed ? '✓' : '📄'}
                        </div>
                        <div class="topic-info">
                            <div class="topic-name">${topic.title}</div>
                            ${topic.completed ? '<small class="completed-badge">Completed</small>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

// ============================================
// TOGGLE TOPIC MENU
// ============================================
function toggleTopicMenu() {
    const menu = document.getElementById('topicMenu');
    menu.classList.toggle('show');
    
    // Close when clicking outside
    if (menu.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeTopicMenuOutside);
        }, 100);
    }
}

function closeTopicMenuOutside(e) {
    const menu = document.getElementById('topicMenu');
    const navigator = document.getElementById('topicNavigator');
    
    if (!navigator.contains(e.target)) {
        menu.classList.remove('show');
        document.removeEventListener('click', closeTopicMenuOutside);
    }
}

// ============================================
// NAVIGATE TO TOPIC
// ============================================
function navigateToTopic(topicId) {
    // Find the topic
    const topic = allTopics.find(t => t.id === topicId);
    
    if (!topic) return;
    
    // Close dropdown
    document.getElementById('topicMenu').classList.remove('show');
    
    // Scroll to topic or open modal
    openTopicModal(topic);
}

// ============================================
// RENDER WEEKS GRID
// ============================================
function renderWeeksGrid(weeks) {
    const grid = document.getElementById('weeksGrid');
    
    if (!weeks || weeks.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
                <h3>No weeks available yet</h3>
                <p>Content will appear here once weeks are published</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = weeks.map(week => `
        <div class="week-card ${week.is_current ? 'current' : ''}" data-week="${week.week_number}">
            <div class="week-header">
                <div class="week-number">Week ${week.week_number}</div>
                ${week.is_locked ? '<span class="locked-badge">🔒 Locked</span>' : ''}
                ${week.is_current ? '<span class="current-badge">Current</span>' : ''}
            </div>
            
            <h3>${week.title}</h3>
            <p class="week-desc">${week.description || 'Complete topics to unlock'}</p>
            
            <div class="week-progress-bar">
                <div class="progress-fill" style="width: ${week.progress || 0}%"></div>
            </div>
            <small class="progress-label">${week.progress || 0}% Complete</small>
            
            <div class="topics-list">
                ${week.topics && week.topics.length > 0 ? week.topics.map(topic => `
                    <div class="topic-chip ${topic.completed ? 'completed' : ''}" 
                         onclick="openTopicModal(${JSON.stringify(topic).replace(/"/g, '&quot;')})">
                        ${topic.completed ? '✓' : '📄'} ${topic.title}
                    </div>
                `).join('') : '<p class="no-topics">No topics yet</p>'}
            </div>
            
            <div class="week-footer">
                ${week.has_quiz ? `
                    <button class="btn-quiz ${week.quiz_completed ? 'completed' : ''}" 
                            onclick="takeQuiz(${week.quiz_id}, ${week.week_number})"
                            ${week.is_locked ? 'disabled' : ''}>
                        ${week.quiz_completed ? '✓ Quiz Completed' : '📝 Take Quiz'}
                    </button>
                ` : ''}
                
                ${week.has_project ? `
                    <button class="btn-project" 
                            onclick="viewProject(${week.week_number})"
                            ${week.is_locked ? 'disabled' : ''}>
                        📦 Week Project
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// HIGHLIGHT CURRENT WEEK
// ============================================
function highlightCurrentWeek(weeks) {
    if (!weeks || weeks.length === 0) return;

    let currentWeek = weeks.find(w => w.is_current);
    
    if (!currentWeek) {
        // Fallback if backend logic missed finding a current week
        // Find first incomplete week
        currentWeek = weeks.find(w => w.progress < 100);
        // If all are completed, show the last completed week as current
        if (!currentWeek) {
            currentWeek = weeks[weeks.length - 1];
        }
    }
    
    if (currentWeek) {
        currentWeekData = currentWeek;
        
        document.getElementById('currentWeekTitle').textContent = 
            `Week ${currentWeek.week_number}: ${currentWeek.title}`;
        document.getElementById('currentWeekDesc').textContent = 
            currentWeek.description || 'Master the topics this week';
        
        // Animate progress circle
        const progress = currentWeek.progress || 0;
        animateProgressCircle(progress);
    }
}

function animateProgressCircle(percent) {
    const circle = document.getElementById('weekProgressArc');
    const text = document.getElementById('weekProgressText');
    const circumference = 283; // 2 * π * 45
    const offset = circumference - (percent / 100) * circumference;
    
    let current = 0;
    const step = percent / 50;
    
    const animation = setInterval(() => {
        current += step;
        
        if (current >= percent) {
            current = percent;
            clearInterval(animation);
        }
        
        const currentOffset = circumference - (current / 100) * circumference;
        circle.style.strokeDashoffset = currentOffset;
        text.textContent = `${Math.round(current)}%`;
    }, 20);
}

// ============================================
// TOPIC MODAL
// ============================================
function openTopicModal(topic) {
    selectedTopic = topic;
    
    const modal = document.getElementById('topicModal');
    document.getElementById('modalTopicTitle').textContent = topic.title;
    document.getElementById('modalTopicContent').innerHTML = `
        <div class="topic-detail">
            <div class="topic-meta">
                <span class="meta-badge">Week ${topic.week_number}</span>
                ${topic.content_type ? `<span class="meta-badge">${topic.content_type}</span>` : ''}
            </div>
            
            <div class="topic-content">
                ${topic.content || '<p>Loading content...</p>'}
            </div>
            
            ${topic.video_url ? `
                <div class="topic-video">
                    <iframe src="${topic.video_url}" frameborder="0" allowfullscreen></iframe>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeTopicModal() {
    document.getElementById('topicModal').style.display = 'none';
    selectedTopic = null;
}

async function markTopicComplete() {
    if (!selectedTopic) return;
    
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${CONFIG.API_BASE}/dashboard/lessons/complete/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic_id: selectedTopic.id, progress: 100 })
        });
        
        if (response.ok) {
            showToast('Topic marked as complete!', 'success');
            closeTopicModal();
            loadWeeksAndTopics();
        } else {
            showToast('Failed to mark complete.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error connecting to server', 'error');
    }
}

// ============================================
// ACTIONS
// ============================================
function takeQuiz(quizId, weekNumber) {
    window.location.href = `quiz.html?quiz=${quizId}&week=${weekNumber}`;
}

function viewProject(weekNumber) {
    window.location.href = `project-assignment.html?week=${weekNumber}`;
}

// ============================================
// UTILITY
// ============================================
function showToast(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}