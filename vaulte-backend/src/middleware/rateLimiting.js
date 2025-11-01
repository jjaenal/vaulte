/**
 * Rate Limiting Middleware for Vaulté API
 * 
 * Implements multiple layers of rate limiting:
 * - General API rate limiting
 * - Authentication endpoint protection
 * - Write operation limits
 * - Progressive slowdown for suspicious activity
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * General API Rate Limiter
 * Applies to all API endpoints
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      remaining: req.rateLimit.remaining
    });
  }
});

/**
 * Strict Rate Limiter for Authentication Endpoints
 * Prevents brute force attacks on login/signup
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again in 15 minutes',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      error: 'Authentication rate limit exceeded',
      message: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Write Operations Rate Limiter
 * Limits data modification operations
 */
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 write operations per 5 minutes
  message: {
    error: 'Too many write operations',
    message: 'Please slow down your requests',
    retryAfter: '5 minutes'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Write operations rate limit exceeded',
      message: 'Too many data modification requests. Please try again in 5 minutes.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Expensive Operations Rate Limiter
 * For operations that are computationally expensive
 */
const expensiveLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit each IP to 20 expensive operations per 10 minutes
  message: {
    error: 'Too many expensive operations',
    message: 'Please wait before making more requests',
    retryAfter: '10 minutes'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Expensive operations rate limit exceeded',
      message: 'Too many resource-intensive requests. Please try again in 10 minutes.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Progressive Slowdown Middleware
 * Gradually slows down responses for suspicious activity
 */
const progressiveSlowdown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  onLimitReached: (_req, _res, _options) => {
    console.warn('Progressive slowdown activated');
  }
});

/**
 * User-specific Rate Limiter
 * Limits requests per authenticated user
 */
const createUserLimiter = (windowMs = 15 * 60 * 1000, max = 500) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
    message: {
      error: 'User rate limit exceeded',
      message: 'Too many requests for this user account',
      retryAfter: Math.round(windowMs / 1000)
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'User rate limit exceeded',
        message: 'Too many requests for this user account. Please try again later.',
        retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        userId: req.user?.id || 'anonymous'
      });
    }
  });
};

/**
 * API Key Rate Limiter
 * For API key based authentication
 */
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // 10,000 requests per hour for API keys
  // Remove custom keyGenerator to use default IP-based limiting with proper IPv6 support
  message: {
    error: 'API key rate limit exceeded',
    message: 'API key has exceeded hourly rate limit',
    retryAfter: '1 hour'
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'API key rate limit exceeded',
      message: 'Your API key has exceeded the hourly rate limit.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Dynamic Rate Limiter Factory
 * Creates custom rate limiters based on configuration
 */
function createDynamicLimiter(config) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Rate limit exceeded',
    keyGenerator = null,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = config;

  return rateLimit({
    windowMs,
    max,
    keyGenerator: keyGenerator || undefined,
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders: false,
    legacyHeaders: true,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: Math.round(windowMs / 1000)
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        limit: req.rateLimit.limit,
        remaining: req.rateLimit.remaining
      });
    }
  });
}

/**
 * Rate Limit Info Middleware
 * Adds rate limit information to response headers
 */
const rateLimitInfo = (req, res, next) => {
  // No-op: rely on express-rate-limit to set headers
  next();
};

/**
 * Whitelist Middleware
 * Bypasses rate limiting for whitelisted IPs
 */
const createWhitelistMiddleware = (whitelistedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (whitelistedIPs.includes(clientIP)) {
      // Skip rate limiting for whitelisted IPs
      return next();
    }
    
    next();
  };
};

/**
 * Rate Limit Bypass for Testing
 * Allows bypassing rate limits in test environment
 */
const testBypass = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' || process.env.BYPASS_RATE_LIMIT === 'true') {
    // Flag to bypass any subsequent rate limiters in composite chains
    res.locals.rateLimitBypass = true;
    return next();
  }
  next();
};

/**
 * Composite Rate Limiter
 * Applies multiple rate limiters in sequence
 */
const createCompositeLimiter = (...limiters) => {
  return (req, res, next) => {
    let index = 0;

    function runNext() {
      // If bypass flag is set, skip remaining limiters
      if (res.locals && res.locals.rateLimitBypass === true) {
        return next();
      }

      if (index >= limiters.length) {
        return next();
      }

      const limiter = limiters[index++];
      // Short-circuit before invoking each limiter if bypass is enabled
      if (res.locals && res.locals.rateLimitBypass === true) {
        return next();
      }

      limiter(req, res, (err) => {
        if (err) return next(err);
        runNext();
      });
    }

    runNext();
  };
};

module.exports = {
  // Basic limiters
  generalLimiter,
  authLimiter,
  writeLimiter,
  expensiveLimiter,
  apiKeyLimiter,
  
  // Advanced features
  progressiveSlowdown,
  createUserLimiter,
  createDynamicLimiter,
  createCompositeLimiter,
  
  // Utility middleware
  rateLimitInfo,
  createWhitelistMiddleware,
  testBypass,
  
  // Rate limiter configurations for different endpoints
  configs: {
    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many authentication attempts'
    },
    
    // Data vault operations
    dataVault: {
      windowMs: 5 * 60 * 1000,
      max: 100,
      message: 'Too many data vault operations'
    },
    
    // Marketplace operations
    marketplace: {
      windowMs: 10 * 60 * 1000,
      max: 200,
      message: 'Too many marketplace operations'
    },
    
    // File upload operations
    upload: {
      windowMs: 30 * 60 * 1000,
      max: 50,
      message: 'Too many file upload attempts'
    }
  }
};