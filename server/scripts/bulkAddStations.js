const mongoose = require('mongoose');
const Station = require('../models/Station');
require('dotenv').config({ path: __dirname + '/../.env' });

const stations = [
  { name: 'COCO ARAMCO 1 - LIBERTY', stationId: '1' },
  { name: 'COCO ARAMCO 2 - EMBASSY', stationId: '2' },
  { name: 'COCO ARAMCO 3 - EXPO', stationId: '3' },
  { name: 'COCO ARAMCO 4 - SHAHDRA', stationId: '4' },
  { name: 'COCO ARAMCO 5 - HAYATABAD', stationId: '5' },
  { name: 'COCO ARAMCO 6 - WAZIRABAD', stationId: '6' },
  { name: 'COCO ARAMCO 7 - UCH NORTH', stationId: '7' },
  { name: 'COCO ARAMCO 8 - UCH SOUTH', stationId: '8' },
  { name: 'COCO ARAMCO 9 - RASHID MINHAS', stationId: '9' },
  { name: 'COCO ARAMCO 10 - WAHDAT', stationId: '10' },
  { name: 'COCO ARAMCO 11 - FAISALABAD', stationId: '11' },
  { name: 'COCO ARAMCO 12 - SABZAZAR', stationId: '12' },
  { name: 'COCO ARAMCO 13 - FAISAL TOWN', stationId: '13' },
  { name: 'COCO ARAMCO 14 - GUJRANWALA', stationId: '14' },
  { name: 'COCO ARAMCO 15 - MULTAN', stationId: '15' },
  { name: 'COCO ARAMCO 16 - SIALKOT', stationId: '16' },
  { name: 'COCO ARAMCO 17 - KAHNEWAL', stationId: '17' },
  { name: 'COCO ARAMCO 18 - SADAR LAHORE', stationId: '18' },
  { name: 'COCO ARAMCO 19 - LYALPUR FAISALABAD', stationId: '19' },
  { name: 'COCO ARAMCO 20 - G1 JOHAR TOWN', stationId: '20' },
  { name: 'COCO ARAMCO 21 - SARAI ALAMGIR', stationId: '21' },
  { name: 'COCO ARAMCO 22 - SARGODHA ROAD', stationId: '22' },
  { name: 'COCO ARAMCO 23 - WALTON', stationId: '23' },
  { name: 'COCO ARAMCO 24 - MK', stationId: '24' },
  { name: 'COCO ARAMCO 25 - ATTOCK', stationId: '25' },
  { name: 'COCO ARAMCO 26 - TIPU ROAD', stationId: '26' },
  { name: 'COCO ARAMCO 27 - LODHRAN', stationId: '27' },
  { name: 'COCO ARAMCO 28 - RAIWIND', stationId: '28' },
  { name: 'COCO ARAMCO 29 - SARGODHA', stationId: '29' },
  { name: 'COCO ARAMCO 30 - HARRAPA', stationId: '30' },
  { name: 'COCO ARAMCO 31 - COLLEGE ROAD', stationId: '31' },
  { name: 'COCO ARAMCO 32 - FEROZPUR ROAD', stationId: '32' },
  { name: 'COCO ARAMCO 33 - SHADMAN', stationId: '33' },
  { name: 'COCO ARAMCO 34 - BHALWAL', stationId: '34' },
  { name: 'COCO ARAMCO 35 - CANAL ROAD', stationId: '35' },
  { name: 'COCO ARAMCO 36 - UET', stationId: '36' },
  { name: 'COCO ARAMCO 37 - SARGODHA ROAD', stationId: '37' },
  { name: 'COCO ARAMCO 38 - CHUNG', stationId: '38' },
  { name: 'COCO ARAMCO 39 - GUJRANWALA 2', stationId: '39' },
  { name: 'COCO ARAMCO 40 - PHOOL NAGAR', stationId: '40' },
  { name: 'COCO ARAMCO 41 - CHARSADDA', stationId: '41' },
  { name: 'COCO ARAMCO 42 - BAHWAL NAGAR', stationId: '42' },
  { name: 'COCO ARAMCO 43 - RAWALPINDI PAF JINNAH COMPLEX', stationId: '43' },
  { name: 'COCO ARAMCO 44 - MOON MARKET LAHORE', stationId: '44' },
  { name: 'COCO ARAMCO 45 - NAZIMABAD', stationId: '45' },
  { name: 'COCO ARAMCO 46 - MANGALLA', stationId: '46' },
  { name: 'COCO ARAMCO 47 - WIRELESS GATE', stationId: '47' },
  { name: 'COCO ARAMCO 48 - SIALKOT 2', stationId: '48' },
  { name: 'COCO ARAMCO 49 - SAHIWAL', stationId: '49' },
  { name: 'COCO ARAMCO 50 - ISLAMABAD SRINAGAR HIGHWAY', stationId: '50' }
];

// Dummy coordinates for all stations (Lahore)
const lng = 74.3587;
const lat = 31.5204;

function detectDbNameFromUri(uri) {
  if (!uri) return null;
  try {
    const m = uri.match(/\/([^\/?]+)(?:\?|$)/);
    if (m && m[1]) return m[1];
  } catch (e) {
    // ignore
  }
  return null;
}

async function run() {
  // Prefer an explicit env var, else try to detect from URI. Avoid defaulting to 'admin'.
  const dbName = process.env.MONGO_DBNAME || process.env.DB_NAME || detectDbNameFromUri(process.env.MONGO_URI) || null;
  const connectOptions = { useNewUrlParser: true, useUnifiedTopology: true };
  if (dbName) connectOptions.dbName = dbName;
  await mongoose.connect(process.env.MONGO_URI, connectOptions);
  for (const s of stations) {
    try {
      const res = await Station.findOneAndUpdate(
        { stationId: s.stationId },
        {
          $set: {
            name: s.name,
            stationId: s.stationId,
            location: { type: 'Point', coordinates: [lng, lat] }
          }
        },
        { upsert: true, new: true }
      );
      if (res) {
        // If upsert created the doc, Mongo returns the doc. We'll assume creation or update succeeded
        console.log('Upserted:', s.name);
      }
    } catch (e) {
      console.log('Error upserting', s.name, e.message);
    }
  }
  await mongoose.disconnect();
  console.log('Done!');
}

run();
