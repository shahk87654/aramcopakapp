const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Accept Authorization or authorization headers, with or without 'Bearer '
  const raw = req.header('Authorization') || req.header('authorization') || '';
  const token = raw.replace(/^Bearer\s+/i, '');
  // If no token supplied, continue as anonymous (some endpoints allow anonymous submissions, e.g., reviews)
  if (!token) {
    req.user = { id: null };
    return next();
  }
  // Development convenience: accept a hardcoded dev token and inject an admin user.
  // For usability we allow this token even in production when present (but keep it simple).
  if (token === 'dev-admin-token') {
    req.user = { id: 'dev-admin', isAdmin: true };
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};
