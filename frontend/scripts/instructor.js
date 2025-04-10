document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Redirect if not logged in or not an instructor
  if (!token || !user || (user.role && user.role.toLowerCase() !== "instructor")) {
    window.location.href = "signin.html";
    return;
  }

  // Set welcome message
  document.getElementById("welcomeMessage").textContent = `Welcome, ${user.name}!`;

  // Set sidebar name
  document.getElementById("userName").textContent = user.name;

  // Set today's date
  const dateTime = document.getElementById("dateTime");
  if (dateTime) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = now.toLocaleDateString(undefined, options);
    dateTime.textContent = `Today is ${date}`;
  }

  // Load dashboard content
  loadDashboardData(token);
});

// Load dashboard stats
async function loadDashboardData(token) {
  try {
    const res = await fetch("/api/instructor/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed to load dashboard data");

    const data = await res.json();

    document.getElementById("totalCourses").textContent = `You have ${data.totalCourses} courses`;
    document.getElementById("topCourse").textContent = `Top Course: ${data.topCourse}`;
    document.getElementById("totalStudents").textContent = `${data.totalStudents} students enrolled`;
    document.getElementById("recentEnrollment").textContent = `Recent: ${data.recentEnrollment}`;

    const notificationsList = document.getElementById("notificationsList");
    notificationsList.innerHTML = data.notifications.map(note => `<li>${note}</li>`).join('');
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

// Handle sign out
function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "signin.html";
}

// Show section logic (moved from HTML)
function showSection(sectionId) {
  const sections = document.querySelectorAll('.main-content > section');
  sections.forEach(section => {
    section.style.display = 'none';
  });

  const active = document.getElementById(sectionId);
  if (active) {
    active.style.display = 'block';
  }

  // Set active class in sidebar
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const navLinks = document.querySelectorAll(`.nav-link[onclick*="${sectionId}"]`);
  if (navLinks.length) {
    navLinks[0].classList.add('active');
  }
}
