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
  loadDashboardCourses();

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
      let contentData = null;

      if (type === "quiz") {
        const questions = [];
        const questionDivs = document.querySelectorAll(".quiz-question");
      
        questionDivs.forEach(qDiv => {
          const questionText = qDiv.querySelector(".question-input").value.trim();
          if (!questionText) return;
      
          const choices = [];
          const choiceDivs = qDiv.querySelectorAll(".quiz-choice");
      
          choiceDivs.forEach(cDiv => {
            const choiceText = cDiv.querySelector("input[type='text']").value.trim();
            const isCorrect = cDiv.querySelector(".correct-checkbox").checked;
            const explanation = cDiv.querySelectorAll("input[type='text']")[1].value.trim();
      
            if (choiceText) {
              choices.push({
                text: choiceText,
                isCorrect: isCorrect,
                explanation: explanation || null
              });
            }
          });
      
          if (choices.length >= 2) {
            const correctChoices = choices.filter(c => c.isCorrect);
            if (correctChoices.length !== 1) {
              throw new Error("Each question must have exactly 1 correct answer.");
            }
      
            questions.push({
              question: questionText,
              choices: choices
            });
          }
        });
      
        if (questions.length === 0) {
          showToast("Please add at least 1 complete question with choices", false);
          return;
        }
      
        contentData = JSON.stringify(questions);
      
      } else {
        contentData = document.getElementById("contentData")?.value.trim();
      }

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

    const dashboardCoursesContainer = document.getElementById("dashboardCoursesList");

    if (data.courses && data.courses.length > 0) {
      const latestCourses = data.courses.slice(0, 2); // Max 2 latest courses
      dashboardCoursesContainer.innerHTML = "";

      latestCourses.forEach(course => {
        const div = document.createElement("div");
        div.classList.add("mini-course-card");
      
        div.innerHTML = `
          <div class="mini-course-info">
            <h4>${course.title}</h4>
            <span class="status-tag ${course.status}">${course.status === 'published' ? '✅ Published' : '🔒 Draft'}</span>
          </div>
          <button class="manage-btn small-manage" onclick="manageCourse(${course.course_id}, '${course.title}', '${course.status}')">
            Manage
          </button>
        `;
      
        dashboardCoursesContainer.appendChild(div);
      });
    } else {
      dashboardCoursesContainer.innerHTML = "<p>No courses created yet.</p>";
    }
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
              : renderQuizPreview(section.content_data)
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
      <div id="quizBuilder">
        <div id="quizQuestionsContainer"></div>
      </div>
      <button type="button" onclick="addQuizQuestion()" class="signout-btn" style="margin-bottom: 1rem; background: #22c55e; color: white;">
        Add Question
      </button>
      <input type="hidden" id="contentData" />
    `;
    addQuizQuestion();
  }
}

// === Manage Button Logic ===
function manageCourse(courseId, courseTitle, courseStatus) {
  window.currentCourseId = courseId;

  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("courseManagementSection").style.display = "none";
  document.getElementById("manageCourseSection").style.display = "block";

  document.getElementById("manageCourseTitle").textContent = `Managing: ${courseTitle}`;

  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  const navLink = document.querySelector('.nav-link[onclick*="courseManagementSection"]');
  if (navLink) navLink.classList.add('active');

  const course = allCourses.find(c => c.course_id === courseId);
  if (course) {
    document.getElementById("manageCourseBanner").src = course.banner_url;
  }

  loadManageCourse(courseId);

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

// === Handle Adding New Quiz Question Dynamically ===
let quizQuestionCount = 0;

function addQuizQuestion() {
  const container = document.getElementById("quizQuestionsContainer");
  if (!container) return;

  const questionCount = container.querySelectorAll(".quiz-question").length + 1;

  const div = document.createElement("div");
  div.className = "quiz-question";
  div.innerHTML = `
    <label>Question ${questionCount}</label>
    <input type="text" class="question-input" placeholder="Enter question" required />

    <div class="quiz-choice-list">
      ${[0, 1].map(() => `
        <div class="quiz-choice">
          <input type="text" placeholder="Choice" required />
          <label><input type="checkbox" class="correct-checkbox" /> Correct</label>
          <input type="text" placeholder="Why is this incorrect? (optional)" />
          <button type="button" onclick="this.parentElement.remove()" style="margin-left: 1rem;">❌</button>
        </div>
      `).join("")}
    </div>

    <button type="button" onclick="addChoice(this)" class="signout-btn" style="margin: 0.5rem 0; background: #2563eb; color: white;">+ Add Choice</button>
    <button type="button" onclick="this.closest('.quiz-question').remove()" class="signout-btn" style="margin-left: 0.5rem; background: #dc2626; color: white;">🗑 Delete Question</button>
  `;

  container.appendChild(div);
}

// === Handle Adding New Choice Dynamically ===
function addChoice(btn) {
  const choicesDiv = btn.previousElementSibling;

  const choiceDiv = document.createElement("div");
  choiceDiv.classList.add("quiz-choice");

  choiceDiv.innerHTML = `
    <input type="text" placeholder="Choice text" required>
    <input type="checkbox" class="correct-checkbox"> Correct
    <input type="text" placeholder="Explain why wrong (optional)">
    <button type="button" onclick="deleteChoice(this)" style="background: transparent; border: none; color: #dc2626; font-size: 1.2rem; cursor: pointer;">&times;</button>
  `;

  choicesDiv.appendChild(choiceDiv);
}

function addQuizQuestion() {
  const container = document.getElementById("quizQuestionsContainer");

  const questionDiv = document.createElement("div");
  questionDiv.classList.add("quiz-question");

  questionDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <label>Question</label>
      <button type="button" onclick="deleteQuestion(this)" style="background: transparent; border: none; color: #dc2626; font-size: 1.5rem; cursor: pointer;">&times;</button>
    </div>
    <input type="text" placeholder="Enter question text" class="question-input" required>

    <div class="quiz-choices"></div>

    <button type="button" onclick="addChoice(this)" class="signout-btn" style="margin-top: 0.5rem; background: #2563eb; color: white;">
      + Add Choice
    </button>
  `;

  container.appendChild(questionDiv);
}

function addQuizChoice(btn) {
  const choiceHTML = `
    <div class="quiz-choice">
      <input type="text" class="quiz-choice-input" placeholder="New choice" required />
      <label><input type="radio" name="q${Date.now()}-correct" class="correct-answer" /> Correct</label>
      <input type="text" class="explanation" placeholder="Why is this incorrect? (Optional)" />
    </div>
  `;
  btn.previousElementSibling.insertAdjacentHTML("beforeend", choiceHTML);
}

function renderQuizPreview(contentData) {
  try {
    const parsed = JSON.parse(contentData);
    if (!Array.isArray(parsed)) return "";

    let previewHTML = `<strong>Quiz: ${parsed.length} Questions</strong>`;
    previewHTML += `<button onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.textContent = this.textContent === 'Hide Details' ? 'View Details' : 'Hide Details';" class="quiz-preview-toggle">View Details</button>`;
    previewHTML += `<div class="quiz-preview-details" style="display: none;">`;

    parsed.forEach((q, index) => {
      previewHTML += `<p><strong>Q${index + 1}:</strong> ${q.question}</p>`;
      previewHTML += `<ul>`;
      q.choices.forEach(choice => {
        previewHTML += `<li>${choice.text} ${choice.isCorrect ? "(✔)" : ""}${!choice.isCorrect && choice.explanation ? " — " + choice.explanation : ""}</li>`;
      });
      previewHTML += `</ul>`;
    });

    previewHTML += `</div>`;
    return previewHTML;
  } catch (e) {
    return "Quiz preview not available";
  }
}

function deleteQuestion(btn) {
  btn.closest(".quiz-question").remove();
}

function deleteChoice(btn) {
  btn.closest(".quiz-choice").remove();
}

function addQuizQuestion() {
  const container = document.getElementById("quizQuestionsContainer");
  if (!container) return;

  const questionCount = container.querySelectorAll(".quiz-question").length + 1;

  const div = document.createElement("div");
  div.className = "quiz-question";
  div.innerHTML = `
    <div class="question-header">
      <label>Question ${questionCount}</label>
      <button type="button" onclick="deleteQuestion(this)" class="delete-question-btn">×</button>
    </div>

    <input type="text" class="question-input" placeholder="Enter question" required />

    <div class="quiz-choices">
      ${[0, 1].map(() => `
        <div class="quiz-choice">
          <input type="text" placeholder="Choice text" required />
          <label><input type="checkbox" class="correct-checkbox" /> Correct</label>
          <input type="text" placeholder="Why is this incorrect? (optional)" />
          <button type="button" onclick="deleteChoice(this)" class="delete-choice-btn">×</button>
        </div>
      `).join("")}
    </div>

    <div class="quiz-buttons">
      <button type="button" onclick="addChoice(this)" class="signout-btn add-choice-btn">+ Add Choice</button>
    </div>
  `;

  container.appendChild(div);
}

function addChoice(btn) {
  const choicesDiv = btn.closest(".quiz-question").querySelector(".quiz-choices");

  const choiceDiv = document.createElement("div");
  choiceDiv.classList.add("quiz-choice");

  choiceDiv.innerHTML = `
    <input type="text" placeholder="Choice text" required />
    <label><input type="checkbox" class="correct-checkbox" /> Correct</label>
    <input type="text" placeholder="Why is this incorrect? (optional)" />
    <button type="button" onclick="deleteChoice(this)" class="delete-choice-btn">×</button>
  `;

  choicesDiv.appendChild(choiceDiv);
}

async function loadDashboardCourses() {
  const token = localStorage.getItem("token");
  const container = document.getElementById("dashboardCoursesList");

  try {
    const res = await fetch("/api/courses/mine", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) throw new Error("Failed to load courses");

    container.innerHTML = "";

    if (data.length === 0) {
      container.innerHTML = "<p>You haven't created any courses yet.</p>";
      return;
    }

    // Show max 2 latest courses
    const latestCourses = data.slice(0, 2);

    latestCourses.forEach(course => {
      const div = document.createElement("div");
      div.classList.add("dashboard-course-item");

      div.innerHTML = `
        <div class="dashboard-course-info">
          <h4>${course.title}</h4>
          <button class="manage-btn" onclick="manageCourse(${course.course_id}, '${course.title}', '${course.status}')">
            Manage Course
          </button>
        </div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error loading dashboard courses:", err);
    container.innerHTML = "<p>Error loading courses.</p>";
  }
}