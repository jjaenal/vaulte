const { verifyToken, extractTokenFromHeader } = require('../utils/auth');

/**
 * Authentication middleware for Vaulté API
 * Verifies JWT tokens and adds user info to request object
 */

/**
 * Middleware to authenticate JWT tokens
 * Adds user info to req.user if token is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    let statusCode = 401;
    let errorCode = 'TOKEN_INVALID';
    
    if (error.message === 'Token expired') {
      errorCode = 'TOKEN_EXPIRED';
    }

    return res.status(statusCode).json({
      success: false,
      error: error.message,
      code: errorCode
    });
  }
}

/**
 * Optional authentication middleware
 * Adds user info to req.user if token is present and valid
 * Does not block request if token is missing or invalid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
  } catch (error) {
    // Log error but don't block request
    console.warn('Optional auth failed:', error.message);
    req.user = null;
  }

  next();
}

/**
 * Middleware to check if user owns a specific wallet address
 * Must be used after authenticateToken middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requireWalletOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const requestedAddress = req.params.address || req.body.address || req.query.address;
  
  if (!requestedAddress) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address required',
      code: 'ADDRESS_REQUIRED'
    });
  }

  // Compare wallet addresses (case-insensitive)
  if (req.user.walletAddress.toLowerCase() !== requestedAddress.toLowerCase()) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: wallet address mismatch',
      code: 'WALLET_MISMATCH'
    });
  }

  next();
}

/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks on login/signup
 * @param {number} maxAttempts - Maximum attempts per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware function
 */
function createAuthRateLimit(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const attempts = new Map();

  return (req, res, next) => {
    // Disable rate limiting during tests to avoid flakiness
    if (process.env.NODE_ENV === 'test') {
      return next();
    }
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }

    const clientAttempts = attempts.get(clientId);
    
    if (!clientAttempts) {
      attempts.set(clientId, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }

    if (clientAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - clientAttempts.firstAttempt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Too many authentication attempts. Try again in ${timeLeft} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: timeLeft
      });
    }

    clientAttempts.count++;
    next();
  };
}

/**
 * Middleware to validate API key for public endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'API_KEY_MISSING'
    });
  }

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'API_KEY_INVALID'
    });
  }

  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireWalletOwnership,
  createAuthRateLimit,
  validateApiKey
};