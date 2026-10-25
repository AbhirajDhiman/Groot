const { verifyToken } = require('../utils/authUtils');

/**
 * Authentication middleware that verifies JWT token in headers.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied: No token provided' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({ error: 'Access denied: Token is malformed' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token', details: err.message });
  }
}

module.exports = authenticateToken;
