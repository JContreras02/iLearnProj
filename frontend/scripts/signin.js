// signin.js - This will handle the login functionality with course enrollment integration

document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a redirect parameter in the URL
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    if (redirect) {
      // Store the redirect URL for after login
      localStorage.setItem('redirectAfterLogin', redirect);
    }
    
    // Set up login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  });
  
  async function handleLogin(event) {
    event.preventDefault();
    
    // Get form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validate input
    if (!email || !password) {
      showError('Email and password are required');
      return;
    }
    
    try {
      // Show loading state
      const submitButton = document.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
      
      // Send login request to API
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      // Parse response
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);
      
      // Check if there's a pending course enrollment
      const pendingEnrollment = localStorage.getItem('enrollAfterLogin');
      
      // Determine where to redirect the user
      let redirectUrl;
      
      if (pendingEnrollment) {
        // User was trying to enroll in a course
        const enrollment = JSON.parse(pendingEnrollment);
        
        // Clear the pending enrollment
        localStorage.removeItem('enrollAfterLogin');
        
        // Attempt to enroll in the course
        try {
          await enrollAfterLogin(enrollment.id, enrollment.title);
          redirectUrl = 'student.html'; // Redirect to student dashboard after enrollment
        } catch (error) {
          console.error('Failed to enroll after login:', error);
          // Fall back to role-based redirect
          redirectUrl = getRoleBasedRedirect(data.user.role);
        }
      } else {
        // No pending enrollment, check for other redirect
        const savedRedirect = localStorage.getItem('redirectAfterLogin');
        if (savedRedirect) {
          redirectUrl = savedRedirect;
          localStorage.removeItem('redirectAfterLogin');
        } else {
          redirectUrl = getRoleBasedRedirect(data.user.role);
        }
      }
      
      // Redirect user
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'Login failed. Please try again.');
      
      // Reset submit button
      const submitButton = document.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
  }
  
  function getRoleBasedRedirect(role) {
    switch (role) {
      case 'instructor':
        return 'instructor.html';
      case 'student':
      case 'user':
      default:
        return 'student.html';
    }
  }
  
  async function enrollAfterLogin(courseId, courseTitle) {
    // Make API call to enroll
    try {
      const response = await fetch('http://localhost:3000/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ courseId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }
      
      return true;
    } catch (error) {
      console.warn('API enrollment failed, using localStorage fallback', error);
      
      // Fall back to localStorage if API call fails
      let enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses')) || [];
      
      // Check if already enrolled
      if (enrolledCourses.some(course => course.id === courseId)) {
        return true; // Already enrolled
      }
      
      // Add to enrolled courses
      enrolledCourses.push({ 
        id: courseId, 
        title: courseTitle,
        enrollDate: new Date().toISOString(),
        progress: 0
      });
      
      localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
      return true;
    }
  }
  
  function showError(message) {
    // Find or create error element
    let errorElement = document.getElementById('loginError');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = 'loginError';
      errorElement.className = 'error-message';
      
      // Insert after form
      const form = document.getElementById('loginForm');
      form.parentNode.insertBefore(errorElement, form.nextSibling);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
