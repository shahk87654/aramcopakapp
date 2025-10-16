const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Station = require('../models/Station');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Helper: check if a review from the same contact (phone) exists in the last 18 hours
// Enforced ONLY by contact when provided. If contact is missing, no cooldown is applied here.
// NOTE: This is global (across stations) and only uses the phone number.
async function hasRecentReview({ contact }) {
  if (!contact) return false; // no contact -> don't block
  const since = new Date(Date.now() - 18 * 60 * 60 * 1000); // 18 hours
  const query = {
    contact,
    createdAt: { $gte: since }
  };
  const count = await Review.countDocuments(query);
  console.log(`[reviews] hasRecentReview: contact="${contact}", since="${since.toISOString()}", count=${count}`);
  return count > 0;
}

// Submit review (allow anonymous submissions)
// We intentionally don't use the global `auth` middleware here because some
// devices may have stale/invalid tokens in storage. Instead we parse any
// provided token leniently: if the token verifies we use the user id, if it
// fails we treat the request as anonymous rather than returning 401.
router.post('/', [
  body('stationId').notEmpty(),
  body('rating').isInt({ min: 1, max: 5 }).toInt(),
  body('cleanliness').optional().isInt({ min: 0, max: 5 }).toInt(),
  body('serviceSpeed').optional().isInt({ min: 0, max: 5 }).toInt(),
  body('staffFriendliness').optional().isInt({ min: 0, max: 5 }).toInt(),
  body('comment').optional().isString(),
  body('name').notEmpty(),
  body('contact').notEmpty(),
  body('gps').optional(),
  body('deviceId').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { stationId, rating, cleanliness, serviceSpeed, staffFriendliness, comment, name, contact, gps, deviceId } = req.body;
  // Lenient token parsing: accept a valid JWT and extract user id; if the
  // token is missing or invalid, continue as anonymous (userId = null).
  let userId = null;
  try {
    const raw = req.header('Authorization') || req.header('authorization') || '';
    const token = raw.replace(/^Bearer\s+/i, '');
    if (token) {
      // Development convenience (dev-admin-token) is not used for regular
      // review submissions; ignore it here.
      if (token !== 'dev-admin-token') {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded?.id || null;
        } catch (err) {
          console.warn('[reviews] Invalid JWT presented; treating as anonymous');
          userId = null;
        }
      }
    }
  } catch (e) {
    console.error('[reviews] Token parse error:', e);
    userId = null;
  }
  try {
    const station = await Station.findOne({ stationId });
    if (!station) return res.status(404).json({ msg: 'Station not found' });
    // Enforce 18-hour restriction: prevent multiple reviews from the same phone number
  const contact = req.body.contact;
  console.log(`[reviews] submit attempt: station="${station.stationId}", contact="${contact}", userId="${userId}", ip="${req.ip}"`);
  // Enforce cooldown only by phone/contact globally for 18 hours
  const recent = await hasRecentReview({ contact });
    if (recent) return res.status(429).json({ msg: 'You can only submit one review per phone number every 18 hours' });
    
    // Create review
    const reviewData = {
      station: station._id,
      rating,
      cleanliness,
      serviceSpeed,
      staffFriendliness,
      comment,
      name,
      contact,
      ip: req.ip,
      deviceId,
      gps
    };
    if (mongoose.isValidObjectId(userId)) reviewData.user = userId;
    const review = new Review(reviewData);
    await review.save();
    // If userId is a valid ObjectId, associate the review with the user
    if (mongoose.isValidObjectId(userId)) {
      try {
        await User.findByIdAndUpdate(userId, { $push: { reviews: review._id } });
      } catch (e) {
        // ignore update errors for development/test users
      }
    }
    // Reward logic
    let user = null;
    if (mongoose.isValidObjectId(userId)) {
      user = await User.findById(userId);
    }
    // Count all reviews for this user/contact (for accurate visit count)
    const phone = req.body.contact;
    const usersWithPhone = await User.find({ phone });
    const userIds = usersWithPhone.map(u => u._id);
    const visits = await Review.countDocuments({ $or: [ { contact: phone }, { user: { $in: userIds } } ] });
    let coupon = null;
    if (visits % 5 === 0) {
      const code = uuidv4();
      coupon = new Coupon({ code, user: mongoose.isValidObjectId(userId) ? userId : null, review: review._id, station: station._id });
      await coupon.save();
      review.rewardGiven = true;
      await review.save();
    }
    // If visits is a multiple of 5, the user just received a reward; next reward is in 5 visits
    const remainder = visits % 5;
    const visitsLeft = remainder === 0 ? 5 : 5 - remainder;
    res.json({ review, coupon, visits, visitsLeft });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
