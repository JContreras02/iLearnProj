require('dotenv').config();
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");


const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the "frontend" folder
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/instructor.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/instructor.html"));
});

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
    req.userId = decoded.userId; // Attach userId to the request
    req.userRole = decoded.role; // Attach role to the request
    next();
  });
}

// Middleware to check if user is instructor
function isInstructor(req, res, next) {
  if (req.userRole !== 'instructor') {
    return res.status(403).json({ error: "Access denied: Not an instructor" });
  }
  next();
}

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Signup Endpoint
app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate input
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Check if user already exists
  const checkUserQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkUserQuery, [email], (err, results) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Insert new user into the database
    const insertUserQuery =
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
    db.query(
      insertUserQuery,
      [name, email, hashedPassword, role],
      (err, results) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.status(201).json({ message: "User registered successfully" });
      }
    );
  });
});

// Login Endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Check if user exists
  const getUserQuery = "SELECT * FROM users WHERE email = ?";
  db.query(getUserQuery, [email], async (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = results[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // Return the token and user data
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });
});

// Fetch user data
app.get("/api/user", verifyToken, (req, res) => {
  const userId = req.userId;

  // Fetch user data from the database
  const getUserQuery = "SELECT id, name, email, role, phone, bio FROM users WHERE id = ?";

  db.query(getUserQuery, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user data:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return user data
    res.status(200).json(results[0]);
  });
});

// Update user profile
app.put("/api/user/profile", verifyToken, async (req, res) => {
  const userId = req.userId;
  const { name, phone, bio } = req.body;

  // Validate input
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  // Update user profile
  const updateProfileQuery = "UPDATE users SET name = ?, phone = ?, bio = ? WHERE id = ?";
  
  db.query(updateProfileQuery, [name, phone || null, bio || null, userId], (err, result) => {
    if (err) {
      console.error("Error updating profile:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch updated user data
    db.query("SELECT id, name, email, role, phone, bio FROM users WHERE id = ?", [userId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      res.status(200).json(results[0]);
    });
  });
});

// STUDENT API ENDPOINTS

// Get student dashboard data
app.get("/api/student/dashboard", verifyToken, (req, res) => {
  const userId = req.userId;

  // Fetch user data from the database
  const getUserQuery = `
    SELECT 
      u.name, u.email, 
      c.course_id AS courseId, c.name AS courseName, c.status AS courseStatus, c.progress, 
      a.assignment_id AS assignmentId, a.title AS assignmentTitle, a.status AS assignmentStatus, a.due_date AS dueDate, a.points,
      g.course_id AS gradeCourseId, g.final_grade AS finalGrade, g.breakdown,
      e.event_id AS eventId, e.title AS eventTitle, e.type AS eventType, e.date AS eventDate,
      m.thread_id AS threadId, m.name AS threadName, m.avatar, m.last_message AS lastMessage
    FROM users u
    LEFT JOIN courses c ON u.id = c.user_id
    LEFT JOIN assignments a ON u.id = a.user_id
    LEFT JOIN grades g ON u.id = g.user_id
    LEFT JOIN events e ON u.id = e.user_id
    LEFT JOIN messages m ON u.id = m.user_id
    WHERE u.id = ?;
  `;

  db.query(getUserQuery, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user data:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format the data
    const userData = {
      name: results[0].name,
      email: results[0].email,
      courses: {},
      assignments: {},
      grades: {},
      events: {},
      messages: {},
    };

    results.forEach((row) => {
      if (row.courseId && !userData.courses[row.courseId]) {
        userData.courses[row.courseId] = {
          name: row.courseName,
          status: row.courseStatus,
          progress: row.progress,
        };
      }

      if (row.assignmentId && !userData.assignments[row.assignmentId]) {
        userData.assignments[row.assignmentId] = {
          title: row.assignmentTitle,
          status: row.assignmentStatus,
          dueDate: row.dueDate,
          points: row.points,
        };
      }

      if (row.gradeCourseId && !userData.grades[row.gradeCourseId]) {
        userData.grades[row.gradeCourseId] = {
          final: row.finalGrade,
          breakdown: JSON.parse(row.breakdown),
        };
      }

      if (row.eventId && !userData.events[row.eventId]) {
        userData.events[row.eventId] = {
          title: row.eventTitle,
          type: row.eventType,
          date: row.eventDate,
        };
      }

      if (row.threadId && !userData.messages[row.threadId]) {
        userData.messages[row.threadId] = {
          name: row.threadName,
          avatar: row.avatar,
          lastMessage: JSON.parse(row.lastMessage),
        };
      }
    });

    res.status(200).json(userData);
  });
});

// INSTRUCTOR API ENDPOINTS

// Get instructor dashboard data
app.get("/api/instructor/dashboard", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;
  
  // Placeholder data for the instructor dashboard
  const instructorData = {
    stats: {
      totalStudents: 128,
      activeCourses: 4,
      monthlyEarnings: 3250.75,
      averageRating: 4.7,
      completionRate: 75,
      submissionRate: 82
    },
    activities: {
      1: {
        courseId: "c1",
        courseName: "Introduction to JavaScript",
        description: "New enrollment: Maria Johnson",
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      2: {
        courseId: "c2",
        courseName: "Web Development Fundamentals",
        description: "Assignment submitted: Final Project",
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    },
    reviews: {
      1: {
        courseName: "Introduction to JavaScript",
        rating: 5,
        comment: "Great course! Very clear explanations and practical examples.",
        timestamp: new Date(Date.now() - 259200000).toISOString()
      }
    },
    engagement: {
      completionRate: 75,
      submissionRate: 82
    }
  };
  
  res.status(200).json(instructorData);
});

// Get instructor courses
app.get("/api/instructor/courses", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;

  // Placeholder data for demonstration
  const coursesData = {
    courses: {
      "c1": {
        title: "Introduction to JavaScript",
        description: "Learn the fundamentals of JavaScript programming",
        status: "published",
        thumbnail: "/api/placeholder/300/200",
        lessons: 12,
        duration: 8,
        enrollments: 36,
        rating: 4.8,
        reviews: 24,
        revenue: 1440.00
      },
      "c2": {
        title: "Web Development Fundamentals",
        description: "Master HTML, CSS, and responsive design",
        status: "published",
        thumbnail: "/api/placeholder/300/200",
        lessons: 15,
        duration: 10,
        enrollments: 42,
        rating: 4.6,
        reviews: 32,
        revenue: 1680.00
      },
      "c3": {
        title: "Database Design",
        description: "Learn to design efficient database structures",
        status: "draft",
        thumbnail: "/api/placeholder/300/200",
        lessons: 8,
        duration: 6,
        enrollments: 0,
        rating: 0,
        reviews: 0,
        revenue: 0
      }
    }
  };

  res.status(200).json(coursesData);
});

// Create a new course
app.post("/api/courses", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;
  const { title, description, category, price } = req.body;

  // Validate input
  if (!title || !description || !category || !price) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Insert course into database
  const insertCourseQuery = `
    INSERT INTO courses (user_id, title, description, category, price, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    insertCourseQuery,
    [userId, title, description, category, price, "draft"],
    (err, result) => {
      if (err) {
        console.error("Error creating course:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(201).json({
        message: "Course created successfully",
        courseId: result.insertId,
        course: {
          title,
          description,
          category,
          price,
          status: "draft"
        }
      });
    }
  );
});

// Update a course
app.put("/api/courses/:courseId", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;
  const courseId = req.params.courseId;
  const { title, description, category, price } = req.body;

  // Validate input
  if (!title || !description || !category || !price) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Verify course ownership
  const checkOwnershipQuery = "SELECT * FROM courses WHERE course_id = ? AND user_id = ?";
  
  db.query(checkOwnershipQuery, [courseId, userId], (err, results) => {
    if (err) {
      console.error("Error checking course ownership:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Course not found or unauthorized" });
    }

    // Update course
    const updateCourseQuery = `
      UPDATE courses
      SET title = ?, description = ?, category = ?, price = ?, updated_at = NOW()
      WHERE course_id = ? AND user_id = ?
    `;

    db.query(
      updateCourseQuery,
      [title, description, category, price, courseId, userId],
      (err, result) => {
        if (err) {
          console.error("Error updating course:", err);
          return res.status(500).json({ error: "Database error" });
        }

        res.status(200).json({
          message: "Course updated successfully",
          course: {
            courseId,
            title,
            description,
            category,
            price
          }
        });
      }
    );
  });
});

// Delete a course
app.delete("/api/courses/:courseId", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;
  const courseId = req.params.courseId;

  // Verify course ownership
  const checkOwnershipQuery = "SELECT * FROM courses WHERE course_id = ? AND user_id = ?";
  
  db.query(checkOwnershipQuery, [courseId, userId], (err, results) => {
    if (err) {
      console.error("Error checking course ownership:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Course not found or unauthorized" });
    }

    // Check if course has enrollments
    const checkEnrollmentsQuery = "SELECT COUNT(*) AS enrollmentCount FROM enrollments WHERE course_id = ?";
    
    db.query(checkEnrollmentsQuery, [courseId], (err, results) => {
      if (err) {
        console.error("Error checking enrollments:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const enrollmentCount = results[0].enrollmentCount;

      if (enrollmentCount > 0) {
        // Archive course instead of deleting if it has enrollments
        const archiveCourseQuery = "UPDATE courses SET status = 'archived', updated_at = NOW() WHERE course_id = ?";
        
        db.query(archiveCourseQuery, [courseId], (err, result) => {
          if (err) {
            console.error("Error archiving course:", err);
            return res.status(500).json({ error: "Database error" });
          }

          res.status(200).json({
            message: "Course archived successfully",
            archived: true
          });
        });
      } else {
        // Delete course if it has no enrollments
        const deleteCourseQuery = "DELETE FROM courses WHERE course_id = ?";
        
        db.query(deleteCourseQuery, [courseId], (err, result) => {
          if (err) {
            console.error("Error deleting course:", err);
            return res.status(500).json({ error: "Database error" });
          }

          res.status(200).json({
            message: "Course deleted successfully",
            deleted: true
          });
        });
      }
    });
  });
});

// Get instructor students
app.get("/api/instructor/students", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;

  // Placeholder data for demonstration
  const studentsData = {
    students: {
      "s1": {
        name: "John Smith",
        email: "john.smith@example.com",
        avatar: "/api/placeholder/40/40",
        courseName: "Introduction to JavaScript",
        enrollmentDate: "2023-08-15T10:30:00Z",
        progress: 75,
        lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: "active",
        grade: "B+",
        assignmentStatus: "2/3 Completed"
      },
      "s2": {
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        avatar: "/api/placeholder/40/40",
        courseName: "Web Development Fundamentals",
        enrollmentDate: "2023-07-22T14:15:00Z",
        progress: 92,
        lastActive: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        status: "active",
        grade: "A",
        assignmentStatus: "All Completed"
      },
      "s3": {
        name: "Michael Wong",
        email: "m.wong@example.com",
        avatar: "/api/placeholder/40/40",
        courseName: "Introduction to JavaScript",
        enrollmentDate: "2023-08-05T09:45:00Z",
        progress: 35,
        lastActive: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        status: "inactive",
        grade: "C",
        assignmentStatus: "1/3 Completed"
      }
    }
  };

  res.status(200).json(studentsData);
});

// Get instructor assignments
app.get("/api/instructor/assignments", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;

  // Placeholder data for demonstration
  const assignmentsData = {
    assignments: {
      "a1": {
        title: "JavaScript Basics Quiz",
        courseName: "Introduction to JavaScript",
        type: "quiz",
        status: "active",
        points: 20,
        dueDate: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
        publishDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        submittedCount: 24,
        totalStudents: 36,
        gradedCount: 20,
        averageScore: 85
      },
      "a2": {
        title: "Final Project",
        courseName: "Web Development Fundamentals",
        type: "project",
        status: "active",
        points: 100,
        dueDate: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
        publishDate: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
        submittedCount: 15,
        totalStudents: 42,
        gradedCount: 10,
        averageScore: 78
      },
      "a3": {
        title: "Database Schema Design",
        courseName: "Database Design",
        type: "homework",
        status: "upcoming",
        points: 30,
        dueDate: new Date(Date.now() + 864000000).toISOString(), // 10 days from now
        publishDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now (scheduled)
        submittedCount: 0,
        totalStudents: 25,
        gradedCount: 0,
        averageScore: 0
      }
    }
  };

  res.status(200).json(assignmentsData);
});

// Get instructor analytics
app.get("/api/instructor/analytics", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;

  // Placeholder data for demonstration
  const analyticsData = {
    overview: {
      totalRevenue: 4950.75,
      revenueTrend: 15,
      activeStudents: 128,
      studentsTrend: 8,
      completionRate: 75,
      completionTrend: -3,
      averageRating: 4.7,
      ratingTrend: 2
    },
    coursePerformance: {
      "c1": {
        title: "Introduction to JavaScript",
        enrollments: 36,
        completionRate: 75,
        revenue: 1440.00,
        revenuePercentage: 29
      },
      "c2": {
        title: "Web Development Fundamentals",
        enrollments: 42,
        completionRate: 65,
        revenue: 1680.00,
        revenuePercentage: 34
      },
      "c3": {
        title: "Database Design",
        enrollments: 25,
        completionRate: 80,
        revenue: 1000.00,
        revenuePercentage: 20
      },
      "c4": {
        title: "Advanced JavaScript",
        enrollments: 18,
        completionRate: 60,
        revenue: 830.75,
        revenuePercentage: 17
      }
    },
    engagement: {
      activeUsers: 95,
      activeUsersTrend: 5,
      averageSessionTime: "42m",
      sessionTimeTrend: 3,
      completionRate: 75,
      completionTrend: -3
    }
  };

  res.status(200).json(analyticsData);
});

// Get instructor discussions
app.get("/api/instructor/discussions", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;

  // Placeholder data for demonstration
  const discussionsData = {
    discussions: {
      "d1": {
        title: "Course Updates for JavaScript Fundamentals",
        type: "announcement",
        courseName: "Introduction to JavaScript",
        preview: "I've added new lessons on ES6 features that will be available next week...",
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        pinned: true,
        views: 35,
        replies: 12,
        lastReplyTime: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
      },
      "d2": {
        title: "How to approach the final project?",
        type: "question",
        courseName: "Web Development Fundamentals",
        preview: "A student is asking for clarification on the final project requirements...",
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        pinned: false,
        views: 28,
        replies: 8,
        lastReplyTime: new Date(Date.now() - 21600000).toISOString() // 6 hours ago
      },
      "d3": {
        title: "Resources for learning SQL",
        type: "discussion",
        courseName: "Database Design",
        preview: "I've compiled a list of helpful resources for students learning SQL...",
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        pinned: false,
        views: 42,
        replies: 15,
        lastReplyTime: new Date(Date.now() - 64800000).toISOString() // 18 hours ago
      }
    }
  };

  res.status(200).json(discussionsData);
});

// Create a new announcement
app.post("/api/announcements", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;
  const { title, courseId, content, pinned } = req.body;

  // Validate input
  if (!title || !courseId || !content) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // In a real application, you would insert this into your database
  // For now, return a success response with the announcement data
  res.status(201).json({
    message: "Announcement posted successfully",
    announcement: {
      id: Math.floor(Math.random() * 1000),
      title,
      courseId,
      content,
      pinned: pinned === "on" || pinned === true,
      timestamp: new Date().toISOString(),
      authorId: userId
    }
  });
});

// Get instructor earnings
app.get("/api/instructor/earnings", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;

  // Placeholder data for demonstration
  const earningsData = {
    total: 4950.75,
    trend: 15,
    pending: 850.25,
    nextPayoutDate: new Date(Date.now() + 1209600000).toISOString(), // 14 days from now
    courseRevenue: {
      "c1": {
        title: "Introduction to JavaScript",
        revenue: 1440.00,
        students: 36,
        rating: 4.8,
        trend: 12
      },
      "c2": {
        title: "Web Development Fundamentals",
        revenue: 1680.00,
        students: 42,
        rating: 4.6,
        trend: 8
      },
      "c3": {
        title: "Database Design",
        revenue: 1000.00,
        students: 25,
        rating: 4.9,
        trend: 20
      },
      "c4": {
        title: "Advanced JavaScript",
        revenue: 830.75,
        students: 18,
        rating: 4.5,
        trend: -5
      }
    }
  };

  res.status(200).json(earningsData);
});

// Process withdrawal request
app.post("/api/earnings/withdraw", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;
  const { withdrawalAmount, withdrawalMethod } = req.body;

  // Validate input
  if (!withdrawalAmount || !withdrawalMethod) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // In a real application, you would process the withdrawal in your database
  // For now, return a success response
  res.status(200).json({
    message: "Withdrawal request submitted successfully",
    withdrawal: {
      id: Math.floor(Math.random() * 1000),
      amount: withdrawalAmount,
      method: withdrawalMethod,
      status: "pending",
      timestamp: new Date().toISOString(),
      estimatedArrival: new Date(Date.now() + 259200000).toISOString() // 3 days from now
    }
  });
});

// Upload avatar
app.post("/api/user/avatar", verifyToken, (req, res) => {
  // In a real application, you would handle file upload
  // For this example, we'll just return a placeholder URL
  res.status(200).json({
    message: "Avatar uploaded successfully",
    avatarUrl: "/api/placeholder/120/120?updated=" + Date.now()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Fetch instructor settings
app.get("/api/instructor/settings", verifyToken, isInstructor, (req, res) => {
  const userId = req.userId;
  
  // Fetch user data including settings
  const getUserQuery = "SELECT id, name, email, role FROM users WHERE id = ?";
  
  db.query(getUserQuery, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching user settings:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Return user data with placeholder settings
    res.status(200).json({
      ...results[0],
      settings: {
        notifications: {
          email: true,
          browser: true,
          mobile: false
        },
        privacy: {
          showProfile: true,
          showCourses: true
        },
        preferences: {
          language: "English",
          timezone: "UTC"
        }
      }
    });
  });
});