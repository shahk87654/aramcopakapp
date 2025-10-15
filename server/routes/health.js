const express = require('express');
const router = express.Router();
const connectToDatabase = require('../utils/mongodb');
const Station = require('../models/Station');

router.get('/', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const dbName = db.databaseName || process.env.MONGO_DBNAME || 'unknown';
    const count = await Station.countDocuments();
    res.json({ ok: true, dbName, stationCount: count });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
