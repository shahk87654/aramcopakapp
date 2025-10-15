#!/usr/bin/env node
// deleteTestReviews.js
// Safe script to remove test reviews from the database.
// By default this performs a dry-run and lists matched documents. Use --run to perform deletions.

const connectToDatabase = require('../utils/mongodb');
const Review = require('../models/Review');

async function main() {
  const args = process.argv.slice(2);
  const doRun = args.includes('--run');
  const limitArgIndex = args.findIndex(a => a === '--limit');
  const limit = limitArgIndex !== -1 ? parseInt(args[limitArgIndex + 1], 10) || 0 : 0;

  // Criteria for test reviews. Adjust as needed.
  // - comment contains 'test' (case-insensitive)
  // - name or contact contains 'test'
  // - rating is 0 or outside expected range (if test data used 0)
  const regex = /test/i;

  const query = {
    $or: [
      { comment: { $regex: regex } },
      { name: { $regex: regex } },
      { contact: { $regex: regex } },
      { ip: { $regex: regex } },
      { deviceId: { $regex: regex } }
    ]
  };

  try {
    await connectToDatabase();

    let cursor = Review.find(query).sort({ createdAt: -1 }).cursor();

    const matched = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      matched.push({ _id: doc._id.toString(), station: doc.station, name: doc.name, contact: doc.contact, comment: doc.comment, createdAt: doc.createdAt });
      if (limit > 0 && matched.length >= limit) break;
    }

    console.log(`Found ${matched.length} review(s) matching test criteria.`);
    if (matched.length > 0) {
      console.table(matched.map(m => ({ _id: m._id, station: m.station ? m.station.toString() : '', name: m.name || '', contact: m.contact || '', createdAt: m.createdAt })));
    }

    if (!doRun) {
      console.log('\nDry-run mode (no deletions performed).');
      console.log('Re-run with --run to delete these reviews. Optional: --limit <N> to limit deletions.');
      process.exit(0);
    }

    // Perform deletions
    const ids = matched.map(m => m._id);
    if (ids.length === 0) {
      console.log('No documents to delete. Exiting.');
      process.exit(0);
    }

    const res = await Review.deleteMany({ _id: { $in: ids } });
    console.log(`Deleted ${res.deletedCount} review(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Error running deleteTestReviews:', err);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}
