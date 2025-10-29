/**
 * Global Error Handling Middleware
 * Formats errors consistently and avoids leaking stack traces in production/test.
 */

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';

  const isDev = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    error: true,
    code,
    message,
    stack: isDev ? err.stack : undefined
  });
}

module.exports = { errorHandler };