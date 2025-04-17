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
  
      return res.status(200).json({ message: "Successfully unenrolled." });
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

module.exports = router;
