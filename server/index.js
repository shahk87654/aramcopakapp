
require('dotenv').config();
// Diagnostic: report which Mongo-related environment variables are present (only names, not values)
const _presentMongoVars = [];
['MONGO_URI','MONGODB_URI','DATABASE_URL','DB_URI','MONGO_HOST','MONGO_PORT','MONGO_DBNAME','DB_NAME'].forEach(k => {
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

const connectToDatabase = require('./utils/mongodb');

// Connect to MongoDB
connectToDatabase()
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Placeholder for routes
app.get('/', (req, res) => res.send('Aramco Review API running'));

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
