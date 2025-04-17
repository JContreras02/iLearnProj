const mysql = require('mysql2');

// Create connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ilearn'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('MySQL database connected successfully');
  
  // Test query to verify table structure
  db.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error showing tables:', err);
      return;
    }
    console.log('Database tables:', results);
    
    // Check users table structure
    db.query('DESCRIBE users', (err, results) => {
      if (err) {
        console.error('Error describing users table:', err);
        return;
      }
      console.log('Users table structure:', results);
    });
  });
});

// Handle database connection errors
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

module.exports = db;
