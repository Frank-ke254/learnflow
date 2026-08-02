// ===========================
//  ENHANCED LEARNFLOW LANDING PAGE JS
//  Features: Mobile menu, smooth scroll, animations, enrollment, stats counter
// ===========================

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initMobileMenu();
  initSmoothScroll();
  initScrollAnimations();
  initFAQ();
  initBackToTop();
  initStatsCounter();
  initNewsletterSubscription();
});

// ===========================
// PAGE LOADER
// ===========================
function initPageLoader() {
  window.addEventListener('load', () => {
    const loader = document.getElementById('pageLoader');
    setTimeout(() => {
      loader.classList.add('hidden');
    }, 500);
  });
}

// ===========================
// MOBILE MENU
// ===========================
function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const nav = document.getElementById('authNav');
  
  if (!toggle || !nav) return;
  
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav.classList.toggle('active');
  });
  
  // Close menu when clicking nav links
  const navLinks = nav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('active');
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      toggle.classList.remove('active');
      nav.classList.remove('active');
    }
  });
}

// ===========================
// SMOOTH SCROLL
// ===========================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = target.offsetTop - headerHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ===========================
// SCROLL ANIMATIONS (AOS Alternative)
// ===========================
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Observe all elements with data-aos attribute
  document.querySelectorAll('[data-aos]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
  
  // Header scroll effect
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ===========================
// FAQ ACCORDION
// ===========================
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
      // Close other items
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      item.classList.toggle('active');
    });
  });
}

// ===========================
// BACK TO TOP BUTTON
// ===========================
function initBackToTop() {
  const backToTop = document.getElementById('backToTop');
  
  if (!backToTop) return;
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  });
  
  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ===========================
// STATS COUNTER ANIMATION
// ===========================
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-number');
  let hasAnimated = false;
  
  const observerOptions = {
    threshold: 0.5
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;
        animateCounters();
      }
    });
  }, observerOptions);
  
  if (statNumbers.length > 0) {
    observer.observe(statNumbers[0].parentElement.parentElement);
  }
  
  function animateCounters() {
    statNumbers.forEach(stat => {
      const target = parseInt(stat.dataset.target);
      const duration = 2000; // 2 seconds
      const increment = target / (duration / 16); // 60fps
      let current = 0;
      
      const updateCounter = () => {
        current += increment;
        if (current < target) {
          stat.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          stat.textContent = target;
        }
      };
      
      updateCounter();
    });
  }
}

// ===========================
// NEWSLETTER SUBSCRIPTION
// ===========================
function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  const email = emailInput.value.trim();
  
  if (!email) {
    showNotification('Please enter your email address', 'error');
    return;
  }
  
  if (!isValidEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }
  
  showNotification(`Thank you for subscribing! We'll send updates to ${email}`, 'success');
  emailInput.value = '';
}

function initNewsletterSubscription() {
  const input = document.getElementById('newsletterEmail');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        subscribeNewsletter();
      }
    });
  }
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===========================
// COURSE ENROLLMENT
// ===========================
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.enroll-btn');
  if (!btn) return;
  
  // Prevent multiple clicks
  if (btn.disabled) return;
  
  // 1. Check Authentication
  const token = localStorage.getItem("access_token");
  if (!token) {
    if (confirm("Please login to enroll in this course. Click OK to go to login page.")) {
      window.location.href = 'login.html';
    }
    return;
  }
  
  // 2. Visual Feedback
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-small"></span> Enrolling...';
  
  // 3. Get Course ID
  const courseId = btn.dataset.course || 1;
  
  try {
    // 4. API Request
    const response = await fetch(`${CONFIG.API_BASE}/dashboard/enroll/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path_id: courseId })
    });
    
    if (response.ok) {
      // Clear cached data
      localStorage.removeItem("dashboard_data");
      
      // Show success message
      showNotification('Successfully enrolled! Redirecting to dashboard...', 'success');
      
      // Redirect after brief delay
      setTimeout(() => {
        window.location.href = 'dash.html';
      }, 1500);
    } else {
      const errorData = await response.json();
      showNotification(errorData.message || "Enrollment failed. You might already be enrolled.", 'error');
      
      // Reset button
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  } catch (err) {
    console.error("Enrollment error:", err);
    showNotification("Could not connect to the server. Please ensure the backend is running.", 'error');
    
    // Reset button
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

// ===========================
// NOTIFICATION SYSTEM
// ===========================
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
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
  
  // Set background color based on type
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#3b82f6',
    warning: '#f59e0b'
  };
  
  notification.style.background = colors[type] || colors.info;
  notification.textContent = message;
  notification.style.display = 'block';
  
  // Auto hide after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      notification.style.display = 'none';
    }, 300);
  }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);