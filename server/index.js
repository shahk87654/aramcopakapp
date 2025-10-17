
// Load environment variables from the .env file next to this index.js to ensure
// dotenv is applied even when Node is started from the repo root or another CWD.
const path = require('path');
const fs = require('fs');
const dotenvPath = path.join(__dirname, '.env');
require('dotenv').config({ path: dotenvPath });
console.log(`Loaded environment from ${dotenvPath}`);
// Auto-map common provider environment variable names to MONGO_URI if absent.
// Some hosts (Railway, Render, etc.) expose the DB connection as DATABASE_URL or MONGODB_URI.
// Copy those into MONGO_URI so our code (and other scripts) can read a single canonical name.
if (!process.env.MONGO_URI) {
  if (process.env.DATABASE_URL) {
    process.env.MONGO_URI = process.env.DATABASE_URL;
    console.log('Mapped DATABASE_URL -> MONGO_URI for compatibility');
  } else if (process.env.MONGODB_URI) {
    process.env.MONGO_URI = process.env.MONGODB_URI;
    console.log('Mapped MONGODB_URI -> MONGO_URI for compatibility');
  }
}
// Diagnostic: report which Mongo-related environment variables are present (only names, not values)
const _presentMongoVars = [];
['MONGO_URI','MONGODB_URI','DATABASE_URL','DB_URI','MONGO','mongodb','MONGODB','MONGO_HOST','MONGO_PORT','MONGO_DBNAME','DB_NAME'].forEach(k => {
  if (Object.prototype.hasOwnProperty.call(process.env, k)) _presentMongoVars.push(k);
});
if (_presentMongoVars.length) {
  console.log('Using Mongo env vars detected:', _presentMongoVars.join(', '));
} else {
  console.log('No Mongo env vars detected at startup.');
}
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const app = express();

// When running behind a reverse proxy (Railway, Render, Vercel, etc.) the
// X-Forwarded-For header will be set by the platform. express-rate-limit and
// other middleware rely on Express's `trust proxy` setting to read the
// originating client IP correctly. Default to trusting the proxy unless the
// environment explicitly disables it by setting TRUST_PROXY=false.
const trustProxy = process.env.TRUST_PROXY !== 'false';
if (trustProxy) {
  app.set('trust proxy', true);
  console.log('Express trust proxy enabled');
} else {
  console.log('Express trust proxy disabled (TRUST_PROXY=false)');
}

// Security middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// Limit request body size and enable CORS
app.use(express.json({ limit: '10kb' }));
app.use(cors({ origin: true }));



// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/captcha', require('./routes/captcha'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/health', require('./routes/health'));
// Dev-only routes (seed, debug) - do not enable in production
if (process.env.NODE_ENV !== 'production') {
  try {
    app.use('/api/dev', require('./routes/dev'));
    console.log('Dev routes enabled at /api/dev');
  } catch (err) {
    console.warn('Dev routes not available:', err.message);
  }
}

const connectToDatabase = require('./utils/mongodb');

// Connect to MongoDB
connectToDatabase()
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Placeholder for routes
// If a client build exists, serve it (so the built client can call relative /api paths)
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  console.log('Serving client build from', clientBuildPath);
  app.use(express.static(clientBuildPath));
  // Any non-API route should return the client's index.html
  app.get('*', (req, res) => {
    // If the request is for an API route (including exact '/api'), skip to the API handlers
    // Previously this checked only for '/api/' which allowed exact '/api' to fall through
    // and return the frontend index.html. Treat any path starting with '/api' as an API route.
    if (req.path.startsWith('/api')) return res.status(404).json({ msg: 'Not found' });
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send('Aramco Review API running'));
}

const BASE_PORT = parseInt(process.env.PORT, 10) || 5000;

// Try to listen, if port is in use try incrementally up to 5 times
function startServer(port, attemptsLeft = 5) {
  const server = app.listen(port, () => console.log(`Server running on port ${port}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1, attemptsLeft - 1);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
}

startServer(BASE_PORT);

// Log unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
