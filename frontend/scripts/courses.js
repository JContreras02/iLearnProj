// courses.js - This will handle the course catalog functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token') !== null;
    updateAuthButtons(isLoggedIn);
    
    // Fetch courses from API
    fetchCourses();
  
    // Add event listener for search button
    document.querySelector('.search-btn').addEventListener('click', searchCourses);
    
    // Add event listeners for filters
    const checkboxes = document.querySelectorAll('.filter-option input');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', filterCourses);
    });
    
    // Add event listener for sort select
    document.querySelector('.sort-select').addEventListener('change', sortCourses);
  });
  
  function updateAuthButtons(isLoggedIn) {
    const authButtons = document.querySelector('.auth-buttons');
    
    if (isLoggedIn) {
      // Get user info from token
      const userRole = getUserRole();
      
      if (userRole === 'instructor') {
        // Show instructor-specific buttons
        authButtons.innerHTML = `
          <a href="instructor.html" class="btn btn-login">Instructor Dashboard</a>
          <a href="#" class="btn btn-signup" onclick="logout()">Logout</a>
        `;
      } else {
        // Show student-specific buttons
        authButtons.innerHTML = `
          <a href="student.html" class="btn btn-login">My Courses</a>
          <a href="#" class="btn btn-signup" onclick="logout()">Logout</a>
        `;
      }
    } else {
      // Show default login/signup buttons
      authButtons.innerHTML = `
        <a href="signin.html" class="btn btn-login">Login</a>
        <a href="signup.html" class="btn btn-signup">Signup</a>
      `;
    }
  }
  
  function getUserRole() {
    // In a real app, you would decode the JWT token
    // For now, we'll check localStorage for a role
    return localStorage.getItem('userRole') || 'student';
  }
  
  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
  }
  
  async function fetchCourses() {
    try {
      // Show loading state
      const coursesGrid = document.querySelector('.courses-grid');
      coursesGrid.innerHTML = '<div class="loading">Loading courses...</div>';
      
      // In a real app, fetch from your API
      let courses;
      
      try {
        // Try to fetch from the actual API
        const response = await fetch('http://localhost:3000/api/courses');
        if (response.ok) {
          const data = await response.json();
          courses = data.courses;
        } else {
          throw new Error('API error');
        }
      } catch (error) {
        console.warn('Falling back to mock data', error);
        // Fall back to mock data if API call fails
        courses = getMockCourses();
      }
      
      // Update courses counter
      document.querySelector('.courses-count').textContent = `Showing ${Object.keys(courses).length} courses`;
      
      // Clear loading state
      coursesGrid.innerHTML = '';
      
      // Add courses to grid
      Object.entries(courses).forEach(([id, course]) => {
        const courseCard = createCourseCard(id, course);
        coursesGrid.appendChild(courseCard);
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      document.querySelector('.courses-grid').innerHTML = '<div class="error">Error loading courses. Please try again later.</div>';
    }
  }
  
  function createCourseCard(id, course) {
    const courseElement = document.createElement('div');
  courseElement.className = 'course-card';
  courseElement.setAttribute('data-id', id);
    
    courseElement.innerHTML = `
    <img src="${course.thumbnail || '/api/placeholder/400/200'}" alt="${course.title}" class="course-image">
    <div class="course-info">
      <span class="course-category">${course.category || 'General'}</span>
      <h3 class="course-title">${course.title}</h3>
      <p class="course-description">${course.description || 'No description available.'}</p>
      <div class="course-meta">
        <div class="course-rating">★ ${course.rating || '0.0'} (${course.reviews || '0'} reviews)</div>
        <div class="course-price">${course.price ? '$' + course.price : 'Free'}</div>
      </div>
    </div>
    <button class="enroll-btn" data-id="${id}">Enroll Now</button>
  `;
    const enrollBtn = courseElement.querySelector('.enroll-btn');
    enrollBtn.addEventListener('click', function() {
      enrollCourse(id, course.title);
    });

    return courseElement;
  }



  // Function to check if a student is already enrolled in a course
  function isAlreadyEnrolled(courseId) {
    const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses')) || [];
    return enrolledCourses.some(course => course.id === courseId);
  }

// Function to update enroll buttons on course catalog page
function updateEnrollButtons() {
  // Get all enroll buttons
  const enrollButtons = document.querySelectorAll('.enroll-btn');
  
  // Update each button
  enrollButtons.forEach(button => {
    // Get course ID from the button's onclick attribute
    const onclickAttr = button.getAttribute('onclick') || '';
    const courseIdMatch = onclickAttr.match(/enrollCourse\(['"]([^'"]+)['"]/);
    
    if (courseIdMatch && courseIdMatch[1]) {
      const courseId = courseIdMatch[1];
      
      // Check if already enrolled
      if (isAlreadyEnrolled(courseId)) {
        // Disable the button
        button.disabled = true;
        button.classList.add('enrolled');
        button.textContent = 'Already Enrolled';
      }
    }
  });
}
  
// Modify the enrollCourse function to update buttons after enrollment
function enrollCourse(courseId, courseTitle) {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Save intended course enrollment for after login
    localStorage.setItem('enrollAfterLogin', JSON.stringify({ id: courseId, title: courseTitle }));
    
    // Redirect to login page
    alert('Please log in to enroll in courses');
    window.location.href = 'signin.html?redirect=courses.html';
    return;
  }
  
  // Check if already enrolled
  if (isAlreadyEnrolled(courseId)) {
    alert(`You are already enrolled in: ${courseTitle}`);
    return;
  }
  
  // User is logged in, proceed with enrollment
  enrollUserInCourse(courseId, courseTitle);
}


  
  // Function to handle actual enrollment process
async function enrollUserInCourse(courseId, courseTitle) {
  try {
    // Try API enrollment first
    let success = false;
    let apiError = null;
    
    try {
      const response = await fetch('http://localhost:3000/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ courseId })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("API enrollment successful:", data);
        success = true;
      } else {
        apiError = await response.text();
        console.warn("API enrollment failed:", apiError);
      }
    } catch (error) {
      apiError = error.message;
      console.warn("API request failed:", error);
    }
    
    // If API failed, fall back to localStorage
    if (!success) {
      console.log("Falling back to localStorage enrollment due to API failure:", apiError);
      
      // Already checked for enrollment earlier, so just add to enrolledCourses
      let enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses')) || [];
      
      // Add to enrolled courses
      enrolledCourses.push({ 
        id: courseId, 
        title: courseTitle,
        status: 'active',
        enrollDate: new Date().toISOString(),
        progress: 0
      });
      
      localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
      console.log("Course saved to localStorage:", courseId, courseTitle);
      success = true;
    }
    
    if (success) {
      // Update dashboard stats if available
      if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
      }
      
      // Update enroll buttons if available
      if (typeof updateEnrollButtons === 'function') {
        updateEnrollButtons();
      }
      
      alert(`Successfully enrolled in: ${courseTitle}`);
      window.location.href = 'student.html';
    }
  } catch (error) {
    console.error('Unexpected enrollment error:', error);
    
    // Last resort fallback - directly save to localStorage
    try {
      let enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses')) || [];
      
      if (!enrolledCourses.some(course => course.id === courseId)) {
        enrolledCourses.push({ 
          id: courseId, 
          title: courseTitle,
          status: 'active',
          enrollDate: new Date().toISOString(),
          progress: 0
        });
        
        localStorage.setItem('enrolledCourses', JSON.stringify(enrolledCourses));
        alert(`Successfully enrolled in: ${courseTitle}`);
        window.location.href = 'student.html';
      } else {
        alert(`You are already enrolled in: ${courseTitle}`);
      }
    } catch (localStorageError) {
      console.error('Failed to save to localStorage:', localStorageError);
      alert('Unable to enroll. Please try again later.');
    }
  }
}
  
  function getUserIdFromToken() {
    // In a real app, decode the JWT token to get user ID
    // For now, return a placeholder
    return 'current-user';
  }
  
  function searchCourses() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const courseCards = document.querySelectorAll('.course-card');
    
    let visibleCount = 0;
    
    courseCards.forEach(card => {
      const title = card.querySelector('.course-title').textContent.toLowerCase();
      const description = card.querySelector('.course-description').textContent.toLowerCase();
      const category = card.querySelector('.course-category').textContent.toLowerCase();
      
      if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Update counter
    document.querySelector('.courses-count').textContent = `Showing ${visibleCount} courses`;
  }
  
  function filterCourses() {
    // Get all selected filters
    const selectedCategories = getSelectedFilters('category');
    const selectedLevels = getSelectedFilters('level');
    const selectedPrices = Array.from(document.querySelectorAll('input[id="free"], input[id="paid"]'))
      .filter(input => input.checked)
      .map(input => input.id);
    
    const courseCards = document.querySelectorAll('.course-card');
    let visibleCount = 0;
    
    courseCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const level = card.getAttribute('data-level');
      const price = parseFloat(card.getAttribute('data-price')) > 0 ? 'paid' : 'free';
      
      // Check if the card passes all filters
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(category);
      const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(level);
      const priceMatch = selectedPrices.length === 0 || selectedPrices.includes(price);
      
      if (categoryMatch && levelMatch && priceMatch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    // Update counter
    document.querySelector('.courses-count').textContent = `Showing ${visibleCount} courses`;
  }
  
  function getSelectedFilters(filterType) {
    let filterMap = {
      'category': {
        'web-dev': 'Web Development',
        'data-science': 'Data Science',
        'design': 'Design',
        'business': 'Business'
      },
      'level': {
        'beginner': 'Beginner',
        'intermediate': 'Intermediate',
        'advanced': 'Advanced'
      }
    };
    
    const filterIds = Object.keys(filterMap[filterType]);
    return filterIds
      .filter(id => document.getElementById(id)?.checked)
      .map(id => filterMap[filterType][id]);
  }
  
  function sortCourses() {
    const sortBy = document.querySelector('.sort-select').value;
    const coursesGrid = document.querySelector('.courses-grid');
    const courseCards = Array.from(document.querySelectorAll('.course-card'));
    
    // Sort based on selected option
    courseCards.sort((a, b) => {
      if (sortBy === 'price-low') {
        return parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price'));
      } else if (sortBy === 'price-high') {
        return parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price'));
      } else if (sortBy === 'newest') {
        // Assuming newer courses have higher IDs (in a real app, you'd sort by date)
        return b.getAttribute('data-id').localeCompare(a.getAttribute('data-id'));
      } else { // popular (default)
        // Sort by rating (in a real app, you'd have a popularity metric)
        const aRating = parseFloat(a.querySelector('.course-rating').textContent.split(' ')[1]);
        const bRating = parseFloat(b.querySelector('.course-rating').textContent.split(' ')[1]);
        return bRating - aRating;
      }
    });
    
    // Clear and re-append in sorted order
    coursesGrid.innerHTML = '';
    courseCards.forEach(card => coursesGrid.appendChild(card));
  }
  
  // Mock data for testing when API is not available
  function getMockCourses() {
    return {
      "c1": {
        title: "Complete Web Development Bootcamp",
        description: "Learn web development from scratch with HTML, CSS, JavaScript, React, and Node.js.",
        category: "Web Development",
        level: "Beginner",
        price: 89.99,
        rating: 4.8,
        reviews: 2100,
        thumbnail: "/api/placeholder/400/200"
      },
      "c2": {
        title: "Python for Data Analysis",
        description: "Master data analysis with Python, Pandas, NumPy, and Matplotlib.",
        category: "Data Science",
        level: "Intermediate",
        price: 79.99,
        rating: 4.9,
        reviews: 1800,
        thumbnail: "/api/placeholder/400/200"
      },
      "c3": {
        title: "UI/UX Design Fundamentals",
        description: "Learn the principles of user interface and user experience design.",
        category: "Design",
        level: "Beginner",
        price: 69.99,
        rating: 4.7,
        reviews: 1500,
        thumbnail: "/api/placeholder/400/200"
      },
      "c4": {
        title: "JavaScript for Beginners",
        description: "Start your programming journey with JavaScript, the language of the web.",
        category: "Web Development",
        level: "Beginner",
        price: 49.99,
        rating: 4.6,
        reviews: 1200,
        thumbnail: "/api/placeholder/400/200"
      },
      "c5": {
        title: "Advanced React Techniques",
        description: "Take your React skills to the next level with advanced patterns and performance optimization.",
        category: "Web Development",
        level: "Advanced",
        price: 99.99,
        rating: 4.9,
        reviews: 950,
        thumbnail: "/api/placeholder/400/200"
      },
      "c6": {
        title: "Introduction to Machine Learning",
        description: "Understand the fundamentals of machine learning algorithms and applications.",
        category: "Data Science",
        level: "Intermediate",
        price: 89.99,
        rating: 4.8,
        reviews: 1400,
        thumbnail: "/api/placeholder/400/200"
      }
    };
  }

  

  // Add this to your courses.js file or include it in a script tag in courses.html

document.addEventListener('DOMContentLoaded', function() {
  // Update all enrollment buttons on page load
  updateEnrollButtons();
  
  // Also add event listener for any dynamic course loading
  document.addEventListener('coursesLoaded', updateEnrollButtons);
});

// Function to check if a user is already enrolled in a course
function isAlreadyEnrolled(courseId) {
  // Get enrolled courses from localStorage
  const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses')) || [];
  
  // Check if the course exists in enrolled courses
  return enrolledCourses.some(course => course.id === courseId);
}

// Function to update all enrollment buttons
function updateEnrollButtons() {
  console.log("Updating enrollment buttons...");
  
  // Get all enrollment buttons
  const enrollButtons = document.querySelectorAll('.enroll-btn');
  console.log(`Found ${enrollButtons.length} enrollment buttons`);
  
  // Update each button
  enrollButtons.forEach(button => {
    // There are two ways the courseId might be stored:
    
    // 1. From onclick attribute
    const onclickAttr = button.getAttribute('onclick') || '';
    const courseIdMatch = onclickAttr.match(/enrollCourse\(['"]([^'"]+)['"]/);
    
    // 2. From data-id attribute
    const dataId = button.getAttribute('data-id');
    
    // Get the courseId from either source
    const courseId = dataId || (courseIdMatch && courseIdMatch[1]);
    
    if (courseId) {
      // Check if already enrolled
      if (isAlreadyEnrolled(courseId)) {
        console.log(`User is already enrolled in course: ${courseId}`);
        
        // Disable the button
        button.disabled = true;
        button.classList.add('enrolled');
        button.textContent = 'Already Enrolled';
        
        // Remove onclick attribute to prevent enrollment attempts
        button.removeAttribute('onclick');
        
        // Add a new click handler that shows an alert
        button.addEventListener('click', function(e) {
          e.preventDefault();
          alert('You are already enrolled in this course. Go to My Courses to access it.');
        });
      } else {
        console.log(`User is not enrolled in course: ${courseId}`);
      }
    } else {
      console.warn("Could not determine course ID for button:", button);
    }
  });
}

// Add CSS for enrolled button styling
function addEnrolledButtonStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .enroll-btn.enrolled {
      background: #94a3b8;
      color: white;
      cursor: not-allowed;
      opacity: 0.7;
    }
    
    .enroll-btn.enrolled:hover {
      background: #94a3b8;
      transform: none;
      box-shadow: none;
    }
  `;
  document.head.appendChild(style);
}

// Call this function on page load
addEnrolledButtonStyles();





