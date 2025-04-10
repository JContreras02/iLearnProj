document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Redirect if not logged in or not instructor
  if (!token || !user || (user.role && user.role.toLowerCase() !== "instructor")) {
    window.location.href = "signin.html";
    return;
  }

  // Display Welcome Message & Name
  document.getElementById("welcomeMessage").textContent = `Welcome, ${user.name}!`;
  document.getElementById("userName").textContent = user.name;

  // Display Date
  const dateTime = document.getElementById("dateTime");
  if (dateTime) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = now.toLocaleDateString(undefined, options);
    dateTime.textContent = `Today is ${date}`;
  }

  loadDashboardData(token);
  loadMyCourses();

  const form = document.getElementById("createCourseForm");

  // Handle Course Creation Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Get form inputs
      const title = document.getElementById("title").value.trim();
      const banner = document.getElementById("banner").files[0];
      const description = document.getElementById("description").value.trim();

      // Check if any field is empty
      if (!title || !banner || !description) {
        showToast("All fields are required!", false);
        return;
      }

      // Limit file size (5MB max)
      if (banner.size > 5 * 1024 * 1024) {
        showToast("Image too large! Max 5MB", false);
        return;
      }

      const formData = new FormData(form);

      try {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();

        if (res.ok) {
          showToast("Course created successfully!", true);
          form.reset();
          loadMyCourses(); // Refresh left side
        } else {
          showToast(data.error || "Failed to create course.", false);
        }
      } catch (err) {
        console.error(err);
        showToast("Server error while creating course.", false);
      }
    });
  }
});

// Load Dashboard Stats
async function loadDashboardData(token) {
  try {
    const res = await fetch("/api/instructor/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to load dashboard data");

    const data = await res.json();

    document.getElementById("totalCourses").textContent = `You have ${data.totalCourses} courses`;
    document.getElementById("topCourse").textContent = `Top Course: ${data.topCourse}`;
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

// Load My Courses
async function loadMyCourses() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("myCoursesList");

  try {
    const res = await fetch("/api/courses/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok && data.length > 0) {
      container.innerHTML = "";

      data.forEach(course => {
        const div = document.createElement("div");
        div.innerHTML = `
          <div class="course-card">
            <img src="${course.banner_url}" class="course-banner" />
            <div class="course-card-content">
              <h4>${course.title}</h4>
              <p>${course.description}</p>
              <button class="manage-btn" onclick="manageCourse(${course.course_id})">Manage Course</button>
            </div>
          </div>
        `;
        container.appendChild(div);
      });
    } else {
      container.innerHTML = "<p>You haven't created any courses yet.</p>";
    }
  } catch (err) {
    console.error("Error loading courses:", err);
    container.innerHTML = "<p>Error loading courses.</p>";
  }
}

// Navigate to Manage Course Page
function manageCourse(courseId) {
  window.location.href = `manage-course.html?id=${courseId}`;
}

// Sign Out Logic
function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "signin.html";
}

// Section Switching Logic
function showSection(sectionId) {
  const sections = document.querySelectorAll('.main-content > section');
  sections.forEach(section => section.style.display = 'none');

  const active = document.getElementById(sectionId);
  if (active) active.style.display = 'block';

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const navLinks = document.querySelectorAll(`.nav-link[onclick*="${sectionId}"]`);
  if (navLinks.length) navLinks[0].classList.add('active');
}

// Toast Alert Logic
function showToast(message, success = true) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.backgroundColor = success ? "#16a34a" : "#dc2626"; // green or red
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
