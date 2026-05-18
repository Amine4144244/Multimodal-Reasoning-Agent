require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const Analysis = require('./models/Analysis');

const app = express();
const PORT = process.env.PORT || 5000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/multimodal_agent')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const absoluteImagePath = path.join(__dirname, 'uploads', req.file.filename);

    // Call Python AI Service
    // We send the absolute path of the image or base64. Let's send the path.
    // In production, we would send a URL or binary data.
    // Using FormData to send the file to python backend
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(absoluteImagePath));
    formData.append('prompt', prompt);

    console.log("Calling AI Service...");
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    const aiData = aiResponse.data;

    // Save to MongoDB
    const analysis = new Analysis({
      imageUrl,
      userPrompt: prompt,
      result: aiData.result,
      confidence: aiData.confidence,
      needsReview: aiData.needs_review
    });
    
    await analysis.save();

    res.json(analysis);

  } catch (error) {
    console.error('Error in /api/analyze:', error.message);
    if (error.response) {
      console.error('AI Service Error:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await Analysis.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
