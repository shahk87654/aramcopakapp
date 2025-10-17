const fetch = require('node-fetch');

// Quick test script to POST two reviews and expect the second to be rejected with 429
// Usage: node server/scripts/test_review_cooldown.js

const base = process.env.BASE_URL || 'http://localhost:3000';

async function postReview(overrides = {}) {
  const body = Object.assign({
    stationId: 'TEST_STATION_123',
    rating: 5,
    name: 'Test User',
    contact: '0000000000',
    comment: 'Test comment',
    deviceId: 'test-device-123'
  }, overrides);
  const res = await fetch(`${base}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

(async () => {
  console.log('Posting first review...');
  const r1 = await postReview();
  console.log('First response:', r1.status, r1.body.slice(0, 200));
  console.log('Posting second review (should be rejected)...');
  const r2 = await postReview();
  console.log('Second response:', r2.status, r2.body.slice(0, 200));
})();
