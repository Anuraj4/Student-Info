require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// MySQL connection using environment variables
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Multer storage setup for PDF files
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique name for the file
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB file size limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only PDF files are allowed!');
    }
  }
});

// Serve static files (CSS, images)
app.use(express.static('public'));

// Home route for form
app.get('/', (req, res) => {
  res.render('index');
});

// Handle form submission
app.post('/submit', upload.single('resume'), (req, res) => {
  const { name, email, contact, branch, year_of_study } = req.body;
  const resume = req.file ? req.file.filename : null;

  if (resume) {
    const sql = `INSERT INTO students (name, email, contact, branch, year_of_study, resume_path)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [name, email, contact, branch, year_of_study, resume], (err, result) => {
      if (err) throw err;
      res.send('Student information has been saved!');
    });
  } else {
    res.send('Error: Resume is required.');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
