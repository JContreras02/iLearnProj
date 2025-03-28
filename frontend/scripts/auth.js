// Signup Form Submission
document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form values
  const name = document.getElementById("name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const role = document.querySelector('input[name="role"]:checked').value;

  // Clear previous error messages
  clearErrors();

  // Basic validation
  if (password !== confirmPassword) {
    showError("confirmPasswordError", "Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showError("passwordError", "Password must be at least 6 characters");
    return;
  }

  try {
    // Send data to the backend
    const response = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    // Handle backend response
    if (!response.ok) {
      throw new Error(data.error || "Signup failed");
    }

    // Display success message
    showMessage("Signup successful! Redirecting to login...", "success");

    // Redirect to signin.html after 2 seconds
    setTimeout(() => {
      window.location.href = "signin.html";
    }, 2000);
  } catch (error) {
    console.error("Error:", error);
    showMessage(error.message, "error");
  }
});

// Login Form Submission
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Store the token in localStorage
    localStorage.setItem("token", data.token);
    console.log("Token stored:", data.token);
    console.log("User role:", data.user.role);
  

    // Redirect based on role
    if (data.user.role === "student") {
      window.location.href = "student.html";
    } else if (data.user.role === "instructor") {
      window.location.href = "instructor.html";
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage(error.message, "error");
  }
});

// Helper function to display error messages
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Helper function to clear all error messages
function clearErrors() {
  const errorElements = document.getElementsByClassName("error-message");
  Array.from(errorElements).forEach((element) => {
    element.style.display = "none";
    element.textContent = "";
  });
}

// Helper function to display success/error messages
function showMessage(message, type) {
  const messageElement = document.getElementById("message");
  messageElement.textContent = message;
  messageElement.className = `message ${type}`; // Add CSS class for styling
}
