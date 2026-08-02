// lesson-api-loader.js - Django API Loader with Next Lesson Navigation
// Place this file in: JS/lesson-api-loader.js

// Configuration
const API_CONFIG = {
    baseURL: `${CONFIG.API_BASE}/dashboard`,  // Dashboard app endpoints
    endpoints: {
        lesson: (week, topicId) => `/lessons/${week}/${topicId}/`,
        complete: '/lessons/complete/',
        progress: '/progress/',
        weekTopics: (week) => `/weeks/${week}/topics/`  // To get next lesson
    }
};

// API Helper Class
class LessonAPI {
    constructor() {
        this.token = localStorage.getItem('access_token');
    }

    async fetch(endpoint, options = {}) {
        const url = API_CONFIG.baseURL + endpoint;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async getLesson(week, topicId) {
        return this.fetch(API_CONFIG.endpoints.lesson(week, topicId));
    }

    async markComplete(topicId, progress = 100) {
        return this.fetch(API_CONFIG.endpoints.complete, {
            method: 'POST',
            body: JSON.stringify({ topic_id: topicId, progress })
        });
    }

    async getWeekTopics(week) {
        return this.fetch(API_CONFIG.endpoints.weekTopics(week));
    }

    async getProgress() {
        return this.fetch(API_CONFIG.endpoints.progress);
    }
}

// Lesson Loader Class
class LessonLoader {
    constructor() {
        this.api = new LessonAPI();
        this.week = null;
        this.topicId = null;
        this.lessonData = null;
        this.nextLesson = null;
        this.availableWeeks = [];
        this.currentWeek = 1;
    }

    async init() {
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        this.week = params.get('week');
        this.topicId = params.get('topic');

        if (!this.week || !this.topicId) {
            this.showError('Invalid lesson URL. Week and topic parameters required.');
            return;
        }

        // Load lesson
        try {
            // Load available weeks for dropdown
            await this.loadWeekDropdown();
            
            this.lessonData = await this.api.getLesson(this.week, this.topicId);
            
            // Find next lesson
            await this.findNextLesson();
            
            this.render();
        } catch (error) {
            console.error('Load error:', error);
            this.showError('Failed to load lesson. Please try again.');
        }
    }

    async loadWeekDropdown() {
        try {
            // Get user progress to determine unlocked weeks
            const progress = await this.api.getProgress();
            
            // Find current week (first incomplete or last week)
            this.currentWeek = 1;
            for (const week of progress.weeks) {
                if (week.completion_percentage < 100) {
                    this.currentWeek = week.week_number;
                    break;
                }
                this.currentWeek = week.week_number;
            }
            
            // Get all weeks
            const response = await fetch(`${API_CONFIG.baseURL}/weeks/`, {
                headers: {
                    'Authorization': `Bearer ${this.api.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.availableWeeks = await response.json();
                this.populateWeekDropdown();
            }
        } catch (error) {
            console.error('Error loading week dropdown:', error);
        }
    }

    populateWeekDropdown() {
        const dropdown = document.getElementById('weekSelect');
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        
        // ALWAYS include weeks from 1 to current week
        // Don't hide Week 1!
        this.availableWeeks.forEach(week => {
            // Show ALL weeks from 1 up to and including current week
            if (week.number <= this.currentWeek) {
                const option = document.createElement('option');
                option.value = week.number;
                option.textContent = `Week ${week.number}: ${week.title}`;
                
                // Mark current selection
                if (week.number == this.week) {
                    option.selected = true;
                }
                
                dropdown.appendChild(option);
            }
        });
        
        // If dropdown is empty, add at least Week 1
        if (dropdown.options.length === 0 && this.availableWeeks.length > 0) {
            const week1 = this.availableWeeks.find(w => w.number === 1);
            if (week1) {
                const option = document.createElement('option');
                option.value = 1;
                option.textContent = `Week 1: ${week1.title}`;
                option.selected = true;
                dropdown.appendChild(option);
            }
        }
        
        // Add change event
        dropdown.addEventListener('change', (e) => {
            const selectedWeek = e.target.value;
            if (selectedWeek && selectedWeek != this.week) {
                // Navigate to skills page for selected week
                window.location.href = `skills.html?week=${selectedWeek}`;
            }
        });
    }
    async findNextLesson() {
        try {
            // Get all topics for this week
            const topics = await this.api.getWeekTopics(this.week);
            
            // Find current topic index
            const currentIndex = topics.findIndex(t => t.id == this.topicId);
            
            // Check if there's a next topic in the same week
            if (currentIndex !== -1 && currentIndex < topics.length - 1) {
                this.nextLesson = {
                    week: this.week,
                    topicId: topics[currentIndex + 1].id,
                    title: topics[currentIndex + 1].title
                };
            } else {
                // Try next week
                try {
                    const nextWeekTopics = await this.api.getWeekTopics(parseInt(this.week) + 1);
                    if (nextWeekTopics.length > 0) {
                        this.nextLesson = {
                            week: parseInt(this.week) + 1,
                            topicId: nextWeekTopics[0].id,
                            title: nextWeekTopics[0].title
                        };
                    }
                } catch (e) {
                    // No next week available
                    this.nextLesson = null;
                }
            }
        } catch (error) {
            console.error('Error finding next lesson:', error);
            this.nextLesson = null;
        }
    }

    render() {
        const container = document.getElementById('lessonContainer');
        
        // Build lesson HTML
        container.innerHTML = `
            <!-- Lesson Header -->
            <div class="lesson-header">
                <div class="lesson-meta">
                    <span class="lesson-badge">Week ${this.lessonData.week_number}</span>
                    <span class="lesson-duration">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${this.lessonData.duration}
                    </span>
                </div>
                <h1 class="lesson-title">${this.lessonData.title}</h1>
                <p class="lesson-description">${this.lessonData.description}</p>
                <div class="lesson-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.lessonData.completion_percentage}%"></div>
                    </div>
                    <span class="progress-text">${this.lessonData.completion_percentage}% Complete</span>
                </div>
            </div>

            <!-- Lesson Content -->
            <article class="lesson-content">
                ${this.renderContent()}
                ${this.renderTakeaways()}
            </article>

            <!-- Navigation -->
            <div class="lesson-navigation">
                <button class="nav-btn prev-btn" onclick="window.history.back()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Back to Skills
                </button>
                <button class="nav-btn next-btn" onclick="lessonLoader.markComplete()" id="completeBtn">
                    ${this.lessonData.is_completed ? 'Completed ✓' : 'Mark as Complete'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
            </div>
        `;

        // Update breadcrumb
        document.querySelector('.breadcrumb').innerHTML = `
            <a href="skills.html">Skills</a>
            <span>/</span>
            <a href="skills.html?week=${this.week}">Week ${this.week}</a>
            <span>/</span>
            <span>${this.lessonData.title}</span>
        `;

        // Initialize features
        this.initFeatures();
    }

    renderContent() {
        // Check if structured sections exist
        if (this.lessonData.sections && this.lessonData.sections.length > 0) {
            return this.lessonData.sections.map((section, idx) => `
                <section id="${section.id}" class="content-section">
                    <h2>
                        <span class="section-number">${String(idx + 1).padStart(2, '0')}</span>
                        ${section.title}
                    </h2>
                    ${section.content || ''}
                </section>
            `).join('');
        }
        
        // Otherwise render plain HTML content
        return this.lessonData.content || '<p>No content available.</p>';
    }

    renderTakeaways() {
        if (!this.lessonData.key_points || this.lessonData.key_points.length === 0) {
            return '';
        }

        return `
            <div class="takeaways-box">
                <h3>✨ Key Takeaways</h3>
                <ul>
                    ${this.lessonData.key_points.map(point => `<li>${point}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    initFeatures() {
        // Syntax highlighting
        if (typeof hljs !== 'undefined') {
            hljs.highlightAll();
        }

        // Scroll progress tracking
        this.initScrollTracking();
    }

    initScrollTracking() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (!progressFill || !progressText) return;

        window.addEventListener('scroll', () => {
            const article = document.querySelector('.lesson-content');
            if (!article) return;

            const scrollTop = window.pageYOffset;
            const docHeight = article.offsetHeight;
            const winHeight = window.innerHeight;
            const scrollPercent = scrollTop / (docHeight - winHeight);
            const scrollProgress = Math.min(Math.max(scrollPercent * 100, 0), 100);

            // Only update if user is scrolling (not on initial load)
            if (scrollTop > 100) {
                const currentProgress = parseInt(progressFill.style.width) || this.lessonData.completion_percentage;
                const newProgress = Math.max(currentProgress, Math.round(scrollProgress));
                
                progressFill.style.width = `${newProgress}%`;
                progressText.textContent = `${newProgress}% Complete`;
            }
        });
    }

    async markComplete() {
        const btn = document.getElementById('completeBtn');
        const originalHTML = btn.innerHTML;

        try {
            // Show loading
            btn.disabled = true;
            btn.innerHTML = `
                <span class="spinner-small"></span>
                Saving...
            `;

            // Mark complete via API
            await this.api.markComplete(this.topicId, 100);

            // Update UI
            document.querySelector('.progress-fill').style.width = '100%';
            document.querySelector('.progress-text').textContent = '100% Complete';
            
            // Show success notification
            this.showNotification('Lesson marked as complete! 🎉', 'success');

            // Update button to show next lesson option
            if (this.nextLesson) {
                btn.innerHTML = `
                    Next Lesson
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                `;
                btn.onclick = () => this.goToNextLesson();
                btn.disabled = false;
            } else {
                btn.innerHTML = `
                    Completed ✓
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;
                btn.disabled = true;
            }

        } catch (error) {
            console.error('Complete error:', error);
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            this.showNotification('Failed to save. Please try again.', 'error');
        }
    }

    goToNextLesson() {
        if (this.nextLesson) {
            this.showNotification(`Loading: ${this.nextLesson.title}...`, 'info');
            window.location.href = `lesson.html?week=${this.nextLesson.week}&topic=${this.nextLesson.topicId}`;
        }
    }

    showError(message) {
        document.getElementById('lessonContainer').innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <h2 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Error</h2>
                <p style="color: #6b7280; margin-bottom: 2rem;">${message}</p>
                <a href="skills.html" style="display: inline-block; padding: 0.75rem 1.5rem; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">
                    Back to Skills
                </a>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6' };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 10000;
            padding: 1rem 1.5rem; border-radius: 8px; color: white;
            background: ${colors[type]}; font-weight: 600;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Copy code function
function copyCode(button) {
    const code = button.closest('.code-block').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const original = button.innerHTML;
        button.innerHTML = '✓ Copied!';
        button.style.background = 'rgba(16, 185, 129, 0.2)';
        setTimeout(() => {
            button.innerHTML = original;
            button.style.background = 'transparent';
        }, 2000);
    });
}

// Initialize on page load
let lessonLoader;
document.addEventListener('DOMContentLoaded', async () => {
    lessonLoader = new LessonLoader();
    await lessonLoader.init();
});

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .spinner-small {
        display: inline-block; width: 16px; height: 16px;
        border: 2px solid white; border-top-color: transparent;
        border-radius: 50%; animation: spin 0.8s linear infinite;
    }
`;
document.head.appendChild(style);