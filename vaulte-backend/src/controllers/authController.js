const { 
  generateToken, 
  verifyWalletSignature, 
  generateAuthMessage, 
  generateNonce,
  isValidEthereumAddress,
  hashPassword,
  comparePassword
} = require('../utils/auth');

/**
 * Authentication controller for Vaulté API
 * Handles wallet-based authentication and traditional email/password auth
 */

// In-memory storage for nonces (in production, use Redis)
const nonces = new Map();

/**
 * Generate authentication nonce for wallet signing
 * @route GET /api/auth/nonce/:address
 */
async function getNonce(req, res) {
  try {
    const { address } = req.params;

    // Validate Ethereum address
    if (!isValidEthereumAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format',
        code: 'INVALID_ADDRESS'
      });
    }

    // Generate nonce and message
    const nonce = generateNonce();
    const message = generateAuthMessage(address, nonce);

    // Store nonce with expiration (5 minutes)
    nonces.set(address.toLowerCase(), {
      nonce,
      message,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Clean expired nonces
    cleanExpiredNonces();

    res.json({
      success: true,
      data: {
        nonce,
        message,
        expiresIn: 300 // 5 minutes
      }
    });
  } catch (error) {
    console.error('Get nonce error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate nonce',
      code: 'NONCE_GENERATION_FAILED'
    });
  }
}

/**
 * Authenticate user with wallet signature
 * @route POST /api/auth/wallet
 */
async function authenticateWallet(req, res) {
  try {
    const { address, signature, message } = req.body;

    // Validate required fields
    if (!address || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Address, signature, and message are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate Ethereum address
    if (!isValidEthereumAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format',
        code: 'INVALID_ADDRESS'
      });
    }

    // Check if nonce exists and is valid
    const storedData = nonces.get(address.toLowerCase());
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'Nonce not found. Please request a new nonce.',
        code: 'NONCE_NOT_FOUND'
      });
    }

    // Check if nonce is expired
    if (Date.now() > storedData.expiresAt) {
      nonces.delete(address.toLowerCase());
      return res.status(400).json({
        success: false,
        error: 'Nonce expired. Please request a new nonce.',
        code: 'NONCE_EXPIRED'
      });
    }

    // Verify message matches stored message
    if (message !== storedData.message) {
      return res.status(400).json({
        success: false,
        error: 'Message mismatch',
        code: 'MESSAGE_MISMATCH'
      });
    }

    // Verify wallet signature
    const isValidSignature = verifyWalletSignature(message, signature, address);
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE'
      });
    }

    // Remove used nonce
    nonces.delete(address.toLowerCase());

    // Generate JWT token
    const token = generateToken({
      userId: address.toLowerCase(), // Use address as user ID for now
      walletAddress: address.toLowerCase(),
      authMethod: 'wallet'
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: address.toLowerCase(),
          walletAddress: address.toLowerCase(),
          authMethod: 'wallet'
        }
      }
    });
  } catch (error) {
    console.error('Wallet authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}

/**
 * Register user with email and password (optional traditional auth)
 * @route POST /api/auth/register
 */
async function register(req, res) {
  try {
    const { email, password, walletAddress } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate wallet address if provided
    if (walletAddress && !isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format',
        code: 'INVALID_ADDRESS'
      });
    }

    // Hash password (simulated persistence)
    await hashPassword(password);

    // TODO: Save user to database
    // For now, return success with mock user data
    const userId = `user_${Date.now()}`;

    // Generate JWT token
    const token = generateToken({
      userId,
      email,
      walletAddress: walletAddress?.toLowerCase() || null,
      authMethod: 'email'
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          email,
          walletAddress: walletAddress?.toLowerCase() || null,
          authMethod: 'email'
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED'
    });
  }
}

/**
 * Login user with email and password
 * @route POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // TODO: Get user from database and verify password
    // For now, return mock authentication
    
    // Mock password verification (replace with actual database lookup)
    const mockUser = {
      id: 'user_123',
      email,
      walletAddress: null,
      passwordHash: await hashPassword('password123') // Mock hash
    };

    const isValidPassword = await comparePassword(password, mockUser.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: mockUser.id,
      email: mockUser.email,
      walletAddress: mockUser.walletAddress,
      authMethod: 'email'
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          walletAddress: mockUser.walletAddress,
          authMethod: 'email'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_FAILED'
    });
  }
}

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
async function getProfile(req, res) {
  try {
    // User info is available from authenticateToken middleware
    const user = req.user;

    // TODO: Get additional user data from database
    // For now, return token data
    res.json({
      success: true,
      data: {
        user: {
          id: user.userId,
          email: user.email || null,
          walletAddress: user.walletAddress || null,
          authMethod: user.authMethod
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
}

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh
 */
async function refreshToken(req, res) {
  try {
    const user = req.user;

    // Generate new token with same payload
    const newToken = generateToken({
      userId: user.userId,
      email: user.email,
      walletAddress: user.walletAddress,
      authMethod: user.authMethod
    });

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token',
      code: 'TOKEN_REFRESH_FAILED'
    });
  }
}

/**
 * Clean expired nonces from memory
 */
function cleanExpiredNonces() {
  const now = Date.now();
  for (const [address, data] of nonces.entries()) {
    if (now > data.expiresAt) {
      nonces.delete(address);
    }
  }
}

// Clean expired nonces every 5 minutes (disabled in tests to avoid open handles)
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanExpiredNonces, 5 * 60 * 1000);
}

module.exports = {
  getNonce,
  authenticateWallet,
  register,
  login,
  getProfile,
  refreshToken
};