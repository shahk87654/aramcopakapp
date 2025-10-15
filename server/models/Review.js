const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  rating: { type: Number, min: 1, max: 5, required: true },
  name: { type: String },
  contact: { type: String },
  cleanliness: { type: Number, min: 0, max: 5 },
  serviceSpeed: { type: Number, min: 0, max: 5 },
  staffFriendliness: { type: Number, min: 0, max: 5 },
  comment: { type: String },
  ip: { type: String },
  deviceId: { type: String },
  createdAt: { type: Date, default: Date.now },
  rewardGiven: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  gps: {
    lat: Number,
    lng: Number
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
