const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'cbook_internal_key';

function hasInternalKey(req) {
  return req.headers['x-internal-api-key'] === INTERNAL_API_KEY;
}

function getUserContext(req) {
  return {
    userId: req.headers['x-user-id'] || null,
    role: req.headers['x-user-role'] || null
  };
}

exports.isLoggedIn = (req, res, next) => {
  if (!hasInternalKey(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized client' });
  }

  const { userId } = getUserContext(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  req.authUser = getUserContext(req);
  return next();
};

exports.isAdmin = (req, res, next) => {
  if (!hasInternalKey(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized client' });
  }

  const { userId, role } = getUserContext(req);
  if (!userId || role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  req.authUser = getUserContext(req);
  return next();
};
