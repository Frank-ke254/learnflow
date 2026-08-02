// ============================================
// QUIZ.JS - Complete Quiz System
// ============================================

let currentQuiz = null;
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let quizStartTime = null;
let timerInterval = null;

// Get quiz ID from URL
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quiz');
const weekNumber = urlParams.get('week');

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Quiz page loaded');
    
    if (!quizId) {
        showToast('No quiz specified', 'error');
        setTimeout(() => window.location.href = 'skills.html', 2000);
        return;
    }
    
    loadQuiz();
});

// ============================================
// LOAD QUIZ DATA
// ============================================
async function loadQuiz() {
    try {
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`${CONFIG.API_BASE}/lessons/quiz/${quizId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to load quiz');

        const data = await response.json();
        currentQuiz = data;
        questions = data.questions;
        
        initializeQuiz();
        renderQuestion();

    } catch (error) {
        console.error('Error loading quiz:', error);
        showToast('Failed to load quiz', 'error');
    }
}

// ============================================
// INITIALIZE QUIZ
// ============================================
function initializeQuiz() {
    // Set quiz info
    document.getElementById('quizTitle').textContent = currentQuiz.title;
    document.getElementById('weekTitle').textContent = `Week ${weekNumber}`;
    document.getElementById('passingScore').textContent = currentQuiz.passing_score;
    document.getElementById('totalQuestions').textContent = questions.length;
    
    // Initialize user answers
    questions.forEach((q, index) => {
        userAnswers[index] = null;
    });
    
    // Start timer if enabled
    if (currentQuiz.time_limit) {
        startTimer(currentQuiz.time_limit * 60); // Convert minutes to seconds
    }
    
    quizStartTime = new Date();
}

// ============================================
// RENDER CURRENT QUESTION
// ============================================
function renderQuestion() {
    const container = document.getElementById('questionsContainer');
    const question = questions[currentQuestionIndex];
    
    container.innerHTML = `
        <div class="question-card">
            <div class="question-number">Question ${currentQuestionIndex + 1}</div>
            <h3 class="question-text">${question.text}</h3>
            
            <div class="options-list">
                ${renderOption('A', question.option_a)}
                ${renderOption('B', question.option_b)}
                ${renderOption('C', question.option_c)}
                ${renderOption('D', question.option_d)}
            </div>
        </div>
    `;
    
    // Update progress
    updateProgress();
    
    // Update navigation buttons
    updateNavigationButtons();
    
    // Restore previous answer if exists
    const savedAnswer = userAnswers[currentQuestionIndex];
    if (savedAnswer) {
        const radio = document.querySelector(`input[value="${savedAnswer}"]`);
        if (radio) radio.checked = true;
    }
}

// ============================================
// RENDER OPTION
// ============================================
function renderOption(letter, text) {
    const isSelected = userAnswers[currentQuestionIndex] === letter;
    
    return `
        <label class="option-label ${isSelected ? 'selected' : ''}">
            <input type="radio" 
                   name="question${currentQuestionIndex}" 
                   value="${letter}" 
                   onchange="selectAnswer('${letter}')"
                   ${isSelected ? 'checked' : ''}>
            <div class="option-content">
                <span class="option-letter">${letter}</span>
                <span class="option-text">${text}</span>
            </div>
        </label>
    `;
}

// ============================================
// SELECT ANSWER
// ============================================
function selectAnswer(letter) {
    userAnswers[currentQuestionIndex] = letter;
    
    // Update UI to show selection
    document.querySelectorAll('.option-label').forEach(label => {
        label.classList.remove('selected');
    });
    
    const selectedLabel = event.target.closest('.option-label');
    if (selectedLabel) {
        selectedLabel.classList.add('selected');
    }
}

// ============================================
// NAVIGATION
// ============================================
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Previous button
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // Next/Submit button
    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

// ============================================
// UPDATE PROGRESS
// ============================================
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;
}

// ============================================
// TIMER
// ============================================
function startTimer(seconds) {
    const timerElement = document.getElementById('quizTimer');
    const displayElement = document.getElementById('timerDisplay');
    
    timerElement.style.display = 'flex';
    
    let timeRemaining = seconds;
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const secs = timeRemaining % 60;
        
        displayElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
        
        // Warning at 2 minutes
        if (timeRemaining === 120) {
            timerElement.classList.add('warning');
            showToast('2 minutes remaining!', 'warning');
        }
        
        // Critical at 30 seconds
        if (timeRemaining === 30) {
            timerElement.classList.add('critical');
            showToast('30 seconds remaining!', 'error');
        }
        
        // Time's up
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            showToast('Time is up! Submitting quiz...', 'info');
            submitQuiz();
        }
    }, 1000);
}

// ============================================
// SUBMIT QUIZ
// ============================================
async function submitQuiz() {
    // Check if all questions answered
    const unanswered = Object.values(userAnswers).filter(a => a === null).length;
    
    if (unanswered > 0) {
        const confirmSubmit = confirm(
            `You have ${unanswered} unanswered question(s). Submit anyway?`
        );
        if (!confirmSubmit) return;
    }
    
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    // Calculate time taken
    const timeTaken = Math.floor((new Date() - quizStartTime) / 1000);
    
    // Prepare submission data
    const answers = questions.map((q, index) => ({
        question_id: q.id,
        selected_answer: userAnswers[index]
    }));
    
    try {
        const token = localStorage.getItem('access_token');
        
        const response = await fetch(`${CONFIG.API_BASE}/lessons/quiz/${quizId}/submit/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers: answers,
                time_taken: timeTaken
            })
        });

        if (!response.ok) throw new Error('Failed to submit quiz');

        const result = await response.json();
        
        // Show results
        showResults(result);

    } catch (error) {
        console.error('Error submitting quiz:', error);
        showToast('Failed to submit quiz', 'error');
    }
}

// ============================================
// SHOW RESULTS
// ============================================
function showResults(result) {
    // Hide quiz container
    document.getElementById('quizContainer').style.display = 'none';
    
    // Show results container
    const resultsContainer = document.getElementById('quizResults');
    resultsContainer.style.display = 'block';
    
    // Calculate score percentage
    const scorePercent = Math.round((result.score / questions.length) * 100);
    
    // Animate score circle
    animateScoreCircle(scorePercent);
    
    // Update result text
    document.getElementById('scoreNumber').textContent = scorePercent;
    document.getElementById('correctCount').textContent = result.score;
    document.getElementById('incorrectCount').textContent = questions.length - result.score;
    document.getElementById('pointsEarned').textContent = `+${result.points_awarded || 0}`;
    
    // Result message
    const passed = scorePercent >= currentQuiz.passing_score;
    const resultTitle = document.getElementById('resultTitle');
    const resultMessage = document.getElementById('resultMessage');
    
    if (passed) {
        resultTitle.textContent = '🎉 Congratulations!';
        resultMessage.textContent = `You passed with ${scorePercent}%! You scored ${result.score} out of ${questions.length} questions correctly.`;
        resultTitle.style.color = '#10b981';
    } else {
        resultTitle.textContent = '📚 Keep Practicing!';
        resultMessage.textContent = `You scored ${scorePercent}%. You need ${currentQuiz.passing_score}% to pass. You got ${result.score} out of ${questions.length} questions correct.`;
        resultTitle.style.color = '#ef4444';
        
        // Show retake button
        document.getElementById('retakeBtn').style.display = 'block';
    }
    
    // Render answer review
    renderAnswerReview(result.answers);
}

// ============================================
// ANIMATE SCORE CIRCLE
// ============================================
function animateScoreCircle(percent) {
    const circle = document.getElementById('scoreArc');
    const circumference = 565.48; // 2 * π * 90
    const offset = circumference - (percent / 100) * circumference;
    
    // Animate from 100% to actual score
    let currentPercent = 0;
    const step = percent / 50; // 50 frames
    
    const animation = setInterval(() => {
        currentPercent += step;
        
        if (currentPercent >= percent) {
            currentPercent = percent;
            clearInterval(animation);
        }
        
        const currentOffset = circumference - (currentPercent / 100) * circumference;
        circle.style.strokeDashoffset = currentOffset;
        
        // Change color based on score
        if (currentPercent >= 80) {
            circle.style.stroke = '#10b981'; // Green
        } else if (currentPercent >= 60) {
            circle.style.stroke = '#f59e0b'; // Yellow
        } else {
            circle.style.stroke = '#ef4444'; // Red
        }
    }, 20);
}

// ============================================
// RENDER ANSWER REVIEW
// ============================================
function renderAnswerReview(answers) {
    const reviewList = document.getElementById('reviewList');
    
    reviewList.innerHTML = answers.map((answer, index) => {
        const question = questions[index];
        const isCorrect = answer.is_correct;
        
        return `
            <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-header">
                    <span class="review-number">Question ${index + 1}</span>
                    <span class="review-status">
                        ${isCorrect 
                            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Correct' 
                            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Incorrect'}
                    </span>
                </div>
                
                <p class="review-question">${question.text}</p>
                
                <div class="review-answers">
                    <div class="review-answer ${answer.selected_answer === question.correct_answer ? 'correct-answer' : 'wrong-answer'}">
                        <strong>Your answer:</strong> ${answer.selected_answer}. ${question['option_' + answer.selected_answer.toLowerCase()]}
                    </div>
                    
                    ${!isCorrect ? `
                        <div class="review-answer correct-answer">
                            <strong>Correct answer:</strong> ${question.correct_answer}. ${question['option_' + question.correct_answer.toLowerCase()]}
                        </div>
                    ` : ''}
                </div>
                
                ${question.explanation ? `
                    <div class="review-explanation">
                        <strong>Explanation:</strong> ${question.explanation}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// RETAKE QUIZ
// ============================================
function retakeQuiz() {
    // Reset state
    currentQuestionIndex = 0;
    userAnswers = {};
    questions.forEach((q, index) => {
        userAnswers[index] = null;
    });
    
    // Reset UI
    document.getElementById('quizResults').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'block';
    
    // Re-initialize
    quizStartTime = new Date();
    if (currentQuiz.time_limit) {
        startTimer(currentQuiz.time_limit * 60);
    }
    
    renderQuestion();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showToast(message, type = 'info') {
    // Use existing toast function from utils.js
    if (window.showToast) {
        window.showToast(message, type);
    } else {
        alert(message);
    }
}