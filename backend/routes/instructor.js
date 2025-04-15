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
  const { title, content_type, content_data } = req.body;
  const course_id = req.params.id;

  // Basic validation
  if (!title || !content_type) {
    return res.status(400).json({ error: "Title and type are required" });
  }

  const sql = `
    INSERT INTO sections (course_id, title, content_type, content_data)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [course_id, title, content_type, content_data || null], (err, result) => {
    if (err) {
      console.error("Error adding section:", err);
      return res.status(500).json({ error: "Database error while adding section" });
    }

    res.status(201).json({ message: "Section added successfully" });
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

    res.json({ message: "Status updated successfully" });
  });
});


module.exports = router;
