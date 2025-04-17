const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/courses/published
router.get("/published", (req, res) => {
    const query = `
        SELECT 
            c.course_id, 
            c.title, 
            c.banner_url, 
            c.description, 
            c.created_at, 
            u.name AS instructor_name
        FROM courses c
        JOIN users u ON c.instructor_id = u.user_id
        WHERE c.status = 'published'
            AND c.course_id NOT IN (
            SELECT course_id FROM enrollments WHERE student_id = ?
            )
        `;

        db.query(query, [req.userId], (err, results) => {
            if (err) {
              console.error("Error fetching published courses:", err);
              return res.status(500).json({ error: "Failed to fetch courses" });
            }
          
            res.json(results);
          });
});

// POST /api/enroll/:courseId
router.post("/enroll/:courseId", (req, res) => {
    const courseId = req.params.courseId;
    const studentId = req.userId;
  
    // 1. Check if already enrolled
    const checkQuery = "SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?";
    db.query(checkQuery, [studentId, courseId], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error." });
      if (results.length > 0) {
        return res.status(400).json({ message: "Already enrolled in this course." });
      }
  
      const enrollQuery = "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)";
      db.query(enrollQuery, [studentId, courseId], (err) => {
        if (err) return res.status(500).json({ error: "Enrollment failed." });
  
        const courseInfoQuery = "SELECT title, instructor_id FROM courses WHERE course_id = ?";
        db.query(courseInfoQuery, [courseId], (err, courseResult) => {
          if (err || courseResult.length === 0) return res.status(500).json({ error: "Course not found." });
  
          const courseTitle = courseResult[0].title;
          const instructorId = courseResult[0].instructor_id;
  
          const studentQuery = "SELECT name FROM users WHERE user_id = ?";
          db.query(studentQuery, [studentId], (err, studentResult) => {
            if (err || studentResult.length === 0) return res.status(500).json({ error: "Student not found." });
  
            const studentName = studentResult[0].name;
  
            // 5. Create notifications
            const insertNotifications = `
              INSERT INTO notifications (user_id, message) VALUES 
              (?, ?), 
              (?, ?)
            `;
            const studentMsg = `You are now enrolled in course: ${courseTitle}`;
            const instructorMsg = `${studentName} has now enrolled in your course: ${courseTitle}`;
  
            db.query(insertNotifications, [studentId, studentMsg, instructorId, instructorMsg], (err) => {
              if (err) return res.status(500).json({ error: "Enrollment succeeded but notifications failed." });
              res.status(200).json({ message: "Enrollment successful!" });
            });
          });
        });
      });
    });
  });

// DELETE /api/enroll/:courseId
router.delete("/enroll/:courseId", (req, res) => {
    const studentId = req.userId;
    const courseId = req.params.courseId;
  
    const query = "DELETE FROM enrollments WHERE student_id = ? AND course_id = ?";
  
    db.query(query, [studentId, courseId], (err, result) => {
      if (err) {
        console.error("Error unenrolling from course:", err);
        return res.status(500).json({ error: "Failed to unenroll." });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "You are not enrolled in this course." });
      }

      const courseQuery = "SELECT title FROM courses WHERE course_id = ?";
      db.query(courseQuery, [courseId], (err, courseResult) => {
        if (err || courseResult.length === 0) {
          return res.status(200).json({ message: "Successfully unenrolled." }); // fallback
        }
      
        const courseTitle = courseResult[0].title;
        const noteQuery = "INSERT INTO notifications (user_id, message) VALUES (?, ?)";
        const noteMessage = `You have unenrolled from course: ${courseTitle}`;
      
        db.query(noteQuery, [studentId, noteMessage], (err) => {
          if (err) console.error("Notification insert failed (unenroll):", err);
          return res.status(200).json({ message: "Successfully unenrolled." });
        });
      });
    });
  });
  


// GET /api/student/courses
router.get("/student/courses", (req, res) => {
    const studentId = req.userId;
  
    const query = `
      SELECT 
        c.course_id,
        c.title,
        c.banner_url,
        c.description,
        c.created_at,
        u.name AS instructor_name
      FROM enrollments e
      JOIN courses c ON e.course_id = c.course_id
      JOIN users u ON c.instructor_id = u.user_id
      WHERE e.student_id = ?
    `;
  
    db.query(query, [studentId], (err, results) => {
      if (err) {
        console.error("Error fetching student courses:", err);
        return res.status(500).json({ error: "Failed to fetch enrolled courses" });
      }
  
      res.json(results);
    });
  });

// GET /api/notifications (student)
router.get("/notifications", (req, res) => {
    const studentId = req.userId;
  
    const query = `
      SELECT notification_id, message, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
  
    db.query(query, [studentId], (err, results) => {
      if (err) {
        console.error("Error fetching notifications:", err);
        return res.status(500).json({ error: "Failed to load notifications." });
      }
  
      res.json(results);
    });
  });


  // DELETE /api/notifications/:id
router.delete("/notifications/:id", (req, res) => {
    const notificationId = req.params.id;
    const userId = req.userId;
  
    const query = "DELETE FROM notifications WHERE notification_id = ? AND user_id = ?";
  
    db.query(query, [notificationId, userId], (err, result) => {
      if (err) {
        console.error("Error deleting notification:", err);
        return res.status(500).json({ error: "Failed to delete notification." });
      }
  
      res.status(200).json({ message: "Notification deleted." });
    });
  });

  
  // Mark read feature
router.patch("/notifications/:id/read", (req, res) => {
    const userId = req.userId;
    const notificationId = req.params.id;
  
    const query = "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?";
  
    db.query(query, [notificationId, userId], (err) => {
      if (err) {
        console.error("Failed to mark notification as read:", err);
        return res.status(500).json({ error: "Failed to update notification." });
      }
  
      res.status(200).json({ message: "Notification marked as read." });
    });
  });

// show course sections
// GET /api/courses/:courseId/sections
router.get("/:courseId/sections", (req, res) => {
    const courseId = req.params.courseId;
  
    const query = `
      SELECT 
        section_id,
        title,
        content_type,
        content_data,
        visibility,
        created_at
      FROM sections
      WHERE course_id = ?
      ORDER BY created_at ASC
    `;
  
    db.query(query, [courseId], (err, results) => {
      if (err) {
        console.error("Error fetching course sections:", err);
        return res.status(500).json({ error: "Failed to load course content." });
      }
  
      res.json(results);
    });
  });

module.exports = router;
