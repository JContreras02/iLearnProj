document.addEventListener('DOMContentLoaded', () => {
    // Handle Signup
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const name = document.getElementById('name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const role = document.querySelector('input[name="role"]:checked').value;
  
        if (password !== confirmPassword) {
          document.getElementById('confirmPasswordError').textContent = "Passwords do not match";
          return;
        }
  
        const response = await fetch('http://localhost:3000/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role })
        });
  
        const data = await response.json();
        document.getElementById('message').textContent = data.message || data.error;
  
        if (response.ok) {
          signupForm.reset();
          setTimeout(() => window.location.href = 'signin.html', 1500);
        }
      });
    }
  
    // Handle Signin
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
  
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
  
        const response = await fetch('http://localhost:3000/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
  
        const data = await response.json();
        document.getElementById('message').textContent = data.message || data.error;
  
        if (response.ok) {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', data.token);
          setTimeout(() => {
            // Redirect based on role
            if (data.user.role === 'instructor') {
              window.location.href = 'instructor.html';
            } else {
              window.location.href = 'student.html';
            }
          }, 1500);
        }
      });
    }
  });
  