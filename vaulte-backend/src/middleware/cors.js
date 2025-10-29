const cors = require('cors');

/**
 * Creates a configured CORS middleware with an allow list.
 */
function createCors() {
  const envOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const allowList = envOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  const options = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowList.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
    optionsSuccessStatus: 204,
    preflightContinue: false,
  };

  return cors(options);
}

module.exports = { createCors };