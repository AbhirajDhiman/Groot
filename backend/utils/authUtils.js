const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'groot-secret-jwt-key-2026';

let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
} catch {
  // bcryptjs not available, fall back to built-in crypto
}

/**
 * Hashes a plaintext password using bcryptjs if installed, or crypto.scryptSync as fallback.
 */
async function hashPassword(plainPassword) {
  if (bcrypt) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword, salt);
  }

  // Built-in crypto fallback
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainPassword, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Compares a plaintext password against a stored hashed password.
 */
async function comparePassword(plainPassword, hashedPassword) {
  if (!hashedPassword) return false;

  if (hashedPassword.startsWith('scrypt:')) {
    const [, salt, key] = hashedPassword.split(':');
    const derivedKey = crypto.scryptSync(plainPassword, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
  }

  if (bcrypt) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // If password was hashed with bcrypt but bcryptjs is missing
  return false;
}

/**
 * Generates a signed JWT token.
 */
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifies a JWT token.
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  JWT_SECRET,
};
