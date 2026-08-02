// ============================================
// MENTOR REVIEW - Complete Implementation
// Add this to your mentor-review.js or create it
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadPendingSubmissions();
});

// Load all submissions
async function loadPendingSubmissions() {
    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${CONFIG.API_BASE}/projects/pending/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load submissions');

        const submissions = await response.json();
        renderSubmissions(submissions);

    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}

// Render submissions in the queue
function renderSubmissions(submissions) {
    const queueContainer = document.querySelector('.submission-queue');
    if (!queueContainer) return;

    if (submissions.length === 0) {
        queueContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="color: #6b7280;">No pending submissions</p>
            </div>
        `;
        return;
    }

    queueContainer.innerHTML = submissions.map(submission => `
        <div class="submission-card" data-id="${submission.id}">
            <h3>${submission.title}</h3>
            <p>by @${submission.student_username} • ${submission.category}</p>
            <button class="review-btn ${getButtonClass(submission.status)}" 
                    onclick="reviewSubmission(${submission.id})"
                    ${submission.status !== 'pending' ? 'disabled' : ''}>
                ${getButtonText(submission.status)}
            </button>
        </div>
    `).join('');
}

// Get button text based on status
function getButtonText(status) {
    const statusMap = {
        'pending': 'Review',
        'approved': '✓ Approved',
        'needs_revision': '✗ Needs Revision',
        'rejected': '✗ Rejected'
    };
    return statusMap[status] || 'Review';
}

// Get button class based on status
function getButtonClass(status) {
    const classMap = {
        'pending': 'btn-primary',
        'approved': 'btn-success',
        'needs_revision': 'btn-warning',
        'rejected': 'btn-danger'
    };
    return classMap[status] || 'btn-primary';
}

// Review a submission
async function reviewSubmission(submissionId) {
    try {
        const token = localStorage.getItem('access_token');
        
        // Fetch submission details
        const response = await fetch(`${CONFIG.API_BASE}/projects/${submissionId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load submission');

        const submission = await response.json();
        
        // Show in detail panel
        displaySubmissionDetail(submission);

    } catch (error) {
        console.error('Error loading submission:', error);
        alert('Failed to load submission details');
    }
}

// Display submission in detail panel
function displaySubmissionDetail(submission) {
    const detailPanel = document.querySelector('.submission-detail');
    if (!detailPanel) return;

    detailPanel.innerHTML = `
        <div class="detail-header">
            <h2>${submission.title}</h2>
            <span class="status-badge ${submission.status}">${submission.status.replace('_', ' ').toUpperCase()}</span>
        </div>
        
        <div class="detail-content">
            <div class="info-row">
                <strong>Student:</strong>
                <span>@${submission.student_username}</span>
            </div>
            
            <div class="info-row">
                <strong>Category:</strong>
                <span>${submission.category}</span>
            </div>
            
            <div class="info-row">
                <strong>Description:</strong>
                <p>${submission.description}</p>
            </div>
            
            <div class="info-row">
                <strong>GitHub Repository:</strong>
                <a href="${submission.github_url}" target="_blank" rel="noopener">
                    ${submission.github_url} →
                </a>
            </div>
            
            ${submission.previous_feedback ? `
                <div class="info-row">
                    <strong>Previous Feedback:</strong>
                    <div class="previous-feedback">${submission.previous_feedback}</div>
                </div>
            ` : ''}
        </div>
        
        <div class="review-form">
            <label for="feedback">Feedback (Optional):</label>
            <textarea id="feedback" rows="5" placeholder="Provide constructive feedback...">${submission.feedback || ''}</textarea>
            
            <div class="review-actions">
                <button class="btn-approve" onclick="submitReview(${submission.id}, 'approved')">
                    ✓ Approve & Complete
                </button>
                <button class="btn-revision" onclick="submitReview(${submission.id}, 'needs_revision')">
                    ✗ Needs Revision
                </button>
            </div>
        </div>
    `;
}

// Submit review decision
async function submitReview(submissionId, status) {
    const feedback = document.getElementById('feedback').value;
    
    if (status === 'needs_revision' && !feedback.trim()) {
        alert('Please provide feedback explaining what needs revision');
        return;
    }
    
    try {
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`${CONFIG.API_BASE}/projects/${submissionId}/review/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status,
                feedback: feedback
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Review failed');
        }

        const result = await response.json();
        
        // Show success message
        showToast(`Project ${status === 'approved' ? 'approved' : 'marked for revision'}!`, 'success');
        
        // Update the submission card in the queue
        updateSubmissionCard(submissionId, status);
        
        // Clear detail panel
        clearDetailPanel();
        
        // Reload submissions
        setTimeout(() => loadPendingSubmissions(), 1000);

    } catch (error) {
        console.error('Error submitting review:', error);
        showToast(error.message || 'Failed to submit review', 'error');
    }
}

// Update submission card in queue
function updateSubmissionCard(submissionId, status) {
    const card = document.querySelector(`.submission-card[data-id="${submissionId}"]`);
    if (!card) return;
    
    const button = card.querySelector('.review-btn');
    if (button) {
        button.textContent = getButtonText(status);
        button.className = `review-btn ${getButtonClass(status)}`;
        button.disabled = true;
    }
}

// Clear detail panel
function clearDetailPanel() {
    const detailPanel = document.querySelector('.submission-detail');
    if (detailPanel) {
        detailPanel.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #6b7280;">
                <p>Select a submission to review</p>
            </div>
        `;
    }
}

// Toast notification helper
function showToast(message, type = 'success') {
    // Use your existing toast function or create a simple one
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions globally available
window.reviewSubmission = reviewSubmission;
window.submitReview = submitReview;