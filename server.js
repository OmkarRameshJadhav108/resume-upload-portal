 const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Nodemailer setup (Gmail App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// POST route for resume upload
app.post('/upload', upload.single('resume'), async (req, res) => {
  const {
    name,
    email,
    phone,
    position,
    experience,
    skills,
    education,
    linkedin,
    message
  } = req.body;

  const resumePath = req.file?.path;

  // Validate required fields
  if (!name || !email || !position || !resumePath) {
    return res.status(400).send('❌ Missing required fields.');
  }

  // Email to admin
  const adminMail = {
    from: `"Resume Bot" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
    subject: `📨 New Resume from ${name}`,
    text: `
📥 New Resume Submitted

Name: ${name}
Email: ${email}
Phone: ${phone}
Position: ${position}
Experience: ${experience} years
Skills: ${skills}
Education: ${education}
LinkedIn: ${linkedin || 'N/A'}
Why Hire: ${message}

📎 Resume: ${req.file.originalname}
    `,
    attachments: [
      {
        filename: req.file.originalname,
        path: resumePath
      }
    ]
  };

  // Email to applicant
  const userMail = {
    from: `"Resume Bot" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `✅ Resume Received - ${position}`,
    text: `Hi ${name},\n\nThank you for applying for the ${position} role. We’ve received your resume and will be in touch soon.\n\nBest,\nHiring Team`
  };

  try {
    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);
    res.send('✅ Resume uploaded and emails sent successfully.');
  } catch (err) {
    console.error('❌ Email Error:', err.message);
    res.status(500).send(`
Your details were successfully submitted. However, we couldn't send confirmation emails. Gmail accounts created in 2022 or later may require special App Password settings.
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`OmkarRameshJadhav108\nServer running at http://localhost:${PORT}`);
});
