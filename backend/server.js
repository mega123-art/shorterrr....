import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import urlRoutes from './routes/urls.js';
import Url from './models/Url.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Redirect route - must be before API routes
app.get('/:shortUrl', async (req, res) => {
  try {
    const url = await Url.findOne({ shortUrl: req.params.shortUrl });
    if (!url) {
      return res.status(404).send('URL not found');
    }

    // Record the click
    url.clicks.push({
      timestamp: new Date(),
      ip: req.ip
    });
    await url.save();

    res.redirect(url.originalUrl);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});