const express = require('express');
const router = express.Router();
const Station = require('../models/Station');

// Dev-only seed endpoint. Only enabled when NODE_ENV !== 'production'.
router.post('/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ msg: 'Not allowed in production' });
  try {
    // Simple sample stations
    const samples = [
      { name: 'Aramco Station A', stationId: 'A-100', location: { type: 'Point', coordinates: [46.6753, 24.7136] } },
      { name: 'Aramco Station B', stationId: 'B-200', location: { type: 'Point', coordinates: [46.6800, 24.7160] } },
      { name: 'Aramco Station C', stationId: 'C-300', location: { type: 'Point', coordinates: [46.6825, 24.7180] } }
    ];
    // Avoid duplicate stationIds
    for (const s of samples) {
      const exists = await Station.findOne({ stationId: s.stationId });
      if (!exists) {
        const st = new Station(s);
        await st.save();
      }
    }
    const all = await Station.find();
    res.json({ msg: 'Seed complete', count: all.length, stations: all });
  } catch (err) {
    console.error('Dev seed error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

// Dev-only debug endpoint to inspect headers and environment flags
router.get('/debug', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ msg: 'Not allowed in production' });
  const info = {
    nodeEnv: process.env.NODE_ENV,
    trustProxy: req.app.get('trust proxy'),
    allowDevAdmin: process.env.ALLOW_DEV_ADMIN === 'true',
    headers: {
      host: req.headers.host,
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-port': req.headers['x-forwarded-port'],
      via: req.headers.via
    }
  };
  res.json(info);
});
