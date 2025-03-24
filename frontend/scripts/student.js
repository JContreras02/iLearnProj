// Modified verifyToken function that doesn't rely on jwt.decode
function verifyToken() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting to login...");
      window.location.href = "signin.html";
      return false;
    }
    return true;
  }
  
  // Update Dashboard Section
  async function updateDashboard(userData) {
      // Welcome message
      document.getElementById('welcomeMessage').textContent = `Welcome back, ${userData.name}! 👋`;
      
      // Update user profile info in sidebar
      document.getElementById('userName').textContent = userData.name;
      document.getElementById('userEmail').textContent = userData.email;
  
      // Stats
      const stats = calculateUserStats(userData);
      updateStats(stats);
  
      // Course Progress
      if (userData.courses) {
          updateCourseProgress(userData.courses);
      }
  
      // Deadlines
      if (userData.assignments) {
          updateDeadlines(userData.assignments);
      }
  
      // Recent Activity
      if (userData.activities) {
          updateRecentActivity(userData.activities || []);
      }
  
      // Learning Streak
      updateLearningStreak(userData.streak || { count: 0, days: [] });
  }
  
  // Added function to update course progress in dashboard
  function updateCourseProgress(courses) {
      const courseProgressList = document.getElementById('courseProgressList');
      courseProgressList.innerHTML = '';
  
      if (!courses || Object.keys(courses).length === 0) {
          courseProgressList.innerHTML = '<div class="empty-state">No active courses</div>';
          return;
      }
  
      Object.entries(courses).forEach(([courseId, course]) => {
          if (course.status === 'active' || course.status === 'in-progress') {
              const courseElement = document.createElement('div');
              courseElement.className = 'course-progress-item';
              courseElement.innerHTML = `
                  <div class="progress-info">
                      <h3>${course.name}</h3>
                      <span>${course.progress}% Complete</span>
                  </div>
                  <div class="progress-bar">
                      <div class="progress-fill" style="width: ${course.progress}%"></div>
                  </div>
              `;
              courseProgressList.appendChild(courseElement);
          }
      });
  }
  
  // Added function to update deadlines
  function updateDeadlines(assignments) {
      const deadlineList = document.getElementById('deadlineList');
      deadlineList.innerHTML = '';
  
      if (!assignments || Object.keys(assignments).length === 0) {
          deadlineList.innerHTML = '<div class="empty-state">No upcoming deadlines</div>';
          return;
      }
  
      // Filter and sort assignments by due date
      const upcomingAssignments = Object.values(assignments)
          .filter(assignment => assignment.status === 'pending')
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5); // Show only 5 upcoming assignments
  
      upcomingAssignments.forEach(assignment => {
          const deadlineElement = document.createElement('div');
          deadlineElement.className = 'deadline-item';
          deadlineElement.innerHTML = `
              <div class="deadline-info">
                  <h3>${assignment.title}</h3>
                  <p>Due: ${formatDate(assignment.dueDate)}</p>
              </div>
              <div class="deadline-status">
                  <span class="deadline-badge ${getDeadlineClass(assignment.dueDate)}">
                      ${getDeadlineText(assignment.dueDate)}
                  </span>
              </div>
          `;
          deadlineList.appendChild(deadlineElement);
      });
  }
  
  // Added function to update recent activity
  function updateRecentActivity(activities) {
      const activityList = document.getElementById('activityList');
      activityList.innerHTML = '';
  
      if (!activities || activities.length === 0) {
          activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
          return;
      }
  
      activities.forEach(activity => {
          const activityElement = document.createElement('div');
          activityElement.className = 'activity-item';
          activityElement.innerHTML = `
              <div class="activity-icon ${activity.type}"></div>
              <div class="activity-info">
                  <p>${activity.description}</p>
                  <span>${formatTimeAgo(activity.timestamp)}</span>
              </div>
          `;
          activityList.appendChild(activityElement);
      });
  }
  
  // Added function to update learning streak
  function updateLearningStreak(streak) {
      const streakCount = document.getElementById('streakCount');
      const streakCalendar = document.getElementById('streakCalendar');
      const streakMessage = document.getElementById('streakMessage');
  
      // Update streak count
      streakCount.textContent = `${streak.count} days`;
  
      // Clear streak calendar
      streakCalendar.innerHTML = '';
  
      // Create streak calendar (last 7 days)
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          const dateStr = date.toISOString().split('T')[0];
          const isActive = streak.days && streak.days.includes(dateStr);
          
          const dayElement = document.createElement('div');
          dayElement.className = `streak-day ${isActive ? 'active' : ''}`;
          dayElement.innerHTML = `
              <span class="day-label">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <div class="day-marker"></div>
              <span class="day-number">${date.getDate()}</span>
          `;
          streakCalendar.appendChild(dayElement);
      }
  
      // Update streak message
      if (streak.count > 0) {
          streakMessage.textContent = `Great job! Keep learning daily to maintain your streak.`;
      } else {
          streakMessage.textContent = `Start your learning streak by completing a lesson today!`;
      }
  }
  
  // Update Courses Section
  function updateCourses(courses) {
      const courseGrid = document.getElementById('courseGrid');
      courseGrid.innerHTML = '';
  
      if (!courses || Object.keys(courses).length === 0) {
          courseGrid.innerHTML = '<div class="empty-state">No courses enrolled yet</div>';
          return;
      }
  
      Object.entries(courses).forEach(([courseId, course]) => {
          const courseElement = document.createElement('div');
          courseElement.className = 'course-card';
          courseElement.innerHTML = `
              <div class="course-header">
                  <img src="${course.imageUrl || '/api/placeholder/400/200'}" alt="${course.name}" class="course-image">
                  <span class="course-status ${course.status}">${course.status}</span>
              </div>
              <div class="course-content">
                  <h3 class="course-title">${course.name}</h3>
                  <p class="course-instructor">By ${course.instructor || 'Instructor'}</p>
                  <div class="progress-bar">
                      <div class="progress-fill" style="width: ${course.progress}%"></div>
                  </div>
                  <div class="progress-info">
                      <span>${course.progress}% Complete</span>
                      <span>${course.completedLessons || 0}/${course.totalLessons || 0} Lessons</span>
                  </div>
                  <div class="course-actions">
                      <button class="action-btn primary">Continue Learning</button>
                      <button class="action-btn secondary">View Materials</button>
                  </div>
              </div>
          `;
          courseGrid.appendChild(courseElement);
      });
  }
  
  // Update Stats Grid
  function updateStats(stats) {
      const statsGrid = document.getElementById('statsGrid');
      statsGrid.innerHTML = `
          <div class="stat-card">
              <div class="stat-icon courses">📚</div>
              <div class="stat-data">
                  <span class="stat-value" id="activeCourses">${stats.activeCourses || 0}</span>
                  <span class="stat-label">Active Courses</span>
              </div>
          </div>
          <div class="stat-card">
              <div class="stat-icon assignments">📝</div>
              <div class="stat-data">
                  <span class="stat-value" id="pendingAssignments">${stats.pendingAssignments || 0}</span>
                  <span class="stat-label">Pending Assignments</span>
              </div>
          </div>
          <div class="stat-card">
              <div class="stat-icon grades">📊</div>
              <div class="stat-data">
                  <span class="stat-value" id="averageGrade">${stats.averageGrade ? stats.averageGrade.toFixed(1) + '%' : 'N/A'}</span>
                  <span class="stat-label">Average Grade</span>
              </div>
          </div>
          <div class="stat-card">
              <div class="stat-icon certificates">🏆</div>
              <div class="stat-data">
                  <span class="stat-value" id="certificatesEarned">${stats.certificatesEarned || 0}</span>
                  <span class="stat-label">Certificates Earned</span>
              </div>
          </div>
      `;
  }
  
  // Helper function for generating calendar days
  function generateCalendarDays(currentDate, events) {
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
      const currentMonth = document.getElementById('currentMonth');
      
      // Update month title
      currentMonth.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      let calendarHTML = '';
      
      // Add empty cells for days before the 1st
      for (let i = 0; i < firstDay; i++) {
          calendarHTML += '<div class="calendar-day empty"></div>';
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayEvents = Object.values(events || {}).filter(event => {
              const eventDate = new Date(event.date);
              return eventDate.getDate() === day && 
                     eventDate.getMonth() === currentDate.getMonth() && 
                     eventDate.getFullYear() === currentDate.getFullYear();
          });
          
          calendarHTML += `
              <div class="calendar-day ${day === currentDate.getDate() ? 'today' : ''}">
                  <span class="day-number">${day}</span>
                  ${dayEvents.map(event => `<div class="calendar-event ${event.type}"></div>`).join('')}
              </div>
          `;
      }
      
      return calendarHTML;
  }
  
  // Calculate GPA and other metrics
  function calculateGPA(grades) {
      if (!grades || Object.keys(grades).length === 0) {
          return { gpa: 0, average: 0 };
      }
      
      const gradeValues = Object.values(grades);
      const average = gradeValues.reduce((acc, g) => acc + g.final, 0) / gradeValues.length;
      
      // Convert percentage to 4.0 scale (approximation)
      let gpa = 0;
      if (average >= 90) gpa = 4.0;
      else if (average >= 80) gpa = 3.0;
      else if (average >= 70) gpa = 2.0;
      else if (average >= 60) gpa = 1.0;
      
      return { gpa, average: average.toFixed(1) };
  }
  
  // Helper Functions
  function calculateUserStats(userData) {
      // Calculate various user statistics
      const stats = {
          activeCourses: 0,
          pendingAssignments: 0,
          averageGrade: 0,
          certificatesEarned: 0
      };
  
      if (userData.courses) {
          stats.activeCourses = Object.values(userData.courses).filter(c => c.status === 'active' || c.status === 'in-progress').length;
      }
  
      if (userData.assignments) {
          stats.pendingAssignments = Object.values(userData.assignments).filter(a => a.status === 'pending').length;
      }
  
      if (userData.grades) {
          const grades = Object.values(userData.grades);
          if (grades.length > 0) {
              stats.averageGrade = grades.reduce((acc, g) => acc + g.final, 0) / grades.length;
          }
      }
  
      if (userData.certificates) {
          stats.certificatesEarned = Object.keys(userData.certificates || {}).length;
      }
  
      return stats;
  }
  
  function formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
      });
  }
  
  function formatTimeAgo(timestamp) {
      const now = Date.now();
      const diffInSeconds = Math.floor((now - timestamp) / 1000);
  
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return formatDate(timestamp);
  }
  
  function getGradeLetter(percentage) {
      if (percentage >= 90) return 'A';
      if (percentage >= 80) return 'B';
      if (percentage >= 70) return 'C';
      if (percentage >= 60) return 'D';
      return 'F';
  }
  
  function getGradeClass(percentage) {
      return getGradeLetter(percentage).toLowerCase();
  }
  
  function getDeadlineClass(dueDate) {
      const now = new Date();
      const due = new Date(dueDate);
      const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'overdue';
      if (diffDays < 1) return 'urgent';
      if (diffDays < 3) return 'soon';
      return 'upcoming';
  }
  
  function getDeadlineText(dueDate) {
      const now = new Date();
      const due = new Date(dueDate);
      const diffDays = Math.floor((due - now) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Overdue';
      if (diffDays < 1) return 'Due Today';
      if (diffDays === 1) return 'Due Tomorrow';
      if (diffDays < 7) return `Due in ${diffDays} days`;
      return 'Upcoming';
  }
  
  function getAssignmentActions(assignment) {
      switch (assignment.status) {
          case 'pending':
              return '<button class="action-btn primary">Start Assignment</button><button class="action-btn secondary">View Details</button>';
          case 'submitted':
              return '<button class="action-btn secondary">View Submission</button>';
          case 'graded':
              return '<button class="action-btn secondary">View Feedback</button>';
          default:
              return '';
      }
  }
  
  function getEventAction(type) {
      switch (type) {
          case 'assignment': return 'View';
          case 'lecture': return 'Join';
          case 'quiz': return 'Start';
          default: return 'View';
      }
  }
  
  // Main initialization
  async function initializeDashboard() {
      if (!verifyToken()) {
          return; // Exit if no valid token
      }
  
      try {
          // Show loading state if you have a loading element
          // document.getElementById('loadingSpinner')?.classList.remove('hidden');
          
          // Fetch user data from the backend
          const response = await fetch('http://localhost:3000/api/user', {
              method: 'GET',
              headers: {
                  'Authorization': localStorage.getItem('token'),
              },
          });
  
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to fetch user data');
          }
  
          const userData = await response.json();
          console.log("User data:", userData); // Debugging log
  
          // Update all sections with try/catch blocks to prevent cascading failures
          try { updateDashboard(userData); } catch (e) { console.error("Error updating dashboard:", e); }
          try { updateCourses(userData.courses); } catch (e) { console.error("Error updating courses:", e); }
          try { updateAssignments(userData.assignments); } catch (e) { console.error("Error updating assignments:", e); }
          try { updateGrades(userData.grades, userData.courses); } catch (e) { console.error("Error updating grades:", e); }
          try { updateCalendar(userData.events); } catch (e) { console.error("Error updating calendar:", e); }
          try { updateMessages(userData.messages); } catch (e) { console.error("Error updating messages:", e); }
          try { updateSettings(userData); } catch (e) { console.error("Error updating settings:", e); }

          initializeNotifications();
        
        // Add event listeners to notification bells (if not already done in DOMContentLoaded)
        document.querySelectorAll('.notification-bell').forEach(bell => {
            bell.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event from bubbling up
                showNotificationPanel(this);
            });
        });
  
      } catch (error) {
          console.error("Error initializing dashboard:", error);
          // Alert the user 
          alert(`Error loading dashboard: ${error.message}. Please try again or contact support.`);
      } finally {
          // Hide loading spinner if you have one
          // document.getElementById('loadingSpinner')?.classList.add('hidden');
      }
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Add notification styles to the head
    addNotificationStyles();
    
    // Your existing code...
    initializeDashboard();

    setupProfilePictureUpload();
    setupNotifications();
    setupSettingsPanels();
    
});
  
  // Add a simple debug function to help troubleshoot
  function debugUserData() {
      const token = localStorage.getItem('token');
      if (!token) {
          console.log("No token found!");
          return;
      }
  
      fetch('http://localhost:3000/api/user', {
          headers: {
              'Authorization': token
          }
      })
      .then(response => {
          console.log("Response status:", response.status);
          return response.json();
      })
      .then(data => {
          console.log("API Response:", data);
      })
      .catch(err => {
          console.error("Fetch error:", err);
      });
  }
  
  // Initialize the dashboard when the page loads
  document.addEventListener('DOMContentLoaded', function() {
      console.log("DOM fully loaded, initializing dashboard...");
      initializeDashboard();
      
      // Add event listener for debug button if you add one
      document.getElementById('debugButton')?.addEventListener('click', debugUserData);
  });
  
  // Add a temporary debug button to the page (will be removed after debugging)
  function addDebugButton() {
      const debugDiv = document.createElement('div');
      debugDiv.style.position = 'fixed';
      debugDiv.style.bottom = '10px';
      debugDiv.style.right = '10px';
      debugDiv.style.zIndex = '1000';
      debugDiv.style.background = '#f8f8f8';
      debugDiv.style.padding = '10px';
      debugDiv.style.border = '1px solid #ddd';
      debugDiv.style.borderRadius = '5px';
      
      const debugButton = document.createElement('button');
      debugButton.id = 'debugButton';
      debugButton.textContent = 'Test API Connection';
      debugButton.style.padding = '5px 10px';
      
      const debugOutput = document.createElement('pre');
      debugOutput.id = 'debugOutput';
      debugOutput.textContent = 'Click button to test API';
      debugOutput.style.marginTop = '10px';
      debugOutput.style.maxHeight = '200px';
      debugOutput.style.overflow = 'auto';
      
      debugDiv.appendChild(debugButton);
      debugDiv.appendChild(debugOutput);
      document.body.appendChild(debugDiv);
      
      debugButton.addEventListener('click', function() {
          const output = document.getElementById('debugOutput');
          output.textContent = 'Testing API connection...';
          
          fetch('http://localhost:3000/api/user', {
              headers: {
                  'Authorization': localStorage.getItem('token') || 'no-token'
              }
          })
          .then(response => {
              output.textContent += `\nStatus: ${response.status}`;
              return response.json();
          })
          .then(data => {
              output.textContent += `\nResponse: ${JSON.stringify(data, null, 2)}`;
          })
          .catch(err => {
              output.textContent += `\nError: ${err.message}`;
          });
      });
  }
  
  // Call this to add the debug button (comment out when not needed)
  // setTimeout(addDebugButton, 1000);
  
  // Event Listeners
  document.querySelector('.signout-btn')?.addEventListener('click', function() {
      localStorage.removeItem('token');
      window.location.href = 'signin.html';
  });
  
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Remove active class from all links and sections
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
          
          // Add active class to clicked link
          this.classList.add('active');
          
          // Show corresponding section
          const sectionId = this.getAttribute('href').substring(1) + '-section';
          document.getElementById(sectionId).classList.add('active');
      });
  });
  
  // Handle settings navigation
  document.querySelectorAll('.settings-link').forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Remove active class from all links and panels
          document.querySelectorAll('.settings-link').forEach(l => l.classList.remove('active'));
          document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
          
          // Add active class to clicked link
          this.classList.add('active');
          
          // Show corresponding panel
          const panelId = this.getAttribute('href').substring(1) + '-settings';
          document.getElementById(panelId).classList.add('active');
      });
  });






 // Update Assignments Section
function updateAssignments(assignments) {
    const assignmentList = document.getElementById('assignmentList');
    assignmentList.innerHTML = '';

    if (!assignments || Object.keys(assignments).length === 0) {
        assignmentList.innerHTML = '<div class="empty-state">No assignments yet</div>';
        return;
    }

    // Convert to array and sort by due date (pending first, then by date)
    const sortedAssignments = Object.entries(assignments)
        .map(([id, assignment]) => ({ id, ...assignment }))
        .sort((a, b) => {
            // Pending assignments first
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            
            // Then sort by due date
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

    sortedAssignments.forEach(assignment => {
        const assignmentElement = document.createElement('div');
        assignmentElement.className = 'assignment-card';
        assignmentElement.innerHTML = `
            <div class="assignment-status ${assignment.status}"></div>
            <div class="assignment-info">
                <h3 class="assignment-title">${assignment.title}</h3>
                <p class="assignment-course">${assignment.courseName || 'Course'}</p>
                <div class="assignment-meta">
                    <span class="due-date">${assignment.status === 'pending' ? 'Due: ' + formatDate(assignment.dueDate) : 'Submitted: ' + formatDate(assignment.submittedDate || assignment.dueDate)}</span>
                    <span class="points">Points: ${assignment.points}</span>
                </div>
            </div>
            <div class="assignment-actions">
                ${getAssignmentActions(assignment)}
            </div>
        `;
        assignmentList.appendChild(assignmentElement);
    });
}

// Update Grades Section
function updateGrades(grades, courses) {
    // Update GPA card
    const gpaStats = calculateGPA(grades);
    const overallGPA = document.getElementById('overallGPA');
    const termAverage = document.getElementById('termAverage');
    const gradeDistribution = document.getElementById('gradeDistribution');
    
    if (overallGPA) overallGPA.textContent = gpaStats.gpa.toFixed(1);
    if (termAverage) termAverage.textContent = `${gpaStats.average}%`;
    if (gradeDistribution) gradeDistribution.style.width = `${gpaStats.average}%`;

    // Update course grades
    const gradesContainer = document.getElementById('courseGrades');
    if (!gradesContainer) return;
    
    gradesContainer.innerHTML = '';

    if (!grades || Object.keys(grades).length === 0) {
        gradesContainer.innerHTML = '<div class="empty-state">No grades available</div>';
        return;
    }

    Object.entries(grades).forEach(([courseId, grade]) => {
        const course = courses && courses[courseId] ? courses[courseId] : { name: 'Unknown Course' };
        const gradeElement = document.createElement('div');
        gradeElement.className = 'grade-card';
        gradeElement.innerHTML = `
            <div class="grade-header">
                <h3>${course.name}</h3>
                <span class="grade-badge ${getGradeClass(grade.final)}">${getGradeLetter(grade.final)}</span>
            </div>
            <div class="grade-details">
                ${Object.entries(grade.breakdown).map(([category, value]) => `
                    <div class="grade-item">
                        <span>${category}</span>
                        <span>${value}%</span>
                    </div>
                `).join('')}
            </div>
            <div class="grade-footer">
                <div class="final-grade">
                    <span>Final Grade</span>
                    <span>${grade.final}%</span>
                </div>
                <button class="view-details-btn">View Details</button>
            </div>
        `;
        gradesContainer.appendChild(gradeElement);
    });
}

// Update Calendar Section
function updateCalendar(events) {
    // Get current date
    const currentDate = new Date();
    
    // Update current month display
    const currentMonth = document.getElementById('currentMonth');
    if (currentMonth) {
        currentMonth.textContent = currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    // Update calendar days
    const calendarDays = document.getElementById('calendarDays');
    if (calendarDays) {
        calendarDays.innerHTML = generateCalendarDays(currentDate, events);
    }

    // Update upcoming events
    const eventList = document.getElementById('upcomingEvents');
    if (!eventList) return;
    
    eventList.innerHTML = '';

    if (!events || Object.keys(events).length === 0) {
        eventList.innerHTML = '<div class="empty-state">No upcoming events</div>';
        return;
    }

    const upcomingEvents = Object.values(events)
        .filter(event => new Date(event.date) > currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);  // Show only next 5 events

    upcomingEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `
            <div class="event-dot ${event.type}"></div>
            <div class="event-info">
                <div class="event-title">${event.title}</div>
                <div class="event-time">${formatDate(event.date)}</div>
            </div>
            <button class="event-action">${getEventAction(event.type)}</button>
        `;
        eventList.appendChild(eventElement);
    });
}

// Update Messages Section
function updateMessages(messages) {
    const messageThreads = document.getElementById('messageThreads');
    if (!messageThreads) return;
    
    messageThreads.innerHTML = '';

    if (!messages || Object.keys(messages).length === 0) {
        messageThreads.innerHTML = '<div class="empty-state">No messages yet</div>';
        return;
    }

    // Sort messages by timestamp (newest first)
    const sortedThreads = Object.entries(messages)
        .map(([id, thread]) => ({ id, ...thread }))
        .sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);

    sortedThreads.forEach(thread => {
        const threadElement = document.createElement('div');
        threadElement.className = 'message-thread';
        threadElement.innerHTML = `
            <img src="${thread.avatar || '/api/placeholder/50/50'}" alt="${thread.name}" class="thread-avatar">
            <div class="thread-info">
                <div class="thread-header">
                    <h3>${thread.name}</h3>
                    <span class="thread-time">${formatTimeAgo(thread.lastMessage.timestamp)}</span>
                </div>
                <p class="thread-preview">${thread.lastMessage.content}</p>
            </div>
        `;
        messageThreads.appendChild(threadElement);
    });
    
    // Initialize empty chat area
    const chatHeader = document.getElementById('chatHeader');
    const chatMessages = document.getElementById('chatMessages');
    
    if (chatHeader) {
        chatHeader.innerHTML = '<p class="chat-placeholder">Select a conversation to start messaging</p>';
    }
    
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Add click event to threads
    messageThreads.querySelectorAll('.message-thread').forEach(thread => {
        thread.addEventListener('click', function() {
            // Remove active class from all threads
            messageThreads.querySelectorAll('.message-thread').forEach(t => 
                t.classList.remove('active')
            );
            
            // Add active class to clicked thread
            this.classList.add('active');
            
            // Update chat header with thread info
            if (chatHeader) {
                const threadName = this.querySelector('h3').textContent;
                const avatarSrc = this.querySelector('.thread-avatar').src;
                
                chatHeader.innerHTML = `
                    <img src="${avatarSrc}" alt="${threadName}" class="chat-avatar">
                    <div class="chat-info">
                        <h3>${threadName}</h3>
                        <span class="chat-status">Online</span>
                    </div>
                `;
            }
            
            // Here you would normally load the chat messages for this thread
            // For now, we'll just add a placeholder
            if (chatMessages) {
                chatMessages.innerHTML = '<p class="chat-placeholder">This is the beginning of your conversation.</p>';
            }
        });
    });
}

// Update Settings Section
function updateSettings(userData) {
    // Profile settings
    const settingsName = document.getElementById('settingsName');
    const settingsEmail = document.getElementById('settingsEmail');
    const settingsPhone = document.getElementById('settingsPhone');
    const settingsBio = document.getElementById('settingsBio');
    
    if (settingsName) settingsName.value = userData.name || '';
    if (settingsEmail) settingsEmail.value = userData.email || '';
    if (settingsPhone) settingsPhone.value = userData.phone || '';
    if (settingsBio) settingsBio.value = userData.bio || '';
    
    // Add event listener to profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Settings updates are currently disabled in this demo.');
            // In a real app, you would send the updated data to the server here
        });
    }
}

// Add a troubleshooting function that will help you debug API issues
function troubleshootAPI() {
    // Create a debug div if it doesn't exist
    if (!document.getElementById('debugPanel')) {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debugPanel';
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '10px';
        debugDiv.style.right = '10px';
        debugDiv.style.backgroundColor = 'white';
        debugDiv.style.border = '1px solid #ccc';
        debugDiv.style.padding = '10px';
        debugDiv.style.zIndex = '9999';
        debugDiv.style.maxWidth = '400px';
        debugDiv.style.maxHeight = '300px';
        debugDiv.style.overflow = 'auto';
        debugDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        debugDiv.style.fontSize = '12px';
        debugDiv.style.fontFamily = 'monospace';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.marginBottom = '10px';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(debugDiv);
        });
        
        const testButton = document.createElement('button');
        testButton.textContent = 'Test API';
        testButton.style.marginLeft = '10px';
        testButton.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            const output = document.createElement('div');
            output.textContent = `Token: ${token ? 'Present' : 'Missing'}`;
            
            fetch('http://localhost:3000/api/user', {
                headers: {
                    'Authorization': token || ''
                }
            })
            .then(response => {
                output.textContent += `\nStatus: ${response.status}`;
                return response.text();
            })
            .then(text => {
                try {
                    const json = JSON.parse(text);
                    output.textContent += `\nResponse: OK`;
                    const dataPreview = document.createElement('pre');
                    dataPreview.textContent = JSON.stringify(json, null, 2).substring(0, 200) + '...';
                    output.appendChild(dataPreview);
                } catch (e) {
                    output.textContent += `\nResponse Text: ${text.substring(0, 100)}`;
                }
            })
            .catch(err => {
                output.textContent += `\nError: ${err.message}`;
            });
            
            debugDiv.appendChild(output);
        });
        
        debugDiv.appendChild(closeButton);
        debugDiv.appendChild(testButton);
        document.body.appendChild(debugDiv);
    }
}

// Add keyboard shortcut for troubleshooting (press Ctrl+Shift+D)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        troubleshootAPI();
    }
});






// Add these functions to your student.js file

// Notification counter and data
let notificationCount = 0;
let notifications = [];

// Initialize notifications
function initializeNotifications() {

    // Check local storage for saved notifications
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
        // Use saved notifications if they exist
        notifications = JSON.parse(savedNotifications);
    } else {
        // For demo purposes, let's create some sample notifications
        notifications = [
            {
                id: 1,
                type: 'assignment',
                title: 'New Assignment Added',
                message: 'Web Development Fundamentals: Portfolio Project has been assigned.',
                timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
                read: false
            },
            {
                id: 2,
                type: 'grade',
                title: 'Assignment Graded',
                message: 'Your Algorithm Analysis assignment has been graded. You received 92%.',
                timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
                read: false
            },
            {
                id: 3,
                type: 'announcement',
                title: 'Class Canceled',
                message: 'Tomorrow\'s Web Development lecture has been canceled.',
                timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
                read: true
            }
        ];
    }

    // Update notification counter
    updateNotificationCounter();
}

// Update notification counter display
function updateNotificationCounter() {
    // Count unread notifications
    notificationCount = notifications.filter(n => !n.read).length;
    
    // Update all notification bell icons
    const notificationBells = document.querySelectorAll('.notification-bell');
    
    notificationBells.forEach(bell => {
        // Clear previous content
        bell.innerHTML = '🔔';
        
        // Add counter if there are unread notifications
        if (notificationCount > 0) {
            const counter = document.createElement('span');
            counter.className = 'notification-counter';
            counter.textContent = notificationCount;
            bell.appendChild(counter);
        }
    });
}

// Show notification panel
function showNotificationPanel(bell) {
    // Remove any existing notification panels
    document.querySelectorAll('.notification-panel').forEach(panel => panel.remove());
    
    // Create notification panel
    const panel = document.createElement('div');
    panel.className = 'notification-panel';
    
    // Add header
    const header = document.createElement('div');
    header.className = 'notification-header';
    header.innerHTML = `
        <h3>Notifications</h3>
        <button class="mark-all-read">Mark all as read</button>
    `;
    panel.appendChild(header);
    
    // Add notification list
    const list = document.createElement('div');
    list.className = 'notification-list';
    
    if (notifications.length === 0) {
        list.innerHTML = '<div class="empty-state">No notifications</div>';
    } else {
        // Sort notifications by timestamp (newest first)
        const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
        
        sortedNotifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
            item.setAttribute('data-id', notification.id);
            
            item.innerHTML = `
                <div class="notification-icon ${notification.type}"></div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${formatTimeAgo(notification.timestamp)}</div>
                </div>
            `;
            
            list.appendChild(item);
        });
    }
    
    panel.appendChild(list);
    
    // Add footer
    const footer = document.createElement('div');
    footer.className = 'notification-footer';
    footer.innerHTML = `
        <a href="#" class="view-all-notifications">View all notifications</a>
    `;
    panel.appendChild(footer);
    
    // Position the panel relative to the bell
    const bellRect = bell.getBoundingClientRect();
    panel.style.position = 'absolute';
    panel.style.top = `${bellRect.bottom + window.scrollY + 10}px`;
    panel.style.right = `${window.innerWidth - bellRect.right - window.scrollX}px`;
    
    // Add panel to the body
    document.body.appendChild(panel);
    
    // Add event listeners
    document.querySelector('.mark-all-read').addEventListener('click', markAllNotificationsAsRead);
    
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            markNotificationAsRead(id);
        });
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', closeNotificationPanel);
}

// Mark notification as read
function markNotificationAsRead(id) {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        updateNotificationCounter();
        
        // Save to localStorage
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        // Update UI
        const item = document.querySelector(`.notification-item[data-id="${id}"]`);
        if (item) {
            item.classList.remove('unread');
            item.classList.add('read');
        }
    }
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    updateNotificationCounter();
    
    // Save to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Update UI
    document.querySelectorAll('.notification-item').forEach(item => {
        item.classList.remove('unread');
        item.classList.add('read');
    });
}

// Close notification panel
function closeNotificationPanel(event) {
    const panel = document.querySelector('.notification-panel');
    const bells = document.querySelectorAll('.notification-bell');
    
    // Don't close if clicking inside the panel or on a bell
    let isClickInsidePanelOrBell = false;
    
    if (panel && event.target) {
        isClickInsidePanelOrBell = panel.contains(event.target);
        
        bells.forEach(bell => {
            if (bell.contains(event.target)) {
                isClickInsidePanelOrBell = true;
            }
        });
    }
    
    if (panel && !isClickInsidePanelOrBell) {
        panel.remove();
        document.removeEventListener('click', closeNotificationPanel);
    }
}

// Add CSS for notifications to the head
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification-bell {
            position: relative;
            cursor: pointer;
        }
        
        .notification-counter {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ef4444;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
        }
        
        .notification-panel {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            width: 320px;
            max-width: 90vw;
            max-height: 80vh;
            overflow: hidden;
            z-index: 1000;
        }
        
        .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .notification-header h3 {
            margin: 0;
            color: #1a365d;
            font-size: 1rem;
        }
        
        .mark-all-read {
            background: none;
            border: none;
            color: #4993ee;
            cursor: pointer;
            font-size: 0.875rem;
        }
        
        .notification-list {
            max-height: 360px;
            overflow-y: auto;
        }
        
        .notification-item {
            display: flex;
            padding: 12px 16px;
            border-bottom: 1px solid #f0f4f8;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .notification-item:hover {
            background-color: #f8fafc;
        }
        
        .notification-item.unread {
            background-color: #f0f7ff;
        }
        
        .notification-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .notification-icon.assignment {
            background-color: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
        }
        
        .notification-icon.assignment::before {
            content: "📝";
        }
        
        .notification-icon.grade {
            background-color: rgba(34, 197, 94, 0.1);
            color: #22c55e;
        }
        
        .notification-icon.grade::before {
            content: "📊";
        }
        
        .notification-icon.announcement {
            background-color: rgba(73, 147, 238, 0.1);
            color: #4993ee;
        }
        
        .notification-icon.announcement::before {
            content: "📢";
        }
        
        .notification-content {
            flex: 1;
        }
        
        .notification-title {
            color: #1a365d;
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .notification-message {
            color: #64748b;
            font-size: 0.875rem;
            margin-bottom: 4px;
        }
        
        .notification-time {
            color: #94a3b8;
            font-size: 0.75rem;
        }
        
        .notification-footer {
            padding: 12px 16px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .view-all-notifications {
            color: #4993ee;
            text-decoration: none;
            font-size: 0.875rem;
        }
    `;
    
    document.head.appendChild(style);
}

// Add these calls to your initializeDashboard function or directly to the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    // Initialize notifications system
    addNotificationStyles();
    initializeNotifications();
    
    // Add event listeners to notification bells
    document.querySelectorAll('.notification-bell').forEach(bell => {
        bell.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event from bubbling up
            showNotificationPanel(this);
        });
    });
});

// Profile Picture Upload
function setupProfilePictureUpload() {
    // Get DOM elements
    const profileImg = document.querySelector('.profile-img');
    const profileModal = document.getElementById('profilePictureModal');
    const closeModal = document.getElementById('closeProfileModal');
    const chooseFileBtn = document.getElementById('chooseFileBtn');
    const fileInput = document.getElementById('profileImageInput');
    const uploadPreview = document.getElementById('uploadPreview');
    const saveButton = document.getElementById('saveProfilePicture');
    const cancelButton = document.getElementById('cancelUpload');
    const changeProfilePicture = document.getElementById('changeProfilePicture');
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    
    // If any element is missing, return early
    if (!profileImg || !profileModal) return;
    
    // Show modal when profile image is clicked
    profileImg.addEventListener('click', () => {
        profileModal.style.display = 'flex';
    });
    
    // Also show modal when "Change Photo" button is clicked in settings
    if (changeProfilePicture) {
        changeProfilePicture.addEventListener('click', () => {
            profileModal.style.display = 'flex';
        });
    }
    
    // Close modal when close button is clicked
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
    }
    
    // Open file picker when "Choose File" button is clicked
    if (chooseFileBtn && fileInput) {
        chooseFileBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // Handle file selection
    if (fileInput && uploadPreview && saveButton) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size exceeds 2MB. Please choose a smaller file.');
                fileInput.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.match('image.*')) {
                alert('Please select an image file (JPG, PNG, or GIF).');
                fileInput.value = '';
                return;
            }
            
            // Display preview
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadPreview.src = e.target.result;
                saveButton.disabled = false;
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Handle save button click
    if (saveButton && profileImg && profilePicturePreview) {
        saveButton.addEventListener('click', () => {
            // In a real app, you would upload the file to the server here
            // For this demo, we'll just update the profile image display
            const newImageSrc = uploadPreview.src;
            profileImg.src = newImageSrc;
            
            if (profilePicturePreview) {
                profilePicturePreview.src = newImageSrc;
            }
            
            // Close the modal
            profileModal.style.display = 'none';
            
            // Reset the file input
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Disable save button until new file is selected
            saveButton.disabled = true;
            
            // Show success message
            alert('Profile picture updated successfully!');
        });
    }
    
    // Handle cancel button click
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            // Close the modal
            profileModal.style.display = 'none';
            
            // Reset the file input
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Reset the preview
            if (uploadPreview) {
                uploadPreview.src = '/api/placeholder/200/200';
            }
            
            // Disable save button
            if (saveButton) {
                saveButton.disabled = true;
            }
        });
    }
    
    // Close modal when clicking outside content
    window.addEventListener('click', (event) => {
        if (event.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
}

// Notification System
function setupNotifications() {
    const notificationBell = document.getElementById('notificationBell');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationItems = document.querySelectorAll('.notification-item');
    const markAllReadButton = document.querySelector('.mark-all-read');
    const viewAllNotificationsLink = document.querySelector('.view-all-notifications');
    const notificationCount = document.getElementById('notificationCount');
    
    if (!notificationBell || !notificationDropdown) return;
    
    // Toggle notification dropdown
    notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (notificationDropdown.classList.contains('show') && 
            !notificationDropdown.contains(e.target) && 
            e.target !== notificationBell) {
            notificationDropdown.classList.remove('show');
        }
    });
    
    // Mark all notifications as read
    if (markAllReadButton) {
        markAllReadButton.addEventListener('click', () => {
            notificationItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update notification count
            updateNotificationCount();
        });
    }
    
    // View all notifications link (navigate to notifications section)
    if (viewAllNotificationsLink) {
        viewAllNotificationsLink.addEventListener('click', (e) => {
            // Hide dropdown
            notificationDropdown.classList.remove('show');
            
            // Navigate to notifications settings
            navigateToSection('notifications');
        });
    }
    
    // Handle notification action buttons
    document.querySelectorAll('.notification-action').forEach(button => {
        button.addEventListener('click', (e) => {
            const notificationItem = button.closest('.notification-item');
            
            // Mark this notification as read
            if (notificationItem) {
                notificationItem.classList.remove('unread');
                updateNotificationCount();
            }
            
            // For demo purposes, we'll just hide the dropdown
            notificationDropdown.classList.remove('show');
            
            // In a real app, you would navigate to the relevant page based on notification type
            const actionType = button.textContent.trim().toLowerCase();
            const notificationType = notificationItem.querySelector('.notification-icon').classList[1];
            
            switch (actionType) {
                case 'view':
                    if (notificationType === 'assignment') {
                        navigateToSection('assignments');
                    } else if (notificationType === 'grade') {
                        navigateToSection('grades');
                    } else {
                        navigateToSection('dashboard');
                    }
                    break;
                case 'reply':
                    navigateToSection('messages');
                    break;
                case 'continue':
                    navigateToSection('courses');
                    break;
            }
        });
    });
    
    // Update notification count badge
    function updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        
        if (notificationCount) {
            notificationCount.textContent = unreadCount;
            
            // Hide badge if no unread notifications
            if (unreadCount === 0) {
                notificationCount.style.display = 'none';
            } else {
                notificationCount.style.display = 'flex';
            }
        }
    }
    
    // Initialize notification count
    updateNotificationCount();
}

// Helper function to navigate to a section
function navigateToSection(sectionName) {
    // Find the corresponding nav link
    const navLink = document.querySelector(`.nav-link[href="#${sectionName}"]`);
    
    if (navLink) {
        // Simulate a click on the nav link
        navLink.click();
    }
}

// Settings Panels Navigation
function setupSettingsPanels() {
    const settingsLinks = document.querySelectorAll('.settings-link');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    
    if (!settingsLinks.length || !settingsPanels.length) return;
    
    settingsLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links and panels
            settingsLinks.forEach(l => l.classList.remove('active'));
            settingsPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Show corresponding panel
            const panelId = link.getAttribute('href').substring(1) + '-settings';
            const panel = document.getElementById(panelId);
            
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
}