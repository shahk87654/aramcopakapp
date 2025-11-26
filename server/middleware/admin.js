const User = require('../models/User');

module.exports = async function (req, res, next) {
  // If auth middleware provided no user or an anonymous id, treat as unauthorized
  if (!req.user || !req.user.id) {
    console.debug('Admin middleware: no authenticated user present');
    return res.status(401).json({ msg: 'Unauthorized' });
  }
  
  // Development shortcut: accept the dev-admin id without querying the DB.
  // For safety, in production this shortcut is disabled unless the host
  // explicitly opts-in by setting ALLOW_DEV_ADMIN=true in the environment.
  if (req.user.id === 'dev-admin') {
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_ADMIN === 'true') {
      return next();
    }
    return res.status(403).json({ msg: 'Dev admin not allowed in production' });
  }
  
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) return res.status(403).json({ msg: 'Admin only' });
    next();
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
