// ============================================
// PROJECT-SUBMIT.JS - Enhanced GitHub Submission
// ============================================

let repoData = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📤 Project submission page loaded');
    
    // Set up form submission
    const form = document.getElementById('projectSubmissionForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

// ============================================
// GITHUB URL VALIDATION
// ============================================
function validateGitHubUrl() {
    const urlInput = document.getElementById('githubUrl');
    const validationMsg = document.getElementById('urlValidation');
    const url = urlInput.value.trim();
    
    // GitHub URL pattern
    const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
    
    if (!url) {
        validationMsg.textContent = '';
        validationMsg.className = 'validation-message';
        return false;
    }
    
    if (!githubPattern.test(url)) {
        validationMsg.textContent = '❌ Invalid GitHub URL format. Expected: https://github.com/username/repository';
        validationMsg.className = 'validation-message error';
        return false;
    }
    
    validationMsg.textContent = '✓ Valid GitHub URL';
    validationMsg.className = 'validation-message success';
    return true;
}

// ============================================
// FETCH REPO PREVIEW
// ============================================
async function fetchRepoPreview() {
    const urlInput = document.getElementById('githubUrl');
    const url = urlInput.value.trim();
    
    if (!validateGitHubUrl()) {
        showToast('Please enter a valid GitHub URL', 'error');
        return;
    }
    
    // Extract owner and repo from URL
    const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) {
        showToast('Could not parse GitHub URL', 'error');
        return;
    }
    
    const [, owner, repo] = match;
    
    try {
        // Fetch from GitHub API
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Repository not found. Make sure it exists and is public.');
            }
            throw new Error('Failed to fetch repository');
        }
        
        repoData = await response.json();
        displayRepoPreview(repoData);
        
        // Auto-fill title if empty
        const titleInput = document.getElementById('projectTitle');
        if (!titleInput.value) {
            titleInput.value = repoData.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
    } catch (error) {
        console.error('Error fetching repo:', error);
        showToast(error.message, 'error');
    }
}

// ============================================
// DISPLAY REPO PREVIEW
// ============================================
function displayRepoPreview(repo) {
    const previewCard = document.getElementById('repoPreview');
    
    // Update preview content
    document.getElementById('repoName').textContent = repo.full_name;
    document.getElementById('repoDescription').textContent = repo.description || 'No description available';
    
    // Language
    if (repo.language) {
        document.getElementById('repoLanguage').textContent = repo.language;
        document.getElementById('repoLanguage').style.display = 'inline-block';
    } else {
        document.getElementById('repoLanguage').style.display = 'none';
    }
    
    // Stars
    document.getElementById('repoStars').textContent = `⭐ ${repo.stargazers_count}`;
    
    // Last updated
    const lastUpdated = new Date(repo.updated_at);
    const timeAgo = getTimeAgo(lastUpdated);
    document.getElementById('repoUpdated').textContent = `Updated ${timeAgo}`;
    
    // Show the preview card
    previewCard.style.display = 'block';
    
    showToast('Repository verified!', 'success');
}

// ============================================
// TIME AGO HELPER
// ============================================
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return `${interval} ${name}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'just now';
}

// ============================================
// CHARACTER COUNT
// ============================================
function updateCharCount() {
    const textarea = document.getElementById('projectDescription');
    const counter = document.getElementById('descCharCount');
    counter.textContent = textarea.value.length;
}

// ============================================
// FORM SUBMISSION
// ============================================
async function handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
    
    try {
        // Validate GitHub URL one more time
        if (!validateGitHubUrl()) {
            throw new Error('Please provide a valid GitHub URL');
        }
        
        // Collect form data
        const formData = new FormData(event.target);
        
        // Get selected technologies
        const technologies = Array.from(
            document.querySelectorAll('input[name="technologies"]:checked')
        ).map(cb => cb.value);
        
        const projectData = {
            github_url: formData.get('github_url'),
            title: formData.get('title'),
            category: formData.get('category'),
            description: formData.get('description'),
            technologies: technologies,
            live_demo: formData.get('live_demo') || null,
            // Add repo metadata if available
            repo_metadata: repoData ? {
                full_name: repoData.full_name,
                description: repoData.description,
                language: repoData.language,
                stars: repoData.stargazers_count,
                last_updated: repoData.updated_at
            } : null
        };
        
        // Submit to backend
        const response = await authFetch(`${CONFIG.API_BASE}/community/projects/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.message || 'Failed to submit project');
        }
        
        const result = await response.json();
        
        notifyToast('Project submitted successfully! Redirecting to community... 🎉', 'success');
        
        // Redirect to community page after success
        setTimeout(() => {
            window.location.href = 'community.html';
        }, 1200);
        
    } catch (error) {
        console.error('Error submitting project:', error);
        notifyToast(error.message, 'error');
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Submit Project
        `;
    }
}

// ============================================
// UTILITY
// ============================================
function notifyToast(message, type = 'info') {
    if (typeof window.showToast === 'function' && window.showToast !== notifyToast) {
        window.showToast(message, type);
        return;
    }
    alert(message);
}