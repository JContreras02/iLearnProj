// Display course cards
function displayCourses(courses) {
  const container = document.getElementById("browseCoursesContainer");
  container.innerHTML = ""; // Clear old results

  if (!Array.isArray(courses) || courses.length === 0) {
    container.innerHTML = "<p>No courses found.</p>";
    return;
  }

  // Sort by newest first (assuming created_at exists)
  courses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  courses.forEach(course => {
    const card = document.createElement("div");
    card.classList.add("course-result-card");

    card.innerHTML = `
      <img src="${course.banner_url || 'https://via.placeholder.com/600x200?text=No+Banner'}" />
      <h4>${course.title}</h4>
      <span class="course-tag">Beginner</span>
      <hr class="card-divider" />
      <p class="course-meta">Instructor: ${course.instructor_name}</p>
      <p>${course.description}</p>
      <button class="enroll-btn" onclick="enrollInCourse(${course.course_id}, '${course.title.replace(/'/g, "\\'")}')">Enroll</button>
    `;

    container.appendChild(card);
  });
}

function fetchPublishedCourses() {
  fetch("/api/courses/published", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then((res) => res.json())
    .then((courses) => {
      displayCourses(courses);
    })
    .catch((err) => {
      console.error("Error loading courses:", err);
      document.getElementById("browseCoursesContainer").innerHTML = "<p>Failed to load courses.</p>";
    });
}

// Handles switching between dashboard sections
function showSection(sectionId) {
  const sections = document.querySelectorAll('.main-content > section');
  sections.forEach(section => section.style.display = 'none');

  const target = document.getElementById(sectionId);
  if (target) target.style.display = 'block';

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-link[onclick*="${sectionId}"]`);
  if (activeLink) activeLink.classList.add('active');

  localStorage.setItem("studentActiveSection", sectionId);
}

// Handles logging out
function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "signin.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user || user.role?.toLowerCase() !== "student") {
    window.location.href = "signin.html";
    return;
  }

  // Display welcome info
  document.getElementById("welcomeMessage").textContent = `Welcome, ${user.name}!`;
  document.getElementById("userName").textContent = user.name;

  // Show current date
  const dateTime = document.getElementById("dateTime");
  if (dateTime) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateTime.textContent = `Today is ${now.toLocaleDateString(undefined, options)}`;
  }

  const lastSection = localStorage.getItem("studentActiveSection") || "dashboardSection";
  showSection(lastSection);

  if (lastSection === "browseCoursesSection") {
    fetchPublishedCourses();
  }

  document.querySelector('.nav-link[onclick*="browseCoursesSection"]')
  .addEventListener("click", fetchPublishedCourses);

  document.querySelector('.nav-link[onclick*="myCoursesSection"]')
  .addEventListener("click", fetchMyCourses);

});

function enrollInCourse(courseId, courseTitle) {
  const confirmed = confirm(`Are you sure you want to enroll in "${courseTitle}"?`);
  if (!confirmed) return;

  fetch(`/api/courses/enroll/${courseId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "Enrollment successful!") {
        alert(`✅ You are now enrolled in: ${courseTitle}`);
        fetchPublishedCourses();

        if (localStorage.getItem("studentActiveSection") === "myCoursesSection") {
          fetchMyCourses();
        }
      } else {
        alert(`⚠️ ${data.message}`);
      }
    })
    .catch((err) => {
      console.error("Enrollment failed:", err);
      alert("An error occurred during enrollment.");
    });
}

//fetch my courses
function fetchMyCourses() {
  fetch("/api/courses/student/courses", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then((res) => res.json())
    .then((courses) => {
      const container = document.getElementById("myCoursesContainer");
      container.innerHTML = "";

      if (!Array.isArray(courses) || courses.length === 0) {
        container.innerHTML = "<p>You are not enrolled in any courses yet.</p>";
        return;
      }

      courses.forEach(course => {
        const card = document.createElement("div");
        card.classList.add("course-result-card");

        card.innerHTML = `
        <img src="${course.banner_url || 'https://via.placeholder.com/600x200?text=No+Banner'}" class="course-banner" />
        <div class="unenroll-button-row">
          <button class="unenroll-small-btn" onclick="unenrollFromCourse(${course.course_id}, '${course.title.replace(/'/g, "\\'")}')">Unenroll</button>
        </div>
        <h4>${course.title}</h4>
        <span class="course-tag">Enrolled</span>
        <hr class="card-divider" />
        <p class="course-meta">Instructor: ${course.instructor_name}</p>
        <p>${course.description}</p>
        <button class="enroll-btn" onclick="loadCourseContent(${course.course_id}, '${course.title.replace(/'/g, "\\'")}')">Proceed</button>
      `;

        container.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Error loading enrolled courses:", err);
      document.getElementById("myCoursesContainer").innerHTML = "<p>Failed to load courses.</p>";
    });
}

function unenrollFromCourse(courseId, courseTitle) {
  const confirmed = confirm(`Are you sure you want to unenroll from "${courseTitle}"?`);
  if (!confirmed) return;

  fetch(`/api/courses/enroll/${courseId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      fetchMyCourses();
    })
    .catch((err) => {
      console.error("Unenroll failed:", err);
      alert("Something went wrong while trying to unenroll.");
    });
}
