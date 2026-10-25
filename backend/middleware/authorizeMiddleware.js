/**
 * Authorization middleware to check repository ownership.
 */
function authorizeOwner(getOwnerIdFromRequest) {
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ownerId = getOwnerIdFromRequest(req);
    if (!ownerId) {
      return next();
    }

    if (req.user.id.toString() !== ownerId.toString()) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission for this resource' });
    }

    next();
  };
}

module.exports = { authorizeOwner };
