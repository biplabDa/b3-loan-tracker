const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const env = require('../config/env');

async function login(username, password) {
  if (!username || !password) {
    const error = new Error('Username and password are required.');
    error.statusCode = StatusCodes.BAD_REQUEST;
    throw error;
  }

  if (username !== env.admin.username) {
    const error = new Error('Invalid credentials.');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  const hash = env.admin.passwordHash;
  let valid = false;

  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    valid = await bcrypt.compare(password, hash);
  } else {
    valid = password === hash;
  }

  if (!valid) {
    const error = new Error('Invalid credentials.');
    error.statusCode = StatusCodes.UNAUTHORIZED;
    throw error;
  }

  const token = jwt.sign({ username, role: 'admin' }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn
  });

  return { token };
}

module.exports = { login };
