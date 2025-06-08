import express from 'express';
import shortid from 'shortid';
import Url from '../models/Url.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create short URL
router.post('/shorten', async (req, res) => {
  try {
    const { originalUrl, customAlias, userId, title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    try {
      new URL(originalUrl);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid URL format' });
    }

    if (customAlias && !userId) {
      return res.status(401).json({ message: 'Please login to use custom aliases' });
    }

    if (customAlias) {
      const existingUrl = await Url.findOne({ shortUrl: customAlias });
      if (existingUrl) {
        return res.status(400).json({ message: 'Custom alias already taken' });
      }
    }

    const shortUrl = customAlias || shortid.generate();
    
    const url = new Url({
      originalUrl,
      shortUrl,
      customAlias,
      userId,
      title
    });

    await url.save();

    const fullShortUrl = `${process.env.BASE_URL}/${shortUrl}`;
    res.json({ shortUrl: fullShortUrl });
  } catch (error) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get URLs for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(urls);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete URL
router.delete('/:id', auth, async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Check if the URL belongs to the authenticated user
    if (url.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this URL' });
    }

    await url.deleteOne();
    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Error deleting URL:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get analytics for a URL
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    // Calculate analytics
    const totalClicks = url.clicks.length;
    const uniqueVisitors = new Set(url.clicks.map(click => click.ip)).size;

    // Calculate daily clicks for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyClicks = url.clicks
      .filter(click => click.timestamp >= thirtyDaysAgo)
      .reduce((acc, click) => {
        const date = click.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    // Convert to array and fill in missing dates
    const dailyClicksArray = [];
    for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      dailyClicksArray.push({
        date,
        clicks: dailyClicks[date] || 0
      });
    }

    res.json({
      totalClicks,
      uniqueVisitors,
      dailyClicks: dailyClicksArray
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as default };