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

function searchCourses(query) {
  fetch("/api/courses/published", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then((res) => res.json())
    .then((courses) => {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase())
      );
      displayCourses(filtered);
    })
    .catch((err) => {
      console.error("Search failed:", err);
      document.getElementById("browseCoursesContainer").innerHTML = "<p>Search failed.</p>";
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

  document.getElementById("welcomeMessage").textContent = `Welcome, ${user.name}!`;
  document.getElementById("userName").textContent = user.name;

  const dateTime = document.getElementById("dateTime");
  if (dateTime) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateTime.textContent = `Today is ${now.toLocaleDateString(undefined, options)}`;
  }

  const lastSection = localStorage.getItem("studentActiveSection") || "dashboardSection";
  showSection(lastSection);

  if (lastSection === "courseContentSection") {
    const storedCourseId = localStorage.getItem("currentCourseId");
    const storedCourseTitle = localStorage.getItem("currentCourseTitle");

    if (storedCourseId && storedCourseTitle) {
      loadCourseContent(storedCourseId, storedCourseTitle);
    } else {
      showSection("dashboardSection");
    }
  }

  if (lastSection === "browseCoursesSection") {
    fetchPublishedCourses();
  }

  document.querySelector('.nav-link[onclick*="browseCoursesSection"]')
    .addEventListener("click", fetchPublishedCourses);

  document.querySelector('.nav-link[onclick*="myCoursesSection"]')
    .addEventListener("click", fetchMyCourses);

  document.querySelector('.nav-link[onclick*="notificationsSection"]')
    .addEventListener("click", fetchStudentNotifications);

  // ✅ Add search button + Enter key functionality here
  document.getElementById("searchBtn").addEventListener("click", () => {
    const query = document.getElementById("searchInput").value.trim();
    searchCourses(query);
  });

  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("searchBtn").click();
    }
  });
});

function searchCourses(query) {
  fetch("/api/courses/published", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.json())
    .then(courses => {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.description.toLowerCase().includes(query.toLowerCase())
      );
      displayCourses(filtered);
    })
    .catch(err => {
      console.error("Search failed:", err);
      document.getElementById("browseCoursesContainer").innerHTML = "<p>Failed to search courses.</p>";
    });
}

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
<button class="enroll-btn" onclick="handleCourseProceed(${course.course_id}, '${course.title.replace(/'/g, "\\'")}')">Proceed</button>      `;

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

// notifications
function fetchStudentNotifications() {
  fetch("/api/courses/notifications", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then((res) => res.json())
    .then((notifications) => {
      const container = document.getElementById("notificationsContainer");
      container.innerHTML = "";

      if (!Array.isArray(notifications) || notifications.length === 0) {
        container.innerHTML = "<p>No notifications yet.</p>";
        return;
      }

      notifications.forEach(note => {
        const div = document.createElement("div");
        div.classList.add("notification-card");
        if (!note.is_read) div.classList.add("unread");

        div.setAttribute("onclick", `markNotificationAsRead(${note.notification_id})`);

        div.innerHTML = `
          <p>${note.message}</p>
          <span class="notif-time">${new Date(note.created_at).toLocaleString()}</span>
          <button class="notif-dismiss" onclick="deleteNotification(${note.notification_id})">×</button>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error("Failed to load notifications:", err);
      document.getElementById("notificationsContainer").innerHTML = "<p>Error loading notifications.</p>";
    });
}

function deleteNotification(notificationId) {
  fetch(`/api/courses/notifications/${notificationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.json())
    .then(() => {
      fetchStudentNotifications(); // refresh the list
    })
    .catch(err => {
      console.error("Failed to delete notification:", err);
    });
}

function markNotificationAsRead(notificationId) {
  fetch(`/api/courses/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.json())
    .then(() => {
      fetchStudentNotifications();
    })
    .catch(err => {
      console.error("Failed to mark as read:", err);
    });
}

function loadCourseContent(courseId, courseTitle) {
  showSection("courseContentSection");
  document.getElementById("courseContentTitle").textContent = courseTitle;
  const container = document.getElementById("courseSectionsContainer");
  container.innerHTML = "<p>Loading...</p>";

  fetch(`/api/courses/${courseId}/sections`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.json())
    .then(sections => {
      if (!Array.isArray(sections) || sections.length === 0) {
        container.innerHTML = "<p>No sections available for this course yet.</p>";
        return;
      }

      container.innerHTML = "";
      let currentIndex = 0;

      function renderSection(index) {
        const section = sections[index];
        const sectionDiv = document.createElement("div");
        sectionDiv.classList.add("section-card");

        let contentHTML = `<h3>Section ${index + 1}: ${section.title}</h3>`;

        if (section.content_type === "video") {
          let embedUrl = section.content_data;
          if (embedUrl.includes("watch?v=")) {
            embedUrl = embedUrl.replace("watch?v=", "embed/");
          }
          contentHTML += `
            <div class="video-wrapper">
              <iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>
            </div>
          `;
        } else if (section.content_type === "reading") {
          contentHTML += `<div class="reading-content">${section.content_data}</div>`;
        } else if (section.content_type === "quiz") {
          let questions = [];
          try {
            questions = JSON.parse(section.content_data);
            contentHTML += `<form class="quiz-content">`;

            questions.forEach((q, qi) => {
              contentHTML += `<div class="quiz-question-block">
                <p><strong>Q${qi + 1}:</strong> ${q.question}</p>`;

              q.choices.forEach((choice, ci) => {
                contentHTML += `
                  <label>
                    <input type="radio" name="q${qi}" value="${ci}" />
                    ${choice.text}
                  </label><br />
                `;
              });

              contentHTML += `<div class="quiz-feedback" id="feedback-${qi}"></div>`;
              contentHTML += `</div><br />`;
            });

            contentHTML += `<button type="submit" class="quiz-submit-btn">Submit Quiz</button>`;
            contentHTML += `</form>`;
          } catch (err) {
            contentHTML += `<p>[Invalid Quiz Format]</p>`;
          }

          sectionDiv.innerHTML = contentHTML;
          container.appendChild(sectionDiv);

          const quizForm = sectionDiv.querySelector("form.quiz-content");
          if (quizForm) {
            quizForm.addEventListener("submit", (e) => {
              e.preventDefault();

              let allCorrect = true;

              questions.forEach((q, qi) => {
                const selected = quizForm.querySelector(`input[name="q${qi}"]:checked`);
                const feedback = sectionDiv.querySelector(`#feedback-${qi}`);

                if (!selected) {
                  allCorrect = false;
                  feedback.innerHTML = `<span style="color: #dc2626;">Please answer this question.</span>`;
                  return;
                }

                const selectedIndex = parseInt(selected.value);
                const selectedChoice = q.choices[selectedIndex];

                if (selectedChoice.isCorrect) {
                  feedback.innerHTML = `<span style="color: #16a34a;">✅ Correct!</span>`;
                } else {
                  allCorrect = false;
                  feedback.innerHTML = `<span style="color: #dc2626;">❌ Incorrect. ${selectedChoice.explanation || "Try again."}</span>`;
                }
              });

              if (allCorrect) {
                quizForm.querySelectorAll("input").forEach(input => input.disabled = true);
                const submitBtn = quizForm.querySelector("button[type='submit']");
                submitBtn.disabled = true;
                submitBtn.textContent = "✅ All Correct!";

                // Clear existing retry button if present
                const existingRetry = sectionDiv.querySelector(".retry-quiz-btn");
                if (existingRetry) existingRetry.remove();

                const retryBtn = document.createElement("button");
                retryBtn.textContent = "🔁 Retry Quiz";
                retryBtn.classList.add("retry-quiz-btn");
                retryBtn.addEventListener("click", () => {
                  sectionDiv.innerHTML = ""; // clear inside the same card
                  renderQuizContent(section, sectionDiv, index); // re-render quiz inside same card
                });
                quizForm.appendChild(retryBtn);

                // 👉 Automatically show the next section (without removing this one)
                if (index < sections.length - 1) {
                  renderSection(index + 1); // render the next section below
                }
              }
            });
          }

          return;
        }

        // For video/reading types: Add navigation buttons
        contentHTML += `
          <div class="btn-group">
            ${index > 0 ? `<button class="back-btn">⬅ Back</button>` : ""}
            ${index < sections.length - 1 ? `<button class="done-btn">Next</button>` : `<button class="done-btn" disabled>Completed</button>`}
          </div>
        `;

        sectionDiv.innerHTML = contentHTML;
        container.appendChild(sectionDiv);

        const doneBtn = sectionDiv.querySelector(".done-btn");
        if (doneBtn && index < sections.length - 1) {
          doneBtn.addEventListener("click", () => {
            renderSection(index + 1);
          });
        }

        const backBtn = sectionDiv.querySelector(".back-btn");
        if (backBtn) {
          backBtn.addEventListener("click", () => {
            const cards = container.querySelectorAll(".section-card");
            if (cards.length > 1) cards[cards.length - 1].remove();
          });
        }
      }

      // Helper to re-render a quiz without making a new card
      function renderQuizContent(section, sectionDiv, index) {
        let questions = [];
        try {
          questions = JSON.parse(section.content_data);
          let contentHTML = `<h3>Section ${index + 1}: ${section.title}</h3>`;
          contentHTML += `<form class="quiz-content">`;

          questions.forEach((q, qi) => {
            contentHTML += `<div class="quiz-question-block">
              <p><strong>Q${qi + 1}:</strong> ${q.question}</p>`;

            q.choices.forEach((choice, ci) => {
              contentHTML += `
                <label>
                  <input type="radio" name="q${qi}" value="${ci}" />
                  ${choice.text}
                </label><br />
              `;
            });

            contentHTML += `<div class="quiz-feedback" id="feedback-${qi}"></div>`;
            contentHTML += `</div><br />`;
          });

          contentHTML += `<button type="submit" class="quiz-submit-btn">Submit Quiz</button>`;
          contentHTML += `</form>`;
          sectionDiv.innerHTML = contentHTML;

          const quizForm = sectionDiv.querySelector("form.quiz-content");
          quizForm.addEventListener("submit", (e) => {
            e.preventDefault();

            let allCorrect = true;

            questions.forEach((q, qi) => {
              const selected = quizForm.querySelector(`input[name="q${qi}"]:checked`);
              const feedback = sectionDiv.querySelector(`#feedback-${qi}`);

              if (!selected) {
                allCorrect = false;
                feedback.innerHTML = `<span style="color: #dc2626;">Please answer this question.</span>`;
                return;
              }

              const selectedIndex = parseInt(selected.value);
              const selectedChoice = q.choices[selectedIndex];

              if (selectedChoice.isCorrect) {
                feedback.innerHTML = `<span style="color: #16a34a;">✅ Correct!</span>`;
              } else {
                allCorrect = false;
                feedback.innerHTML = `<span style="color: #dc2626;">❌ Incorrect. ${selectedChoice.explanation || "Try again."}</span>`;
              }
            });

            if (allCorrect) {
              quizForm.querySelectorAll("input").forEach(input => input.disabled = true);
              const submitBtn = quizForm.querySelector("button[type='submit']");
              submitBtn.disabled = true;
              submitBtn.textContent = "✅ All Correct!";

              const existingRetry = sectionDiv.querySelector(".retry-quiz-btn");
              if (existingRetry) existingRetry.remove();

              const retryBtn = document.createElement("button");
              retryBtn.textContent = "🔁 Retry Quiz";
              retryBtn.classList.add("retry-quiz-btn");
              retryBtn.addEventListener("click", () => {
                sectionDiv.innerHTML = "";
                renderQuizContent(section, sectionDiv, index);
              });
              quizForm.appendChild(retryBtn);

              if (index < sections.length - 1) {
                renderSection(index + 1);
              }
            }
          });
        } catch (err) {
          sectionDiv.innerHTML = `<p>[Invalid Quiz Format]</p>`;
        }
      }

      renderSection(currentIndex);
    })
    .catch(err => {
      console.error("Failed to load course sections:", err);
      container.innerHTML = "<p>Something went wrong while loading this course.</p>";
    });
}

function handleCourseProceed(courseId, courseTitle) {
  localStorage.setItem("studentActiveSection", "courseContentSection");
  localStorage.setItem("currentCourseId", courseId);
  localStorage.setItem("currentCourseTitle", courseTitle);
  loadCourseContent(courseId, courseTitle);
}
