// Function to withdraw from a course
function withdrawFromCourse(courseId, courseTitle) {
    // Confirm that the user wants to withdraw
    if (!confirm(`Are you sure you want to withdraw from "${courseTitle}"? This action cannot be undone.`)) {
      return; // User canceled the action
    }
    
    // Try to withdraw via API first
    withdrawViaApi(courseId)
      .then(success => {
        if (!success) {
          // Fall back to localStorage if API fails
          withdrawViaLocalStorage(courseId, courseTitle);
        }
      })
      .catch(error => {
        console.error("API withdrawal error:", error);
        // Fall back to localStorage
        withdrawViaLocalStorage(courseId, courseTitle);
      });
  }
  
  // Helper function for API withdrawal
  async function withdrawViaApi(courseId) {
    try {
      const response = await fetch(`http://localhost:3000/api/enrollments/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': localStorage.getItem('token')
        }
      });
      
      if (response.ok) {
        // Also remove from localStorage for redundancy
        removeEnrollmentFromLocalStorage(courseId);
        
        alert('You have successfully withdrawn from the course.');
        
        // Reload the page or update the UI
        window.location.reload();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("API withdrawal failed:", error);
      return false;
    }
  }
  
  // Helper function for localStorage withdrawal
  function withdrawViaLocalStorage(courseId, courseTitle) {
    if (removeEnrollmentFromLocalStorage(courseId)) {
      alert(`You have successfully withdrawn from "${courseTitle}".`);
      
      // Reload the page or update the UI
      window.location.reload();
    } else {
      alert('Error: Course not found in your enrollments.');
    }
  }
  
  // Helper function to remove enrollment from localStorage
  function removeEnrollmentFromLocalStorage(courseId) {
    let enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses')) || [];
    
    // Check if course exists
    const courseIndex = enrolledCourses.findIndex(course => course.id === courseId);
    
    if (courseIndex === -1) {
      console.error("Course not found in enrollments:", courseId);
      return false;
    }
    
    // Remove course from array
    enrolledCourses.splice(courseIndex, 1);
    
    // Save updated enrollments
    localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
    console.log("Course removed from localStorage:", courseId);
    console.log("Remaining enrolled courses:", enrolledCourses);
    
    // Update dashboard stats if we're on the dashboard page
    if (document.getElementById('statsGrid') || document.getElementById('activeCourses')) {
      updateDashboardStats();
    }
    
    return true;
  }
  
  // Modify updateCourses function to add withdrawal buttons
  function updateCourses(courses) {
    const courseGrid = document.getElementById('courseGrid');
    if (!courseGrid) return;
  
    courseGrid.innerHTML = '';
  
    if (!courses || Object.keys(courses).length === 0) {
      courseGrid.innerHTML = '<div class="empty-state">No courses enrolled yet. <a href="courses.html">Browse courses</a></div>';
      return;
    }
  
    Object.entries(courses).forEach(([courseId, course]) => {
      const courseElement = document.createElement('div');
      courseElement.className = 'course-card';
      courseElement.setAttribute('data-id', courseId);
      
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
            <button class="action-btn withdraw" data-id="${courseId}" data-title="${course.name}">Withdraw</button>
          </div>
        </div>
      `;
      
      courseGrid.appendChild(courseElement);
    });
    
    // Add event listeners for the withdraw buttons
    document.querySelectorAll('.action-btn.withdraw').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const courseId = this.getAttribute('data-id');
        const courseTitle = this.getAttribute('data-title');
        withdrawFromCourse(courseId, courseTitle);
      });
    });
    
    // Set up other course action buttons
    setupCourseActions();
  }
  
  // Add some CSS for the withdraw button
  function addWithdrawButtonStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .action-btn.withdraw {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 0.5rem;
      }
      
      .action-btn.withdraw:hover {
        background: rgba(239, 68, 68, 0.2);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add this to your DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', function() {
    // Add withdraw button styles
    addWithdrawButtonStyles();
  });
