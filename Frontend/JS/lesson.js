// ===========================
//  LESSON PAGE - INTERACTIVE FEATURES
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initializeSyntaxHighlighting();
    initializeProgressTracking();
    initializeSmoothScroll();
    initializeThemeToggle();
});

// ===========================
// SYNTAX HIGHLIGHTING
// ===========================
function initializeSyntaxHighlighting() {
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
}

// ===========================
// PROGRESS TRACKING
// ===========================
function initializeProgressTracking() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (!progressFill || !progressText) return;
    
    // Track scroll progress
    window.addEventListener('scroll', () => {
        const lessonContent = document.querySelector('.lesson-content');
        if (!lessonContent) return;
        
        const contentHeight = lessonContent.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollPosition = window.scrollY;
        
        // Calculate progress percentage
        const maxScroll = contentHeight - windowHeight;
        const progress = Math.min((scrollPosition / maxScroll) * 100, 100);
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% Complete`;
    });
}

// ===========================
// SMOOTH SCROLL TO SECTIONS
// ===========================
function initializeSmoothScroll() {
    document.querySelectorAll('.table-of-contents a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===========================
// THEME TOGGLE
// ===========================
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (!themeToggle) return;
    
    // Check for saved theme preference
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// ===========================
// COPY CODE FUNCTIONALITY
// ===========================
function copyCode(button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        // Visual feedback
        const originalText = button.innerHTML;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
        `;
        button.style.background = 'rgba(16, 185, 129, 0.2)';
        button.style.borderColor = '#10b981';
        button.style.color = '#10b981';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'transparent';
            button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            button.style.color = 'white';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code:', err);
        alert('Failed to copy code to clipboard');
    });
}

// ===========================
// MARK LESSON AS COMPLETE
// ===========================
function markComplete() {
    const lessonId = getLessonIdFromUrl();
    
    // Show loading state
    const button = event.target;
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <span class="spinner-small"></span>
        Saving...
    `;
    
    // Simulate API call to mark lesson complete
    setTimeout(() => {
        // Update progress to 100%
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressFill && progressText) {
            progressFill.style.width = '100%';
            progressText.textContent = '100% Complete';
        }
        
        // Show success notification
        showNotification('Lesson marked as complete! 🎉', 'success');
        
        // Enable next lesson button
        const nextBtn = document.querySelector('.next-btn');
        if (nextBtn) {
            nextBtn.innerHTML = `
                Next Lesson
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            `;
            nextBtn.onclick = () => goToNextLesson();
        }
        
        // Save completion to localStorage (in real app, this would be API call)
        saveCompletion(lessonId);
        
    }, 1000);
}

// ===========================
// HELPER FUNCTIONS
// ===========================
function getLessonIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('week') || '1';
}

function saveCompletion(lessonId) {
    const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
        localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
    }
}

function goToNextLesson() {
    const currentWeek = parseInt(getLessonIdFromUrl());
    const nextWeek = currentWeek + 1;
    window.location.href = `lesson.html?week=${nextWeek}`;
}

function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notification);
    }
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 5000);
}

// ===========================
// READING TIME ESTIMATION
// ===========================
function estimateReadingTime() {
    const content = document.querySelector('.lesson-content');
    if (!content) return;
    
    const text = content.textContent;
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    
    const durationElement = document.querySelector('.lesson-duration');
    if (durationElement && time > 0) {
        durationElement.textContent = `${time} min read`;
    }
}

// ===========================
// HIGHLIGHT ACTIVE SECTION IN TOC
// ===========================
function highlightActiveTocSection() {
    const sections = document.querySelectorAll('.content-section');
    const tocLinks = document.querySelectorAll('.table-of-contents a');
    
    window.addEventListener('scroll', () => {
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop - 150) {
                currentSection = section.getAttribute('id');
            }
        });
        
        tocLinks.forEach(link => {
            link.style.fontWeight = '400';
            link.style.color = 'rgba(255, 255, 255, 0.9)';
            
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.style.fontWeight = '600';
                link.style.color = 'white';
            }
        });
    });
}

// Initialize TOC highlighting
highlightActiveTocSection();

// ===========================
// MOBILE SIDEBAR TOGGLE
// ===========================
function initMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.createElement('button');
    
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    `;
    
    menuToggle.style.cssText = `
        display: none;
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1001;
        background: var(--accent);
        border: none;
        padding: 0.5rem;
        border-radius: 8px;
        color: white;
        cursor: pointer;
    `;
    
    document.body.appendChild(menuToggle);
    
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Show on mobile
    if (window.innerWidth <= 768) {
        menuToggle.style.display = 'block';
    }
    
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            menuToggle.style.display = 'block';
        } else {
            menuToggle.style.display = 'none';
            sidebar.classList.remove('active');
        }
    });
}

initMobileSidebar();

