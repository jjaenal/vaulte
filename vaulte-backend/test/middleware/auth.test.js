const { authenticateToken, optionalAuth, requireWalletOwnership, validateApiKey } = require('../../src/middleware/auth');
const { verifyToken, extractTokenFromHeader } = require('../../src/utils/auth');

// Mock dependencies
jest.mock('../../src/utils/auth', () => ({
  verifyToken: jest.fn(),
  extractTokenFromHeader: jest.fn()
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      params: {},
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should call next() when token is valid', () => {
      // Setup
      req.headers.authorization = 'Bearer valid-token';
      extractTokenFromHeader.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: '123', walletAddress: '0xabc' });

      // Execute
      authenticateToken(req, res, next);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual({ userId: '123', walletAddress: '0xabc' });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when token is missing', () => {
      // Setup
      req.headers.authorization = undefined;
      extractTokenFromHeader.mockReturnValue(null);

      // Execute
      authenticateToken(req, res, next);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      // Setup
      req.headers.authorization = 'Bearer invalid-token';
      extractTokenFromHeader.mockReturnValue('invalid-token');
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Execute
      authenticateToken(req, res, next);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer invalid-token');
      expect(verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      // Setup
      req.headers.authorization = 'Bearer expired-token';
      extractTokenFromHeader.mockReturnValue('expired-token');
      verifyToken.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Execute
      authenticateToken(req, res, next);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer expired-token');
      expect(verifyToken).toHaveBeenCalledWith('expired-token');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should set req.user when token is valid', () => {
      // Setup
      req.headers.authorization = 'Bearer valid-token';
      extractTokenFromHeader.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: '123', walletAddress: '0xabc' });

      // Execute
      optionalAuth(req, res, next);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid-token');
      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual({ userId: '123', walletAddress: '0xabc' });
      expect(next).toHaveBeenCalled();
    });

    it('should set req.user to null when token is missing', () => {
      // Setup
      req.headers.authorization = undefined;
      extractTokenFromHeader.mockReturnValue(null);

      // Execute
      optionalAuth(req, res, next);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith(undefined);
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should set req.user to null when token is invalid', () => {
      // Setup
      req.headers.authorization = 'Bearer invalid-token';
      extractTokenFromHeader.mockReturnValue('invalid-token');
      verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      console.warn = jest.fn(); // Mock console.warn

      // Execute
      optionalAuth(req, res, next);

      // Assert
      expect(extractTokenFromHeader).toHaveBeenCalledWith('Bearer invalid-token');
      expect(verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(req.user).toBeNull();
      expect(console.warn).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireWalletOwnership', () => {
    it('should call next() when wallet address matches', () => {
      // Setup
      req.user = { walletAddress: '0xabc123' };
      req.params.address = '0xABC123'; // Different case but same address

      // Execute
      requireWalletOwnership(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      // Setup
      req.user = undefined;

      // Execute
      requireWalletOwnership(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when wallet address is missing', () => {
      // Setup
      req.user = { walletAddress: '0xabc123' };
      // No address in params, body, or query

      // Execute
      requireWalletOwnership(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Wallet address required',
        code: 'ADDRESS_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when wallet address does not match', () => {
      // Setup
      req.user = { walletAddress: '0xabc123' };
      req.params.address = '0xdef456'; // Different address

      // Execute
      requireWalletOwnership(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied: wallet address mismatch',
        code: 'WALLET_MISMATCH'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should check address from body if not in params', () => {
      // Setup
      req.user = { walletAddress: '0xabc123' };
      req.body.address = '0xABC123'; // Different case but same address

      // Execute
      requireWalletOwnership(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should check address from query if not in params or body', () => {
      // Setup
      req.user = { walletAddress: '0xabc123' };
      req.query.address = '0xABC123'; // Different case but same address

      // Execute
      requireWalletOwnership(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateApiKey', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.API_KEYS = 'key1,key2,key3';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should call next() when API key is valid', () => {
      // Setup
      req.headers['x-api-key'] = 'key2';

      // Execute
      validateApiKey(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 when API key is missing', () => {
      // Setup
      req.headers['x-api-key'] = undefined;

      // Execute
      validateApiKey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'API key required',
        code: 'API_KEY_MISSING'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when API key is invalid', () => {
      // Setup
      req.headers['x-api-key'] = 'invalid-key';

      // Execute
      validateApiKey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid API key',
        code: 'API_KEY_INVALID'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty API_KEYS environment variable', () => {
      // Setup
      delete process.env.API_KEYS;
      req.headers['x-api-key'] = 'any-key';

      // Execute
      validateApiKey(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid API key',
        code: 'API_KEY_INVALID'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});