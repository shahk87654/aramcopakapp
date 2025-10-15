const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');

// Get stations near GPS location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ msg: 'Missing lat/lng' });
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radNum = parseInt(radius, 10);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) return res.status(400).json({ msg: 'Invalid lat/lng' });
    const stations = await Station.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lngNum, latNum] },
          $maxDistance: radNum
        }
      }
    });
    res.json(stations);
  } catch (err) {
    console.error('Nearby error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all stations
router.get('/', async (req, res) => {
  try {
    const { stationId } = req.query;
    if (stationId) {
      const station = await Station.findOne({ stationId: stationId.toString() });
      return res.json(station ? [station] : []);
    }
    const stations = await Station.find();
    console.log('Stations found:', stations.length);
    res.json(stations);
  } catch (err) {
    console.error('Get stations error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create station (admin only)
router.post('/', [
  body('name').notEmpty(),
  body('stationId').notEmpty(),
  body('lat').isFloat(),
  body('lng').isFloat()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, stationId, lat, lng } = req.body;
  try {
    let station = new Station({
      name,
      stationId,
      location: { type: 'Point', coordinates: [lng, lat] }
    });
    await station.save();
    // Generate QR code for station
    const qr = await QRCode.toDataURL(`https://yourdomain.com/review/${station.stationId}`);
    station.qrCode = qr;
    await station.save();
    res.json(station);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
