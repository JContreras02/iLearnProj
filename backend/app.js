require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const db = require("./db");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "../frontend")));

// JWT Middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(' ')[1];  // Grab just the token part

  if (!token) return res.status(401).json({ error: "Invalid token format" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });

    req.userId = decoded.user_id;
    req.role = decoded.role;
    next();
  });
}

// SIGNUP with enhanced debugging
app.post("/signup", async (req, res) => {
    console.log("Signup endpoint hit");
    console.log("Request body:", req.body);
    
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      console.log("Missing required fields:", { 
        nameProvided: !!name, 
        emailProvided: !!email, 
        passwordProvided: !!password, 
        roleProvided: !!role 
      });
      return res.status(400).json({ error: "All fields are required" });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log("Password hashed successfully");
  
      const checkUser = "SELECT * FROM users WHERE email = ?";
      console.log("Checking if email already exists:", email);
      
      db.query(checkUser, [email], (err, results) => {
        if (err) {
          console.error("Database error during email check:", err);
          return res.status(500).json({ error: "Database error during email check" });
        }
        
        console.log("Email check results:", results.length > 0 ? "Email exists" : "Email is new");
        
        if (results.length > 0) {
          return res.status(409).json({ error: "Email already in use" });
        }
  
        const insertUser = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";
        console.log("Attempting to insert user with query:", insertUser);
        console.log("Values:", [name, email, "HASHED_PASSWORD_NOT_SHOWN", role]);
        
        db.query(insertUser, [name, email, hashedPassword, role], (err, result) => {
          if (err) {
            console.error("Database error during user insertion:", err);
            return res.status(500).json({ error: "Database error during registration" });
          }
          
          console.log("User inserted successfully, result:", result);
          res.status(201).json({ message: "User registered successfully" });
        });
      });
    } catch (err) {
      console.error("Error in signup process:", err);
      res.status(500).json({ error: "Server error during registration" });
    }
  });

// LOGIN
app.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

// instructor routes
const instructorRoutes = require('./routes/instructor');

app.use('/api', verifyToken, instructorRoutes);

// Uploaded images to upload folder
app.use('/uploads', express.static('uploads'));

app.get("/", (req, res) => {
  res.send("<h1>📚 iLearn Backend is running!</h1>");
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

const studentRoutes = require("./routes/student");
app.use("/api/courses", verifyToken, studentRoutes);
