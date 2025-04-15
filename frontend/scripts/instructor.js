document.addEventListener("DOMContentLoaded", () => {
  let allCourses = [];
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user || user.role?.toLowerCase() !== "instructor") {
    window.location.href = "signin.html";
    return;
  }

  document.getElementById("welcomeMessage").textContent = `Welcome, ${user.name}!`;
  document.getElementById("userName").textContent = user.name;

  const dateTime = document.getElementById("dateTime");
  if (dateTime) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateTime.textContent = `Today is ${now.toLocaleDateString(undefined, options)}`;
  }

  loadDashboardData(token);
  loadMyCourses();

  const form = document.getElementById("createCourseForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("title").value.trim();
      const banner = document.getElementById("banner").files[0];
      const description = document.getElementById("description").value.trim();

      if (!title || !banner || !description) {
        showToast("All fields are required!", false);
        return;
      }

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
          loadMyCourses();
        } else {
          showToast(data.error || "Failed to create course.", false);
        }
      } catch (err) {
        console.error(err);
        showToast("Server error while creating course.", false);
      }
    });
  }

  // === Add Section Form Submission ===
  const addSectionForm = document.getElementById("addSectionForm");

  if (addSectionForm) {
    addSectionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("sectionTitle").value.trim();
      const type = document.getElementById("contentType").value;
      const contentData = document.getElementById("contentData")?.value.trim();

      if (!title || !type) {
        showToast("All fields are required", false);
        return;
      }

      if (type === "video" && (!contentData || !contentData.includes("youtube.com"))) {
        showToast("Only YouTube links allowed for video", false);
        return;
      }

      if (type === "reading" && !contentData) {
        showToast("Reading content cannot be empty", false);
        return;
      }

      const res = await fetch(`/api/courses/${window.currentCourseId}/sections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content_type: type,
          content_data: contentData || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Section added successfully!", true);
        addSectionForm.reset();
        document.getElementById("dynamicContentInput").innerHTML = "";
        loadManageCourse(window.currentCourseId);
      } else {
        showToast(data.error || "Failed to add section", false);
      }
    });
  }

  const lastSection = localStorage.getItem("activeSection") || "dashboardSection";
  showSection(lastSection);
});

// === Load Dashboard Stats ===
async function loadDashboardData(token) {
  try {
    const res = await fetch("/api/instructor/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error("Failed to load dashboard");

    document.getElementById("totalCourses").textContent = `You have ${data.totalCourses} courses`;
    document.getElementById("topCourse").textContent = `Top Course: ${data.topCourse}`;
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

// === Load My Courses to Left Side ===
async function loadMyCourses() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("myCoursesList");

  try {
    const res = await fetch("/api/courses/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    allCourses = data;

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
              <button class="manage-btn" onclick="manageCourse(${course.course_id}, '${course.title}', '${course.status}')">Manage Course</button>
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

// === Load Sections in Manage View ===
async function loadManageCourse(courseId) {
  const token = localStorage.getItem("token");
  const container = document.getElementById("existingSectionsList");

  container.innerHTML = "<p>Loading sections...</p>";

  try {
    const res = await fetch(`/api/courses/${courseId}/sections`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const sections = await res.json();

    if (!res.ok) throw new Error("Failed to fetch sections");

    if (sections.length === 0) {
      container.innerHTML = "<p>No sections yet. Start adding content!</p>";
      return;
    }

    container.innerHTML = "";

    sections.forEach((section, index) => {
      const div = document.createElement("div");
      div.classList.add("section-card");

      div.innerHTML = `
        <h4>Section ${index + 1}: ${section.title}</h4>
        <div class="section-type">Type: ${section.content_type}</div>
        <div class="section-preview">
          ${
            section.content_type === "video"
              ? `Video Link: ${section.content_data}`
              : section.content_type === "reading"
              ? `Reading: ${section.content_data}`
              : "Quiz Section"
          }
        </div>
        <button class="delete-btn" onclick="deleteSection(${section.section_id})">Delete Section</button>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading sections:", err);
    container.innerHTML = "<p>Error loading sections.</p>";
  }
}

// === Dynamic Section Type Input Switching ===
function handleContentTypeChange() {
  const type = document.getElementById("contentType").value;
  const dynamicDiv = document.getElementById("dynamicContentInput");

  dynamicDiv.innerHTML = "";

  if (type === "video") {
    dynamicDiv.innerHTML = `
      <label>Video URL (YouTube Only)</label>
      <input type="url" id="contentData" placeholder="https://youtube.com/..." required />
    `;
  } else if (type === "reading") {
    dynamicDiv.innerHTML = `
      <label>Reading Content / Link</label>
      <textarea id="contentData" rows="5" placeholder="Type your content or link here" required></textarea>
    `;
  } else if (type === "quiz") {
    dynamicDiv.innerHTML = `
      <p>Quiz Builder coming soon...</p>
    `;
  }
}

// === Manage Button Logic ===
function manageCourse(courseId, courseTitle, courseStatus) {
  window.currentCourseId = courseId;

  document.getElementById("manageCourseSection").style.display = "block";
  document.getElementById("courseManagementSection").style.display = "none";
  document.getElementById("manageCourseTitle").textContent = `Managing: ${courseTitle}`;

  const course = allCourses.find(c => c.course_id === courseId);
  if (course) {
    document.getElementById("manageCourseBanner").src = course.banner_url;
  }

  loadManageCourse(courseId);

  // Set status badge + button
  const badge = document.getElementById("courseStatusBadge");
  const toggleBtn = document.getElementById("toggleStatusBtn");

  badge.textContent = courseStatus === "published" ? "Published ✅" : "Draft 🔒";
  badge.className = courseStatus === "published" ? "status-badge published" : "status-badge draft";

  toggleBtn.textContent = courseStatus === "published" ? "Unpublish Course" : "Publish Course";
  toggleBtn.onclick = () => toggleCourseStatus(courseId, courseStatus);
}

// === Status Toggle (used later) ===
function toggleCourseStatus(courseId, currentStatus) {
  console.log("Toggling status soon...");
}

// === Sign Out ===
function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "signin.html";
}

// === Toast Reusable ===
function showToast(message, success = true) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.backgroundColor = success ? "#16a34a" : "#dc2626";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// === Navigation ===
function showSection(sectionId) {
  const sections = document.querySelectorAll(".main-content > section");
  sections.forEach(section => section.style.display = "none");

  const active = document.getElementById(sectionId);
  if (active) active.style.display = "block";

  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  const navLinks = document.querySelectorAll(`.nav-link[onclick*="${sectionId}"]`);
  if (navLinks.length) navLinks[0].classList.add("active");

  localStorage.setItem("activeSection", sectionId);
}

// Delete Section Handler
async function deleteSection(sectionId) {
  const confirmDelete = confirm("Are you sure you want to delete this section?");

  if (!confirmDelete) return;

  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/sections/${sectionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Section deleted successfully!", true);
      loadManageCourse(window.currentCourseId); // Reload sections
    } else {
      showToast(data.error || "Failed to delete section", false);
    }
  } catch (err) {
    console.error(err);
    showToast("Server error while deleting section", false);
  }
}

async function toggleCourseStatus(courseId, currentStatus) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/courses/${courseId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: currentStatus === "published" ? "draft" : "published" })
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Course status updated!", true);
      loadMyCourses();
      loadManageCourse(courseId); 
    } else {
      showToast(data.error || "Failed to update status", false);
    }

  } catch (err) {
    console.error(err);
    showToast("Error updating status", false);
  }
}
