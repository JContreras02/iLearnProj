// Global variables
let currentUser = null;
let currentSection = 'dashboard';
let instructorData = {};

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Prevent showing multiple error toasts
    if (!window.hasShownError) {
        showToast('An error occurred. Please refresh the page.', 'error');
        window.hasShownError = true;
        setTimeout(() => window.hasShownError = false, 5000);
    }
});

// Add null checks to element selectors
function safeQuerySelector(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Element not found: ${selector}`);
        return null;
    }
    return element;
}

// Modify DOM operations to use safe selectors
function updateUI(elementId, value) {
    const element = safeQuerySelector(`#${elementId}`);
    if (element) {
        element.textContent = value;
    }
}

// Document ready function
document.addEventListener('DOMContentLoaded', () => {
    // Initialize event listeners
    initializeEventListeners();
    
    // Verify token before proceeding
    verifyToken();
});

// Verify JWT token
function verifyToken() {
    showLoading();
    
    const token = localStorage.getItem("token");
    console.log("Retrieved token:", token);

    if (!token) {
        console.log("No token found, redirecting to login...");
        window.location.href = "signin.html";
        return;
    }
    
    // Fetch user data with token
    fetch('http://localhost:3000/api/user', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Unauthorized or session expired');
        }
        return response.json();
    })
    .then(userData => {
        // Check if user is an instructor
        if (userData.role !== 'instructor') {
            throw new Error('Access denied: Not an instructor');
        }
        
        // Store user data
        currentUser = userData;
        
        // Initialize instructor portal
        initializeInstructorPortal(userData);
    })
    .catch(error => {
        console.error("Token verification error:", error);
        // Clear token and redirect to login
        localStorage.removeItem("token");
        window.location.href = "signin.html";
    })
    .finally(() => {
        hideLoading();
    });
}

// Initialize Instructor Portal
async function initializeInstructorPortal(userData) {
    try {
        // Update profile UI
        updateUserDisplay(userData);
        
        // Load dashboard data
        await loadInstructorData();
        
        // Show dashboard by default
        switchSection('dashboard');


        initializeUserProfile(userData);

    } catch (error) {
        console.error("Error initializing portal:", error);
        showToast('Error loading portal data', 'error');
    }
}

// Load instructor data from server
async function loadInstructorData() {
    showLoading();
    
    try {
        const token = localStorage.getItem("token");
        
        // Fetch instructor data from the server
        const response = await fetch('http://localhost:3000/api/instructor/dashboard', {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load instructor data');
        }
        
        // Store instructor data
        instructorData = await response.json();
        
        // Update dashboard with instructor data
        updateDashboardStats(instructorData.stats || {});
        updateRecentActivity(instructorData.activities || {});
        updateStudentEngagement(instructorData.engagement || {});
        updateRecentReviews(instructorData.reviews || {});
    } catch (error) {
        console.error("Error loading instructor data:", error);
        showToast('Failed to load instructor data', 'error');
    } finally {
        hideLoading();
    }
}

// Update User Display
function updateUserDisplay(userData) {
    // Update welcome message
    updateUI('welcomeMessage', `Welcome back, ${userData.name}! 👋`);
    
    // Update profile information
    updateUI('userName', userData.name);
    updateUI('userEmail', userData.email);
    
    // Update profile settings if in settings panel
    document.getElementById('settingsName')?.setAttribute('value', userData.name);
    document.getElementById('settingsEmail')?.setAttribute('value', userData.email);
    document.getElementById('settingsPhone')?.setAttribute('value', userData.phone || '');
    
    // Set profile image if available
    const profileImg = document.getElementById('userProfileImage');
    if (profileImg && userData.avatar) {
        profileImg.src = userData.avatar;
    }
}

// Dashboard functions
function updateDashboardStats(stats) {
    // Update stats cards
    updateUI('totalStudents', stats.totalStudents || 0);
    updateUI('activeCourses', stats.activeCourses || 0);
    updateUI('monthlyEarnings', formatCurrency(stats.monthlyEarnings || 0));
    updateUI('averageRating', stats.averageRating?.toFixed(1) || '0.0');

    // Update engagement stats
    updateUI('completionRate', `${stats.completionRate || 0}%`);
    updateUI('submissionRate', `${stats.submissionRate || 0}%`);
}

function updateRecentActivity(activities) {
    const activityList = document.getElementById('courseActivityList');
    if (!activityList) return;
    
    if (!activities || Object.keys(activities).length === 0) {
        activityList.innerHTML = '<div class="empty-state">No recent activity</div>';
        return;
    }

    activityList.innerHTML = Object.entries(activities)
        .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
        .map(([id, activity]) => `
            <div class="activity-item">
                <div class="activity-info">
                    <h3>${activity.courseName}</h3>
                    <p>${activity.description}</p>
                    <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
                </div>
                <button class="action-btn" onclick="viewCourseDetails('${id}')">
                    View Details
                </button>
            </div>
        `).join('');
}

function updateStudentEngagement(engagement) {
    if (!engagement) return;
    
    // Update engagement metrics
    updateUI('completionRate', `${engagement.completionRate || 0}%`);
    updateUI('submissionRate', `${engagement.submissionRate || 0}%`);
}

function updateRecentReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    if (!reviews || Object.keys(reviews).length === 0) {
        reviewsList.innerHTML = '<div class="empty-state">No reviews yet</div>';
        return;
    }

    reviewsList.innerHTML = Object.entries(reviews)
        .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
        .map(([id, review]) => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                    <span class="review-date">${formatTimeAgo(review.timestamp)}</span>
                </div>
                <p class="review-text">"${review.comment}"</p>
                <span class="review-course">${review.courseName}</span>
            </div>
        `).join('');
}

// Course management functions
function updateCoursesList(courses) {
    const courseList = document.getElementById('courseList');
    if (!courseList) return;
    
    if (!courses || Object.keys(courses).length === 0) {
        courseList.innerHTML = `
            <div class="empty-state">
                <h3>No Courses Yet</h3>
                <p>Start by creating your first course!</p>
                <button class="btn-primary" onclick="handleCreateCourse()">Create Course</button>
            </div>
        `;
        return;
    }

    courseList.innerHTML = Object.entries(courses)
        .map(([id, course]) => createCourseElement(id, course))
        .join('');
}

function createCourseElement(id, course) {
    return `
        <div class="course-item" data-status="${course.status}" data-course-id="${id}">
            <div class="course-thumbnail">
                <img src="${course.thumbnail || '/api/placeholder/300/200'}" 
                     alt="${course.title}" class="course-image">
                <span class="course-status ${course.status}">${course.status}</span>
            </div>
            <div class="course-details">
                <div class="course-info">
                    <h3>${course.title}</h3>
                    <p class="course-description">${course.description}</p>
                    <div class="course-meta">
                        <span>📚 ${course.lessons || 0} Lessons</span>
                        <span>⏱️ ${course.duration || 0} Hours</span>
                        <span>👥 ${course.enrollments || 0} Students</span>
                    </div>
                </div>
                <div class="course-stats">
                    <div class="stat-item">
                        <span class="stat-label">Rating</span>
                        <span class="stat-value">⭐ ${course.rating || 0} (${course.reviews || 0})</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Revenue</span>
                        <span class="stat-value">${formatCurrency(course.revenue || 0)}</span>
                    </div>
                </div>
            </div>
            <div class="course-actions">
                <button class="action-btn" onclick="editCourse('${id}')">
                    Edit Course
                </button>
                <button class="action-btn" onclick="viewCourse('${id}')">
                    View Content
                </button>
                <div class="action-dropdown">
                    <button class="dropdown-btn" onclick="toggleDropdown(this)">⋮</button>
                    <div class="dropdown-content">
                        <a href="#" onclick="previewCourse('${id}'); return false;">Preview</a>
                        <a href="#" onclick="duplicateCourse('${id}'); return false;">Duplicate</a>
                        <a href="#" onclick="archiveCourse('${id}'); return false;" 
                           class="text-warning">Archive</a>
                        <a href="#" onclick="deleteCourse('${id}'); return false;" 
                           class="text-danger">Delete</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Student management functions
function updateStudentsList(students) {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    if (!students || Object.keys(students).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-content">
                        <h3>No Students Yet</h3>
                        <p>Students will appear here when they enroll in your courses</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = Object.entries(students)
        .map(([id, student]) => createStudentRow(id, student))
        .join('');
}

function createStudentRow(id, student) {
    return `
        <tr class="student-row" data-student-id="${id}" data-status="${student.status}">
            <td>
                <input type="checkbox" class="select-student" />
            </td>
            <td>
                <div class="student-info">
                    <img src="${student.avatar || '/api/placeholder/40/40'}" 
                         alt="${student.name}" class="student-avatar" />
                    <div>
                        <div class="student-name">${student.name}</div>
                        <div class="student-email">${student.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="course-info">
                    <div class="course-name">${student.courseName}</div>
                    <div class="enrollment-date">
                        Enrolled: ${formatDate(student.enrollmentDate)}
                    </div>
                </div>
            </td>
            <td>
                <div class="progress-info">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${student.progress}%"></div>
                    </div>
                    <span>${student.progress}% Complete</span>
                </div>
            </td>
            <td>
                <div class="activity-info">
                    <span class="activity-time">${formatTimeAgo(student.lastActive)}</span>
                    <span class="activity-status ${student.status}">${student.status}</span>
                </div>
            </td>
            <td>
                <div class="performance-info">
                    <div class="grade">${student.grade}</div>
                    <div class="assignment-status">${student.assignmentStatus}</div>
                </div>
            </td>
            <td>
                <div class="row-actions">
                    <button class="action-btn" onclick="viewStudentProgress('${id}')">
                        View Progress
                    </button>
                    <div class="action-dropdown">
                        <button class="dropdown-btn" onclick="toggleDropdown(this)">⋮</button>
                        <div class="dropdown-content">
                            <a href="#" onclick="sendMessage('${id}'); return false;">
                                Send Message
                            </a>
                            <a href="#" onclick="viewAssignments('${id}'); return false;">
                                View Assignments
                            </a>
                            <a href="#" onclick="downloadReport('${id}'); return false;">
                                Download Report
                            </a>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

// Section Navigation function
function switchSection(sectionId) {
    // Remove active class from all sections and nav links
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to selected section and nav link
    const sectionElement = document.getElementById(`${sectionId}-section`);
    const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
    
    if (sectionElement) sectionElement.classList.add('active');
    if (navLink) navLink.classList.add('active');
    
    // Set current section
    currentSection = sectionId;
    
    // Load section specific data
    loadSectionData(sectionId);
}

// Load section specific data
function loadSectionData(sectionId) {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    // Endpoint based on section
    const endpoint = `http://localhost:3000/api/instructor/${sectionId}`;
    
    fetch(endpoint, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to load ${sectionId} data`);
        }
        return response.json();
    })
    .then(data => {
        // Update UI based on section
        switch(sectionId) {
            case 'dashboard':
                updateDashboardStats(data.stats || {});
                updateRecentActivity(data.activities || {});
                updateStudentEngagement(data.engagement || {});
                updateRecentReviews(data.reviews || {});
                break;
            case 'courses':
                updateCoursesList(data.courses || {});
                break;
            case 'students':
                updateStudentsList(data.students || {});
                break;
            case 'assignments':
                updateAssignmentsList(data.assignments || {});
                break;
            case 'analytics':
                updateAnalytics(data.analytics || {});
                break;
            case 'discussions':
                updateDiscussionsList(data.discussions || {});
                break;
            case 'earnings':
                updateEarningsDisplay(data.earnings || {});
                break;
            case 'settings':
                // Settings are already populated from user data
                break;
        }
    })
    .catch(error => {
        console.error(`Error loading ${sectionId} data:`, error);
        showToast(`Failed to load ${sectionId} data`, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Initialize Event Listeners
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('href').substring(1);
            switchSection(sectionId);
        });
    });
    
    // Settings navigation
    document.querySelectorAll('.settings-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('href').substring(1);
            switchSettingsTab(tabId);
        });
    });
    
    // Sign Out button
    const signoutBtn = document.querySelector('.signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', handleSignOut);
    }
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
}

// Settings Tab switch
function switchSettingsTab(tabId) {
    // Remove active class from all panels and links
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.querySelectorAll('.settings-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to selected panel and link
    const selectedPanel = document.getElementById(`${tabId}-settings`);
    const selectedLink = document.querySelector(`[href="#${tabId}"]`);
    
    if (selectedPanel) selectedPanel.classList.add('active');
    if (selectedLink) selectedLink.classList.add('active');
}

// Course actions
function handleCreateCourse() {
    // Reset form
    const form = document.getElementById('createCourseForm');
    if (form) {
        form.reset();
        
        // Clear hidden course ID field
        const courseIdField = document.getElementById('courseId');
        if (courseIdField) courseIdField.value = '';
        
        // Update modal title
        const modalTitle = document.getElementById('courseModalTitle');
        if (modalTitle) modalTitle.textContent = 'Create New Course';
        
        // Open modal
        openModal('createCourseModal');
    }
}

// Course form submission
function handleCourseSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    // Get form data
    const formData = new FormData(event.target);
    const courseId = formData.get('courseId');
    
    // Determine if creating or updating
    const method = courseId ? 'PUT' : 'POST';
    const endpoint = courseId 
        ? `http://localhost:3000/api/courses/${courseId}` 
        : 'http://localhost:3000/api/courses';
    
    fetch(endpoint, {
        method: method,
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to save course');
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('createCourseModal');
        
        // Show success message
        showToast(courseId ? 'Course updated successfully!' : 'Course created successfully!', 'success');
        
        // Reload courses data if on courses section
        if (currentSection === 'courses') {
            loadSectionData('courses');
        }
    })
    .catch(error => {
        console.error('Course save error:', error);
        showToast('Failed to save course', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Course edit function
function editCourse(courseId) {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    fetch(`http://localhost:3000/api/courses/${courseId}`, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to load course data');
        }
        return response.json();
    })
    .then(course => {
        // Fill form with course data
        document.getElementById('courseId').value = courseId;
        document.getElementById('courseTitle').value = course.title;
        document.getElementById('courseDescription').value = course.description;
        document.getElementById('courseCategory').value = course.category;
        document.getElementById('coursePrice').value = course.price;
        
        // Update modal title
        document.getElementById('courseModalTitle').textContent = 'Edit Course';
        
        // Open modal
        openModal('createCourseModal');
    })
    .catch(error => {
        console.error('Error loading course:', error);
        showToast('Failed to load course data', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Course delete function
function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
        return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    fetch(`http://localhost:3000/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete course');
        }
        return response.json();
    })
    .then(data => {
        showToast('Course deleted successfully', 'success');
        
        // Reload courses data if on courses section
        if (currentSection === 'courses') {
            loadSectionData('courses');
        }
    })
    .catch(error => {
        console.error('Error deleting course:', error);
        showToast('Failed to delete course', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Announcement submit handler
function handleAnnouncementSubmit(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    // Get form data
    const formData = new FormData(event.target);
    
    fetch('http://localhost:3000/api/announcements', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to post announcement');
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('createAnnouncementModal');
        
        // Show success message
        showToast('Announcement posted successfully!', 'success');
        
        // Reset form
        event.target.reset();
        
        // Reload discussions data if on discussions section
        if (currentSection === 'discussions') {
            loadSectionData('discussions');
        }
    })
    .catch(error => {
        console.error('Announcement post error:', error);
        showToast('Failed to post announcement', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Profile update handler
function handleProfileUpdate(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    // Get form data
    const formData = new FormData(event.target);
    
    fetch('http://localhost:3000/api/user/profile', {
        method: 'PUT',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast('Profile updated successfully!', 'success');
        
        // Update user display
        updateUserDisplay(data);
    })
    .catch(error => {
        console.error('Profile update error:', error);
        showToast('Failed to update profile', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Avatar upload handler
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('avatar', file);
    
    fetch('http://localhost:3000/api/user/avatar', {
        method: 'POST',
        headers: {
            'Authorization': token
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to upload avatar');
        }
        return response.json();
    })
    .then(data => {
        // Update profile image
        const profileImage = document.getElementById('profileImage');
        if (profileImage && data.avatarUrl) {
            profileImage.src = data.avatarUrl;
        }
        
        // Update sidebar profile image
        const userProfileImage = document.getElementById('userProfileImage');
        if (userProfileImage && data.avatarUrl) {
            userProfileImage.src = data.avatarUrl;
        }
        
        // Show success message
        showToast('Profile picture updated successfully!', 'success');
    })
    .catch(error => {
        console.error('Avatar upload error:', error);
        showToast('Failed to upload profile picture', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Withdrawal handler
function handleWithdrawal(event) {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    // Get form data
    const formData = new FormData(event.target);
    
    fetch('http://localhost:3000/api/earnings/withdraw', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to process withdrawal');
        }
        return response.json();
    })
    .then(data => {
        // Close modal
        closeModal('withdrawalModal');
        
        // Show success message
        showToast('Withdrawal request submitted successfully!', 'success');
        
        // Reset form
        event.target.reset();
        
        // Reload earnings data if on earnings section
        if (currentSection === 'earnings') {
            loadSectionData('earnings');
        }
    })
    .catch(error => {
        console.error('Withdrawal error:', error);
        showToast('Failed to process withdrawal', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Sign out handler
function handleSignOut() {
    // Clear token
    localStorage.removeItem('token');
    
    // Redirect to sign in page
    window.location.href = 'signin.html';
}

// UI Helper Functions
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('active');
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    const container = document.getElementById('toastContainer');
    if (container) {
        container.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => toast.remove(), 3000);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function toggleDropdown(button) {
    const dropdown = button.nextElementSibling;
    if (dropdown) {
        dropdown.classList.toggle('active');
        
        // Close other dropdowns
        document.querySelectorAll('.dropdown-content').forEach(content => {
            if (content !== dropdown) {
                content.classList.remove('active');
            }
        });
    }
}

// Function to toggle notifications dropdown
function toggleNotifications() {
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Mark all notifications as read
function markAllAsRead() {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    fetch('http://localhost:3000/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to mark notifications as read');
        }
        return response.json();
    })
    .then(data => {
        // Update notification count
        document.getElementById('notificationCount').textContent = '0';
        
        // Update notification list
        const notificationList = document.getElementById('notificationList');
        if (notificationList) {
            const notifications = notificationList.querySelectorAll('.notification-item');
            notifications.forEach(notification => {
                notification.classList.remove('unread');
                notification.classList.add('read');
            });
        }
    })
    .catch(error => {
        console.error('Error marking notifications as read:', error);
    });
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

// Format time ago (e.g., "2 hours ago")
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'N/A';
    
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return formatDate(timestamp);
}

// Reset form
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// Course Functions
function viewCourse(courseId) {
    // Redirect to course content page
    window.location.href = `course-content.html?id=${courseId}`;
}

function previewCourse(courseId) {
    // Open course preview in new tab
    window.open(`course-preview.html?id=${courseId}`, '_blank');
}

function duplicateCourse(courseId) {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    fetch(`http://localhost:3000/api/courses/${courseId}/duplicate`, {
        method: 'POST',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to duplicate course');
        }
        return response.json();
    })
    .then(data => {
        showToast('Course duplicated successfully', 'success');
        
        // Reload courses data if on courses section
        if (currentSection === 'courses') {
            loadSectionData('courses');
        }
    })
    .catch(error => {
        console.error('Error duplicating course:', error);
        showToast('Failed to duplicate course', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function archiveCourse(courseId) {
    if (!confirm('Are you sure you want to archive this course?')) {
        return;
    }
    
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    fetch(`http://localhost:3000/api/courses/${courseId}/archive`, {
        method: 'PUT',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to archive course');
        }
        return response.json();
    })
    .then(data => {
        showToast('Course archived successfully', 'success');
        
        // Reload courses data if on courses section
        if (currentSection === 'courses') {
            loadSectionData('courses');
        }
    })
    .catch(error => {
        console.error('Error archiving course:', error);
        showToast('Failed to archive course', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Student Functions
function viewStudentProgress(studentId) {
    // Redirect to student progress page
    window.location.href = `student-progress.html?id=${studentId}`;
}

function sendMessage(studentId) {
    // Open message modal
    openModal('messageModal');
    
    // Set student ID in hidden field
    const studentIdField = document.getElementById('messageStudentId');
    if (studentIdField) {
        studentIdField.value = studentId;
    }
}

function viewAssignments(studentId) {
    // Redirect to student assignments page
    window.location.href = `student-assignments.html?id=${studentId}`;
}

function downloadReport(studentId) {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    showLoading();
    
    fetch(`http://localhost:3000/api/students/${studentId}/report`, {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to generate report');
        }
        return response.blob();
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `student-report-${studentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        
        showToast('Report downloaded successfully', 'success');
    })
    .catch(error => {
        console.error('Error downloading report:', error);
        showToast('Failed to download report', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Assignment Functions
function updateAssignmentsList(assignments) {
    const assignmentsGrid = document.getElementById('assignmentsGrid');
    if (!assignmentsGrid) return;
    
    if (!assignments || Object.keys(assignments).length === 0) {
        assignmentsGrid.innerHTML = `
            <div class="empty-state">
                <h3>No Assignments Yet</h3>
                <p>Create your first assignment</p>
                <button class="btn-primary" onclick="openModal('createAssignmentModal')">
                    Create Assignment
                </button>
            </div>
        `;
        return;
    }

    assignmentsGrid.innerHTML = Object.entries(assignments)
        .map(([id, assignment]) => createAssignmentCard(id, assignment))
        .join('');
}

function createAssignmentCard(id, assignment) {
    return `
        <div class="assignment-card" 
             data-id="${id}" 
             data-status="${assignment.status}" 
             data-type="${assignment.type}">
            <div class="assignment-header">
                <span class="assignment-type ${assignment.type}">${assignment.type}</span>
                <div class="assignment-actions">
                    <button class="icon-btn" onclick="editAssignment('${id}')">✏️</button>
                    <button class="icon-btn" onclick="toggleDropdown(this)">⋮</button>
                    <div class="dropdown-content">
                        <a href="#" onclick="duplicateAssignment('${id}'); return false;">Duplicate</a>
                        <a href="#" onclick="previewAssignment('${id}'); return false;">Preview</a>
                        <a href="#" onclick="archiveAssignment('${id}'); return false;" 
                           class="text-warning">Archive</a>
                        <a href="#" onclick="deleteAssignment('${id}'); return false;" 
                           class="text-danger">Delete</a>
                    </div>
                </div>
            </div>
            <h3 class="assignment-title">${assignment.title}</h3>
            <div class="assignment-meta">
                <span class="course-name">${assignment.courseName}</span>
                <span class="points">${assignment.points} points</span>
            </div>
            <div class="assignment-dates">
                <div class="date-item">
                    <span class="date-label">Due Date</span>
                    <span class="date-value">${formatDate(assignment.dueDate)}</span>
                </div>
                <div class="date-item">
                    <span class="date-label">Published</span>
                    <span class="date-value">${formatDate(assignment.publishDate)}</span>
                </div>
            </div>
            <div class="submission-stats">
                <div class="stat-item">
                    <span class="stat-value">${assignment.submittedCount}/${assignment.totalStudents}</span>
                    <span class="stat-label">Submitted</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${assignment.gradedCount}</span>
                    <span class="stat-label">Graded</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${assignment.averageScore}%</span>
                    <span class="stat-label">Avg. Score</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn" onclick="gradeAssignments('${id}')">
                    Grade Submissions
                </button>
                <button class="action-btn" onclick="viewAssignmentDetails('${id}')">
                    View Details
                </button>
            </div>
        </div>
    `;
}

function gradeAssignments(assignmentId) {
    // Redirect to grade submissions page
    window.location.href = `grade-submissions.html?id=${assignmentId}`;
}

function viewAssignmentDetails(assignmentId) {
    // Redirect to assignment details page
    window.location.href = `assignment-details.html?id=${assignmentId}`;
}

// Analytics Functions
function updateAnalytics(data) {
    // Update analytics overview
    updateAnalyticsOverview(data.overview || {});
    
    // Update course performance
    updateCoursePerformance(data.coursePerformance || {});
    
    // Update engagement metrics
    updateEngagementMetrics(data.engagement || {});
}

function updateAnalyticsOverview(overview) {
    const analyticsOverview = document.getElementById('analyticsOverview');
    if (!analyticsOverview) return;
    
    analyticsOverview.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <h3>Total Revenue</h3>
                <span class="trend ${overview.revenueTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.revenueTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.revenueTrend || 0)}%
                </span>
            </div>
            <div class="stat-value">${formatCurrency(overview.totalRevenue || 0)}</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <h3>Active Students</h3>
                <span class="trend ${overview.studentsTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.studentsTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.studentsTrend || 0)}%
                </span>
            </div>
            <div class="stat-value">${overview.activeStudents || 0}</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <h3>Course Completion</h3>
                <span class="trend ${overview.completionTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.completionTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.completionTrend || 0)}%
                </span>
            </div>
            <div class="stat-value">${overview.completionRate || 0}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-header">
                <h3>Average Rating</h3>
                <span class="trend ${overview.ratingTrend >= 0 ? 'positive' : 'negative'}">
                    ${overview.ratingTrend >= 0 ? '↑' : '↓'} ${Math.abs(overview.ratingTrend || 0)}%
                </span>
            </div>
            <div class="stat-value">${(overview.averageRating || 0).toFixed(1)}</div>
        </div>
    `;
}

function updateCoursePerformance(performance) {
    const coursePerformanceList = document.getElementById('coursePerformanceList');
    if (!coursePerformanceList) return;
    
    if (!performance || Object.keys(performance).length === 0) {
        coursePerformanceList.innerHTML = '<div class="empty-state">No performance data available</div>';
        return;
    }

    coursePerformanceList.innerHTML = Object.entries(performance)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([id, course]) => `
            <div class="performance-item">
                <div class="course-info">
                    <div class="course-name">${course.title}</div>
                    <div class="course-meta">
                        <span>${course.enrollments} Students</span>
                        <span>|</span>
                        <span>${course.completionRate}% Completion</span>
                    </div>
                </div>
                <div class="revenue-bar">
                    <div class="revenue-fill" style="width: ${course.revenuePercentage}%"></div>
                </div>
                <div class="revenue-value">${formatCurrency(course.revenue)}</div>
            </div>
        `).join('');
}

function updateEngagementMetrics(engagement) {
    const engagementStats = document.getElementById('engagementStatsList');
    if (!engagementStats) return;
    
    if (!engagement || Object.keys(engagement).length === 0) {
        engagementStats.innerHTML = '<div class="empty-state">No engagement data available</div>';
        return;
    }

    engagementStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-value">${engagement.activeUsers || 0}</span>
            <span class="stat-label">Active Users</span>
            <span class="stat-trend ${engagement.activeUsersTrend >= 0 ? 'positive' : 'negative'}">
                ${engagement.activeUsersTrend >= 0 ? '↑' : '↓'} ${Math.abs(engagement.activeUsersTrend || 0)}%
            </span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${engagement.averageSessionTime || '0m'}</span>
            <span class="stat-label">Avg. Session Time</span>
            <span class="stat-trend ${engagement.sessionTimeTrend >= 0 ? 'positive' : 'negative'}">
                ${engagement.sessionTimeTrend >= 0 ? '↑' : '↓'} ${Math.abs(engagement.sessionTimeTrend || 0)}%
            </span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${engagement.completionRate || 0}%</span>
            <span class="stat-label">Course Completion</span>
            <span class="stat-trend ${engagement.completionTrend >= 0 ? 'positive' : 'negative'}">
                ${engagement.completionTrend >= 0 ? '↑' : '↓'} ${Math.abs(engagement.completionTrend || 0)}%
            </span>
        </div>
    `;
}

// Discussions Functions
function updateDiscussionsList(discussions) {
    // Update pinned topics
    const pinnedTopicsList = document.getElementById('pinnedTopicsList');
    if (!pinnedTopicsList) return;
    
    const pinnedTopics = Object.entries(discussions || {})
        .filter(([_, discussion]) => discussion.pinned);
    
    if (pinnedTopics.length === 0) {
        pinnedTopicsList.innerHTML = '<div class="empty-state">No pinned topics</div>';
    } else {
        pinnedTopicsList.innerHTML = pinnedTopics
            .map(([id, discussion]) => createDiscussionCard(id, discussion, true))
            .join('');
    }

    // Update recent discussions
    const recentDiscussionsList = document.getElementById('recentDiscussionsList');
    if (!recentDiscussionsList) return;
    
    const recentDiscussions = Object.entries(discussions || {})
        .filter(([_, discussion]) => !discussion.pinned)
        .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));
    
    if (recentDiscussions.length === 0) {
        recentDiscussionsList.innerHTML = '<div class="empty-state">No recent discussions</div>';
    } else {
        recentDiscussionsList.innerHTML = recentDiscussions
            .map(([id, discussion]) => createDiscussionCard(id, discussion, false))
            .join('');
    }
}

function createDiscussionCard(id, discussion, isPinned) {
    return `
        <div class="discussion-card ${isPinned ? 'pinned' : ''}" data-id="${id}">
            <div class="discussion-header">
                <div class="discussion-meta">
                    <span class="discussion-type ${discussion.type}">${discussion.type}</span>
                    <span class="discussion-course">${discussion.courseName}</span>
                    <span class="discussion-date">${formatTimeAgo(discussion.timestamp)}</span>
                </div>
                <div class="discussion-actions">
                    <button class="icon-btn ${discussion.pinned ? 'active' : ''}" 
                            onclick="togglePinned('${id}', ${!discussion.pinned})">
                        📌
                    </button>
                    <button class="icon-btn" onclick="toggleDropdown(this)">⋮</button>
                    <div class="dropdown-content">
                        <a href="#" onclick="editDiscussion('${id}'); return false;">Edit</a>
                        <a href="#" onclick="deleteDiscussion('${id}'); return false;" 
                           class="text-danger">Delete</a>
                    </div>
                </div>
            </div>
            <h3 class="discussion-title">${discussion.title}</h3>
            <p class="discussion-preview">${discussion.preview}</p>
            <div class="discussion-stats">
                <span class="views">${discussion.views} views</span>
                <span class="replies">${discussion.replies} replies</span>
                <span class="last-reply">Last reply: ${formatTimeAgo(discussion.lastReplyTime)}</span>
            </div>
            <div class="card-actions">
                <button class="action-btn" onclick="viewDiscussion('${id}')">
                    View Discussion
                </button>
            </div>
        </div>
    `;
}

// Earnings Functions
function updateEarningsDisplay(earnings) {
    // Update total earnings
    updateUI('totalEarnings', formatCurrency(earnings.total || 0));

    // Update earnings trend
    const trendElement = document.getElementById('earningsTrend');
    if (trendElement) {
        const trend = earnings.trend || 0;
        trendElement.innerHTML = `
            <span class="trend-icon">${trend >= 0 ? '↑' : '↓'}</span>
            <span class="trend-value">${Math.abs(trend)}%</span>
            <span class="trend-label">vs last period</span>
        `;
        trendElement.className = `earnings-trend ${trend >= 0 ? 'positive' : 'negative'}`;
    }

    // Update pending payout
    updateUI('pendingPayout', formatCurrency(earnings.pending || 0));
    updateUI('payoutDate', `Next payout: ${formatDate(earnings.nextPayoutDate)}`);

    // Update course revenue list
    updateCourseRevenueList(earnings.courseRevenue || {});
}

function updateCourseRevenueList(courseRevenue) {
    const revenueList = document.getElementById('courseRevenueList');
    if (!revenueList) return;
    
    if (!courseRevenue || Object.keys(courseRevenue).length === 0) {
        revenueList.innerHTML = '<div class="empty-state">No revenue data available</div>';
        return;
    }

    revenueList.innerHTML = Object.entries(courseRevenue)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .map(([id, data]) => `
            <div class="course-revenue-item">
                <div class="course-info">
                    <div class="course-name">${data.title}</div>
                    <div class="course-stats">
                        <span>${data.students} Students</span>
                        <span>•</span>
                        <span>${data.rating} ★</span>
                    </div>
                </div>
                <div class="revenue-info">
                    <div class="revenue-amount">${formatCurrency(data.revenue)}</div>
                    <div class="revenue-trend ${data.trend >= 0 ? 'positive' : 'negative'}">
                        ${data.trend >= 0 ? '+' : ''}${data.trend}%
                    </div>
                </div>
            </div>
        `).join('');
}

// Initialize charts
function initializeCharts() {
    // Revenue Chart (placeholder)
    const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (revenueCtx) {
        // This is just a placeholder - real chart would be implemented with actual data
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [1200, 1900, 3000, 5000, 2000, 3000],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Engagement Chart (placeholder)
    const engagementCtx = document.getElementById('engagementChart')?.getContext('2d');
    if (engagementCtx) {
        // This is just a placeholder - real chart would be implemented with actual data
        new Chart(engagementCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Active Users',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Earnings Chart (placeholder)
    const earningsCtx = document.getElementById('earningsChart')?.getContext('2d');
    if (earningsCtx) {
        // This is just a placeholder - real chart would be implemented with actual data
        new Chart(earningsCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [1200, 1900, 3000, 5000, 2000, 3000],
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}








// Notification Functions
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.classList.toggle('show');
}

function markAllAsRead() {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    unreadNotifications.forEach(item => {
        item.classList.remove('unread');
    });
    
    // Update notification count
    updateNotificationCount();
    
    // Send request to server to mark all as read
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        }
    })
    .catch(error => {
        console.error('Error marking notifications as read:', error);
    });
}

function markAsRead(button) {
    const notificationItem = button.closest('.notification-item');
    notificationItem.classList.remove('unread');
    
    // Update notification count
    updateNotificationCount();
    
    // In a real app, you would also send a request to the server
    // to mark this specific notification as read
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.getElementById('notificationCount');
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function viewAllNotifications() {
    // Navigate to notifications settings
    switchSettingsTab('notifications');
    switchSection('settings');
    
    // Hide dropdown
    document.getElementById('notificationDropdown').classList.remove('show');
}

// Profile Picture Functions
function openProfilePictureModal() {
    // Get current profile image
    const currentImage = document.getElementById('profileImage').src;
    
    // Set preview image
    document.getElementById('profilePicturePreview').src = currentImage;
    
    // Show modal
    openModal('profilePictureModal');
}

function previewProfilePicture(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showToast('Image size should not exceed 2MB', 'error');
        return;
    }
    
    // Validate file type
    if (!file.type.match('image.*')) {
        showToast('Please select an image file', 'error');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('profilePicturePreview').src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Enable save button
    document.getElementById('saveProfilePicture').disabled = false;
}

function saveProfilePicture() {
    const fileInput = document.getElementById('profilePictureInput');
    if (!fileInput.files || !fileInput.files[0]) {
        closeModal('profilePictureModal');
        return;
    }
    
    const file = fileInput.files[0];
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    
    showLoading();
    
    fetch('http://localhost:3000/api/user/avatar', {
        method: 'POST',
        headers: {
            'Authorization': token
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to upload avatar');
        }
        return response.json();
    })
    .then(data => {
        // Update profile images
        const avatarUrl = data.avatarUrl;
        document.getElementById('profileImage').src = avatarUrl;
        document.getElementById('userProfileImage').src = avatarUrl;
        
        // Close modal
        closeModal('profilePictureModal');
        
        // Show success message
        showToast('Profile picture updated successfully!', 'success');
    })
    .catch(error => {
        console.error('Avatar upload error:', error);
        showToast('Failed to update profile picture', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Settings Form Handlers
function handleSecurityUpdate(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate password match
    if (newPassword && newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    // Validate current password is provided if setting new password
    if (newPassword && !currentPassword) {
        showToast('Please enter your current password', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(event.target);
    const securityData = Object.fromEntries(formData);
    
    // Send to server
    const token = localStorage.getItem('token');
    
    showLoading();
    
    fetch('http://localhost:3000/api/user/security', {
        method: 'PUT',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(securityData)
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Current password is incorrect');
            }
            throw new Error('Failed to update security settings');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast('Security settings updated successfully!', 'success');
        
        // Reset form
        resetForm('securityForm');
    })
    .catch(error => {
        console.error('Security update error:', error);
        showToast(error.message, 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function handleNotificationsUpdate(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const notificationData = Object.fromEntries(formData);
    
    // Send to server
    const token = localStorage.getItem('token');
    
    showLoading();
    
    fetch('http://localhost:3000/api/user/notifications', {
        method: 'PUT',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update notification settings');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast('Notification settings updated successfully!', 'success');
    })
    .catch(error => {
        console.error('Notification settings update error:', error);
        showToast('Failed to update notification settings', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

function handlePaymentUpdate(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const paymentData = Object.fromEntries(formData);
    
    // Send to server
    const token = localStorage.getItem('token');
    
    showLoading();
    
    fetch('http://localhost:3000/api/user/payment', {
        method: 'PUT',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to update payment settings');
        }
        return response.json();
    })
    .then(data => {
        // Show success message
        showToast('Payment settings updated successfully!', 'success');
    })
    .catch(error => {
        console.error('Payment settings update error:', error);
        showToast('Failed to update payment settings', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// Toggle payment sections based on selected method
function togglePaymentSections() {
    const bankRadio = document.getElementById('bankTransfer');
    const paypalRadio = document.getElementById('paypal');
    const bankSection = document.getElementById('bankDetailsSection');
    const paypalSection = document.getElementById('paypalDetailsSection');
    
    if (bankRadio && paypalRadio && bankSection && paypalSection) {
        // Setup listeners
        bankRadio.addEventListener('change', function() {
            if (this.checked) {
                bankSection.style.display = 'block';
                paypalSection.style.display = 'none';
            }
        });
        
        paypalRadio.addEventListener('change', function() {
            if (this.checked) {
                bankSection.style.display = 'none';
                paypalSection.style.display = 'block';
            }
        });
        
        // Initial state
        if (bankRadio.checked) {
            bankSection.style.display = 'block';
            paypalSection.style.display = 'none';
        } else if (paypalRadio.checked) {
            bankSection.style.display = 'none';
            paypalSection.style.display = 'block';
        }
    }
}

// Initialize notifications
function initializeNotifications() {
    // Update notification count on page load
    updateNotificationCount();
    
    // Close notification dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('notificationDropdown');
        const bell = document.querySelector('.notification-bell');
        
        if (dropdown.classList.contains('show') && 
            !dropdown.contains(event.target) && 
            !bell.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    });
    
    // Load notifications from server
    fetchNotifications();
}

// Fetch notifications from server
function fetchNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('http://localhost:3000/api/notifications', {
        method: 'GET',
        headers: {
            'Authorization': token
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch notifications');
        }
        return response.json();
    })
    .then(data => {
        // Update notification list
        updateNotificationList(data.notifications || []);
    })
    .catch(error => {
        console.error('Error fetching notifications:', error);
    });
}

// Update notification list in UI
function updateNotificationList(notifications) {
    const notificationList = document.getElementById('notificationList');
    
    // If we couldn't fetch notifications, keep the demo ones
    if (!notifications || notifications.length === 0) {
        return;
    }
    
    // Clear existing notifications
    notificationList.innerHTML = '';
    
    // Add notifications
    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;
        
        notificationItem.innerHTML = `
            <div class="notification-icon ${notification.type || 'default'}">
                ${getNotificationIcon(notification.type)}
            </div>
            <div class="notification-content">
                <div class="notification-text">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                </div>
                <span class="notification-time">${formatTimeAgo(notification.timestamp)}</span>
            </div>
            <button class="mark-read" onclick="markAsRead(this)">✓</button>
        `;
        
        notificationList.appendChild(notificationItem);
    });
    
    // Update notification count
    updateNotificationCount();
}

// Get appropriate icon for notification type
function getNotificationIcon(type) {
    switch (type) {
        case 'enrollment':
            return '👥';
        case 'submission':
            return '📝';
        case 'review':
            return '⭐';
        case 'earnings':
            return '💰';
        case 'discussion':
            return '💬';
        default:
            return '🔔';
    }
}

// Initialize settings panel interactions
function initializeSettings() {
    // Set up payment method toggle
    togglePaymentSections();
    
    // Add click event to profile picture to open upload modal
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.addEventListener('click', openProfilePictureModal);
    }
    
    // Also add click to change avatar button
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openProfilePictureModal();
        });
    }
}

// Document ready function to initialize everything
document.addEventListener('DOMContentLoaded', function() {
    // Add these to your existing initialization

    console.log("Setting up profile and notification features...");
    
    // Setup all components
    setupProfilePictureUpload();
    setupNotifications();
    setupSettingsPanels();
    initializeNotifications();
    
    // Initialize settings when switching to settings tab
    document.querySelector('[href="#settings"]')?.addEventListener('click', function() {
        setTimeout(initializeSettings, 100);
    });
    
    // Add this to your existing event listeners setup
    document.querySelectorAll('.settings-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = link.getAttribute('href').substring(1);
            switchSettingsTab(tabId);
        });
    });

    loadProfileImageFromStorage();

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


