const express = require('express');
const path = require('path'); // Import path module
const app = express();

app.use(express.json()); // For parsing application/json

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Example route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from backend!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
