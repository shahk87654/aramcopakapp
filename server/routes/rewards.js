const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');


// GET /api/rewards/profile?... 
// Limit coupon-related endpoints to prevent brute-force
const couponLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 60, // max 60 requests per IP per hour
  message: { msg: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', couponLimiter, async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ msg: 'Coupon code required' });
  const coupon = await Coupon.findOne({ code }).populate('user review');
  if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
  let name = null, contact = null, email = null, phone = null;
  if (coupon.review) {
    name = coupon.review.name;
    contact = coupon.review.contact;
  }
  if (coupon.user) {
    email = coupon.user.email;
    phone = coupon.user.phone;
  }
  res.json({ name, contact, email, phone });
});
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Station = require('../models/Station');

// GET /api/rewards/search?phone=...
router.get('/search', couponLimiter, async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ msg: 'Phone required' });
  // Find users with this phone
  const users = await User.find({ phone });
  const userIds = users.map(u => u._id);
  // Find latest review with this phone/contact
  const latestReview = await Review.findOne({ contact: phone }).sort({ createdAt: -1 });
  // Find all matching reviews (visits) and coupons associated with user or review
  const reviews = await Review.find({ $or: [ { contact: phone }, { user: { $in: userIds } } ] }).sort({ createdAt: -1 }).populate('station');
  const reviewIds = reviews.map(r => r._id);

  // Count visits and fetch coupons linked to either the user or the reviews
  const visits = reviews.length;
  const coupons = await Coupon.find({ $or: [ { user: { $in: userIds } }, { review: { $in: reviewIds } } ] }).populate('station');
  // Compose profile
  let name = null, contact = null, email = null, phoneNum = null;
  if (latestReview) {
    name = latestReview.name;
    contact = latestReview.contact;
  }
  if (users.length > 0) {
    email = users[0].email;
    phoneNum = users[0].phone;
  }
  const visitsList = reviews.map(r => ({
    id: r._id,
    createdAt: r.createdAt,
    station: r.station ? (r.station.name || r.station.stationName || null) : null,
    rating: r.rating,
    cleanliness: r.cleanliness,
    serviceSpeed: r.serviceSpeed,
    staffFriendliness: r.staffFriendliness,
    comment: r.comment,
    name: r.name,
    contact: r.contact
  }));

  res.json({ visits, visitsList, coupons, profile: { name, contact, email, phone: phoneNum } });
});

// POST /api/rewards/claim (mark coupon as used)
router.post('/claim', couponLimiter, auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ msg: 'Coupon code required' });
  const coupon = await Coupon.findOne({ code });
  if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });
  if (coupon.used) return res.status(400).json({ msg: 'Coupon already used' });
  // Optionally ensure the requesting user matches the coupon user
  if (coupon.user && coupon.user.toString() !== req.user.id && req.user.id !== 'dev-admin') {
    return res.status(403).json({ msg: 'You are not authorized to claim this coupon' });
  }
  coupon.used = true;
  coupon.usedAt = new Date();
  // Record the claiming user's display name (prefer user's email/phone or review name)
  let claimerName = null;
  try {
    const u = await User.findById(req.user.id);
    if (u) claimerName = u.email || u.phone || null;
  } catch (e) { /* ignore */ }
  if (!claimerName && coupon.review) {
    const r = await Review.findById(coupon.review);
    if (r) claimerName = r.name || null;
  }
  coupon.claimedBy = claimerName;
  await coupon.save();
  res.json({ msg: 'Coupon claimed', coupon });
});

// POST /api/rewards/scan - lookup coupon by code for scanning via camera
router.post('/scan', couponLimiter, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ msg: 'Coupon code required' });
  const coupon = await Coupon.findOne({ code }).populate('station user review');
  if (!coupon) return res.status(404).json({ msg: 'Coupon not found' });

  // Prefer friendly station name if available
  let stationName = null;
  if (coupon.station) {
    stationName = coupon.station.name || coupon.station.stationName || null;
  }

  res.json({
    code: coupon.code,
    used: !!coupon.used,
    station: stationName,
    coupon
  });
});

module.exports = router;
