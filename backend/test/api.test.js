const assert = require('assert');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../utils/authUtils');
const { createGrootApp } = require('../server');
const User = require('../models/userModel');
const Repository = require('../models/repoModel');
const Issue = require('../models/issueModel');

async function runApiTests() {
  console.log('\n--- Running Groot API & Architecture Tests ---');

  // 1. Test Auth Utils
  console.log('Testing: Password hashing and comparison');
  const password = 'SecretGrootPassword123!';
  const hashed = await hashPassword(password);
  assert.ok(hashed && hashed.length > 10, 'Hash must be generated');

  const isMatch = await comparePassword(password, hashed);
  assert.strictEqual(isMatch, true, 'Correct password must match');

  const isWrongMatch = await comparePassword('wrong-password', hashed);
  assert.strictEqual(isWrongMatch, false, 'Incorrect password must not match');

  // 2. Test JWT Token Handling
  console.log('Testing: JWT Token issuance and verification');
  const payload = { id: 'user_12345', username: 'iamgroot' };
  const token = generateToken(payload);
  assert.ok(token && typeof token === 'string', 'Token must be a string');

  const decoded = verifyToken(token);
  assert.strictEqual(decoded.id, payload.id, 'Decoded user ID must match');
  assert.strictEqual(decoded.username, payload.username, 'Decoded username must match');

  // 3. Test Mongoose Models Schema
  console.log('Testing: Mongoose models schema integrity');
  assert.ok(User.schema.paths.username, 'User schema must have username path');
  assert.ok(User.schema.paths.email, 'User schema must have email path');
  assert.ok(User.schema.paths.password, 'User schema must have password path');

  assert.ok(Repository.schema.paths.name, 'Repository schema must have name path');
  assert.ok(Repository.schema.paths.owner, 'Repository schema must have owner path');
  assert.ok(Repository.schema.paths.visibility, 'Repository schema must have visibility path');

  assert.ok(Issue.schema.paths.title, 'Issue schema must have title path');
  assert.ok(Issue.schema.paths.status, 'Issue schema must have status path');
  assert.ok(Issue.schema.paths.repository, 'Issue schema must have repository path');

  // 4. Test Express App Setup & Router
  console.log('Testing: Express application routes setup');
  const app = createGrootApp();
  assert.ok(app, 'Groot app must be instantiated');

  console.log('\n[PASS] All Groot API & Architecture Tests passed successfully!');
  return true;
}

module.exports = { runApiTests };

if (require.main === module) {
  runApiTests().catch((err) => {
    console.error('[FAIL] API test failure:', err);
    process.exit(1);
  });
}
