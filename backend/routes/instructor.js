const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Setup multer for image upload
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Max Size
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

// Create New Course (with Image Upload)
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

module.exports = router;
