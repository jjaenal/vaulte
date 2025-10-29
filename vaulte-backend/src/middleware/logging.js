const morgan = require('morgan');

/**
 * Returns a request logging middleware. Skips logging in test env.
 */
function createLogger() {
  const format = process.env.LOG_FORMAT || 'dev';
  const skip = () => process.env.NODE_ENV === 'test';
  return morgan(format, { skip });
}

module.exports = { createLogger };