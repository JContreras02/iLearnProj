const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// === Multer Config for Image Upload ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
    }
  }
});


// === ROUTES ===

// Create New Course (with image)
router.post('/courses', upload.single('banner'), (req, res) => {
  const { title, description } = req.body;

  if (!title || !description || !req.file) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const banner_url = `/uploads/${req.file.filename}`;

  const sql = `
    INSERT INTO courses (instructor_id, title, banner_url, description)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [req.userId, title, banner_url, description], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while creating course' });
    }

    res.status(201).json({ message: 'Course created successfully' });
    const notification = `Course "${title}" has been created successfully.`;
    db.query("INSERT INTO notifications (user_id, message) VALUES (?, ?)", [req.userId, notification], (err) => {
      if (err) console.error("Notification error (course create):", err);
    });
  });
});

// Get All Courses by Logged-In Instructor
router.get('/courses/mine', (req, res) => {
  const sql = `
    SELECT * FROM courses
    WHERE instructor_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [req.userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error while fetching courses' });
    }

    res.json(results);
  });
});

// Get All Sections for a Course ===
router.get('/courses/:id/sections', (req, res) => {
  const sql = `
    SELECT section_id, course_id, title, content_type, content_data, created_at
    FROM sections
    WHERE course_id = ?
    ORDER BY section_id
  `;

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching sections:', err);
      return res.status(500).json({ error: 'Database error loading sections' });
    }

    res.json(results);
  });
});

// Add New Section to a Course
router.post('/courses/:id/sections', (req, res) => {
  const courseId = req.params.id;
  const { title, content_type, content_data } = req.body;

  if (!title || !content_type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Quiz validation logic
  if (content_type === "quiz") {
    try {
      const parsedQuiz = JSON.parse(content_data);
      if (!Array.isArray(parsedQuiz) || parsedQuiz.length === 0) {
        return res.status(400).json({ error: 'Invalid quiz format' });
      }
    } catch (err) {
      return res.status(400).json({ error: 'Invalid quiz format' });
    }
  }

  const sql = `
    INSERT INTO sections (course_id, title, content_type, content_data)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [courseId, title, content_type, content_data || null], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error adding section' });
    }
    res.status(201).json({ message: 'Section added successfully' });
  });
});

// Delete a section
router.delete('/sections/:id', (req, res) => {
  const sql = `DELETE FROM sections WHERE section_id = ?`;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("Error deleting section:", err);
      return res.status(500).json({ error: "Database error while deleting section" });
    }

    res.json({ message: "Section deleted successfully" });
  });
});

router.put('/courses/:id/status', (req, res) => {
  const { status } = req.body;
  const sql = `UPDATE courses SET status = ? WHERE course_id = ?`;

  db.query(sql, [status, req.params.id], (err, result) => {
    if (err) {
      console.error("Error updating status:", err);
      return res.status(500).json({ error: "DB error while updating status" });
    }
      const message = status === "published"
      ? `Your course has been published.`
      : `Your course has been saved as draft.`;
    
    db.query("INSERT INTO notifications (user_id, message) VALUES (?, ?)", [req.userId, message], (err) => {
      if (err) console.error("Notification error (status change):", err);
    });

    res.json({ message: "Status updated successfully" });
  });
});


// === Dashboard Stats for Instructor ===
router.get('/instructor/dashboard', (req, res) => {
  const sql1 = `SELECT COUNT(*) AS totalCourses FROM courses WHERE instructor_id = ?`;
  const sql2 = `SELECT title FROM courses WHERE instructor_id = ? ORDER BY created_at DESC LIMIT 1`;
  const sql3 = `SELECT course_id, title, description, banner_url, status 
                FROM courses 
                WHERE instructor_id = ? 
                ORDER BY created_at DESC`;

  db.query(sql1, [req.userId], (err1, result1) => {
    if (err1) {
      console.error(err1);
      return res.status(500).json({ error: 'Error loading dashboard' });
    }

    db.query(sql2, [req.userId], (err2, result2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Error loading dashboard' });
      }

      db.query(sql3, [req.userId], (err3, result3) => {
        if (err3) {
          console.error(err3);
          return res.status(500).json({ error: 'Error loading dashboard' });
        }

        res.json({
          totalCourses: result1[0].totalCourses,
          topCourse: result2[0] ? result2[0].title : 'No courses yet',
          courses: result3
        });
      });
    });
  });
});

// GET /api/instructor/student-engagement
router.get('/instructor/student-engagement', (req, res) => {
  const instructorId = req.userId;

  const sql = `
    SELECT 
      c.course_id,
      c.title,
      COUNT(e.student_id) AS total_enrolled
    FROM courses c
    LEFT JOIN enrollments e ON c.course_id = e.course_id
    WHERE c.instructor_id = ?
    GROUP BY c.course_id
    ORDER BY c.created_at DESC
  `;

  db.query(sql, [instructorId], (err, results) => {
    if (err) {
      console.error("Error loading student engagement:", err);
      return res.status(500).json({ error: "Failed to fetch engagement data" });
    }

    res.json(results);
  });
});

// GET /api/instructor/course/:courseId/students
router.get('/instructor/course/:courseId/students', (req, res) => {
  const { courseId } = req.params;

  const sql = `
    SELECT u.user_id, u.name, u.email
    FROM enrollments e
    JOIN users u ON e.student_id = u.user_id
    WHERE e.course_id = ?
  `;

  db.query(sql, [courseId], (err, results) => {
    if (err) {
      console.error("Error fetching student names:", err);
      return res.status(500).json({ error: "Failed to fetch students" });
    }

    res.json(results);
  });
});

// GET /api/instructor/notifications
router.get('/instructor/notifications', (req, res) => {
  const instructorId = req.userId;

  const query = `
    SELECT notification_id, message, is_read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [instructorId], (err, results) => {
    if (err) {
      console.error("Error fetching instructor notifications:", err);
      return res.status(500).json({ error: "Failed to load notifications." });
    }

    res.json(results);
  });
});

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', (req, res) => {
  const notificationId = req.params.id;
  const userId = req.userId;

  const sql = `UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?`;

  db.query(sql, [notificationId, userId], (err, result) => {
    if (err) {
      console.error("Failed to mark notification as read:", err);
      return res.status(500).json({ error: "Failed to update notification." });
    }

    res.status(200).json({ message: "Notification marked as read." });
  });
});

// DELETE /api/notifications/:id
router.delete('/notifications/:id', (req, res) => {
  const notificationId = req.params.id;
  const userId = req.userId;

  const sql = `DELETE FROM notifications WHERE notification_id = ? AND user_id = ?`;

  db.query(sql, [notificationId, userId], (err, result) => {
    if (err) {
      console.error("Error deleting notification:", err);
      return res.status(500).json({ error: "Failed to delete notification." });
    }

    res.status(200).json({ message: "Notification deleted." });
  });
});


module.exports = router;
