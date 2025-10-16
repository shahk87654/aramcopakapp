const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Station = require('../models/Station');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const { v4: uuidv4 } = require('uuid');

const path = require('path');
const runBulkSeed = async () => {
  // Import the seed script as a module by executing it in a child process-like way
  const seedPath = path.join(__dirname, '..', 'scripts', 'bulkAddStations.js');
  // Require the script file which will run when required; to avoid double-running in tests,
  // spawn a new Node process to run it instead.
  const { spawn } = require('child_process');
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [seedPath], { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve(); else reject(new Error('Seed script failed with code ' + code));
    });
    child.on('error', reject);
  });
};

// Temporary helper: create or upsert an admin user (guarded by SEED_ENABLED + ADMIN_SEED_KEY)
router.post('/create-admin', async (req, res) => {
  try {
    if (process.env.SEED_ENABLED !== 'true') return res.status(404).json({ msg: 'Not found' });
    const key = req.headers['x-admin-seed-key'] || req.body?.adminSeedKey;
    const expected = process.env.ADMIN_SEED_KEY;
    if (!expected || key !== expected) return res.status(403).json({ msg: 'Forbidden' });
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    const { email = 'admin@example.com', password = 'admin123' } = req.body || {};
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, password: await bcrypt.hash(password, 10), isAdmin: true });
      await user.save();
    } else if (!user.isAdmin) {
      user.isAdmin = true;
      await user.save();
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ msg: 'Admin created', token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('create-admin error', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Dashboard stats
router.get('/stats', auth, admin, async (req, res) => {
  const totalReviews = await Review.countDocuments();
  const totalStations = await Station.countDocuments();
  const totalCoupons = await Coupon.countDocuments();
  const avgRating = await Review.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' } } }
  ]);
  // Get all stations with their reviews
  const stations = await Station.find();
  const stationReviews = {};
  for (const s of stations) {
    const reviews = await Review.find({ station: s._id }).populate('user');
    stationReviews[s._id] = reviews;
  }
  const topStations = await Station.aggregate([
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'station', as: 'reviews' } },
    { $addFields: { avgRating: { $avg: '$reviews.rating' }, reviewCount: { $size: '$reviews' } } },
    { $sort: { avgRating: -1, reviewCount: -1 } },
    { $limit: 5 }
  ]);
  const lowStations = await Station.aggregate([
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'station', as: 'reviews' } },
    { $addFields: { avgRating: { $avg: '$reviews.rating' }, reviewCount: { $size: '$reviews' } } },
    { $sort: { avgRating: 1, reviewCount: -1 } },
    { $limit: 5 }
  ]);
  res.json({
    totalReviews,
    totalStations,
    totalCoupons,
    avgRating: avgRating[0]?.avg || 0,
    topStations,
    lowStations,
    stationReviews
  });
});

// List all reviews (with filters)
router.get('/reviews', auth, admin, async (req, res) => {
  const { stationId, flagged } = req.query;
  const filter = {};
  if (stationId) filter.station = stationId;
  if (flagged) filter.flagged = flagged === 'true';
  const reviews = await Review.find(filter).populate('user station');
  res.json(reviews);
});

// Flag/unflag review
router.post('/reviews/:id/flag', auth, admin, async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ msg: 'Review not found' });
  review.flagged = !review.flagged;
  await review.save();
  res.json({ flagged: review.flagged });
});

// List all coupons
router.get('/coupons', auth, admin, async (req, res) => {
  const coupons = await Coupon.find().populate('user station review');
  res.json(coupons);
});

// Manual coupon generation (admin)
router.post('/coupons', auth, admin, async (req, res) => {
  const { userId, reviewId, stationId } = req.body;
  if (!userId || !stationId) return res.status(400).json({ msg: 'userId and stationId required' });
  try {
    const code = uuidv4();
    const coupon = new Coupon({ code, user: userId, review: reviewId, station: stationId });
    await coupon.save();
    res.json({ msg: 'Coupon generated', coupon });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Audit trail (review logs)
router.get('/audit', auth, admin, async (req, res) => {
  const reviews = await Review.find().populate('user station');
  res.json(reviews);
});

module.exports = router;

// Admin-only seeding endpoint (guarded by ADMIN_SEED_KEY env var)
router.post('/seed-stations', async (req, res) => {
  try {
    // Extra safety: only allow seeding when SEED_ENABLED is explicitly turned on.
    // This prevents accidental or malicious runs in production. To seed, set SEED_ENABLED=true
    // in the host environment temporarily, then unset it when done.
    if (process.env.SEED_ENABLED !== 'true') {
      console.warn('Seed endpoint hit but SEED_ENABLED !== true; refusing to run');
      return res.status(404).json({ msg: 'Not found' });
    }
    const key = req.headers['x-admin-seed-key'] || req.body?.adminSeedKey;
    const expected = process.env.ADMIN_SEED_KEY;
    if (!expected || key !== expected) return res.status(403).json({ msg: 'Forbidden' });
    await runBulkSeed();
    res.json({ msg: 'Seed started' });
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ msg: 'Seed failed', error: err.message });
  }
});
