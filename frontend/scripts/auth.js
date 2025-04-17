document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  
  // Function to display messages
  function showMessage(text, isSuccess) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.className = 'message'; // Reset classes
      messageEl.classList.add(isSuccess ? 'success' : 'error');
    }
  }

  // Handle Signup Form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    console.log('Signup form found, adding event listener');
    
    signupForm.addEventListener('submit', function(e) {
      console.log('Signup form submitted');
      
      // Always prevent the default form submission
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      const roleInput = document.querySelector('input[name="role"]:checked');
      const role = roleInput ? roleInput.value : 'student';
      
      console.log('Form data collected:', { name, email, role });
      
      // Validate passwords match
      if (password !== confirmPassword) {
        const confirmPasswordError = document.getElementById('confirmPasswordError');
        if (confirmPasswordError) {
          confirmPasswordError.textContent = "Passwords do not match";
          confirmPasswordError.style.display = 'block';
        } else {
          showMessage("Passwords do not match", false);
        }
        return;
      }
      
      // Log the actual data being sent to the server
      const requestData = { name, email, password, role };
      console.log('Sending to server:', requestData);
      
      // Send the data to the server using fetch API
      fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers].map(h => h.join(': ')).join('\n'));
        return response.json();
      })
      .then(data => {
        console.log('Server response data:', data);
        
        if (data.message) {
          // Success case
          showMessage(data.message, true);
          signupForm.reset();
          
          // Redirect to signin page after 1.5 seconds
          setTimeout(() => {
            window.location.href = 'signin.html';
          }, 1500);
        } else if (data.error) {
          // Error case
          showMessage(data.error, false);
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        showMessage("Server error. Please try again later.", false);
      });
    });
  }

  // Handle Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    console.log('Login form found, adding event listener');
    
    loginForm.addEventListener('submit', function(e) {
      console.log('Login form submitted');
      
      // Always prevent the default form submission
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      console.log('Login data collected:', { email });
      
      // Send the data to the server using fetch API
      fetch('http://localhost:3000/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => {
        console.log('Response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Server response data:', data);
        
        if (data.message) {
          // Success case
          showMessage(data.message, true);
          
          // Store user data and token in localStorage
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', data.token);
          
          // Redirect based on role after 1.5 seconds
          setTimeout(() => {
            if (data.user.role === 'instructor') {
              window.location.href = 'instructor.html';
            } else {
              window.location.href = 'student.html';
            }
          }, 1500);
        } else if (data.error) {
          // Error case
          showMessage(data.error, false);
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        showMessage("Server error. Please try again later.", false);
      });
    });
  }
});
