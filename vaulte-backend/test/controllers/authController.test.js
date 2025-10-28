const request = require('supertest');
const app = require('../../src/index');
const { ethers } = require('ethers');

describe('Authentication Controller', () => {
  let testWallet;
  let testAddress;

  beforeEach(() => {
    // Create a test wallet for signing
    testWallet = ethers.Wallet.createRandom();
    testAddress = testWallet.address;
  });

  describe('GET /api/auth/nonce/:address', () => {
    it('should generate nonce for valid address', async () => {
      const response = await request(app)
        .get(`/api/auth/nonce/${testAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('nonce');
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('expiresIn');
      expect(response.body.data.expiresIn).toBe(300); // 5 minutes
    });

    it('should reject invalid address format', async () => {
      const response = await request(app)
        .get('/api/auth/nonce/invalid-address')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_ADDRESS');
    });

    it('should generate different nonces for same address', async () => {
      const response1 = await request(app)
        .get(`/api/auth/nonce/${testAddress}`)
        .expect(200);

      const response2 = await request(app)
        .get(`/api/auth/nonce/${testAddress}`)
        .expect(200);

      expect(response1.body.data.nonce).not.toBe(response2.body.data.nonce);
    });
  });

  describe('POST /api/auth/wallet', () => {
    let message;

    beforeEach(async () => {
      // Get nonce first
      const nonceResponse = await request(app)
        .get(`/api/auth/nonce/${testAddress}`)
        .expect(200);

      message = nonceResponse.body.data.message;
    });

    it('should authenticate with valid signature', async () => {
      // Sign the message
      const signature = await testWallet.signMessage(message);

      const response = await request(app)
        .post('/api/auth/wallet')
        .send({
          address: testAddress,
          signature: signature,
          message: message
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.walletAddress).toBe(testAddress.toLowerCase());
      expect(response.body.data.user.authMethod).toBe('wallet');
    });

    it('should reject invalid signature', async () => {
      const response = await request(app)
        .post('/api/auth/wallet')
        .send({
          address: testAddress,
          signature: 'invalid-signature',
          message: message
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_SIGNATURE');
    });

    it('should reject without nonce', async () => {
      const signature = await testWallet.signMessage(message);

      const response = await request(app)
        .post('/api/auth/wallet')
        .send({
          address: '0x1234567890123456789012345678901234567890', // Different address
          signature: signature,
          message: message
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NONCE_NOT_FOUND');
    });

    it('should reject message mismatch', async () => {
      const wrongMessage = 'Wrong message';
      const signature = await testWallet.signMessage(wrongMessage);

      const response = await request(app)
        .post('/api/auth/wallet')
        .send({
          address: testAddress,
          signature: signature,
          message: wrongMessage
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MESSAGE_MISMATCH');
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/wallet')
        .send({
          address: testAddress
          // Missing signature and message
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_FIELDS');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register user with email and password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          walletAddress: testAddress
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.walletAddress).toBe(testAddress.toLowerCase());
      expect(response.body.data.user.authMethod).toBe('email');
    });

    it('should register user without wallet address', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.walletAddress).toBe(null);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_FIELDS');
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          walletAddress: 'invalid-address'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_ADDRESS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials (mock)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123' // This matches the mock password in controller
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_FIELDS');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token first
      const loginResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          walletAddress: testAddress
        })
        .expect(201);

      authToken = loginResponse.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.walletAddress).toBe(testAddress.toLowerCase());
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TOKEN_MISSING');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TOKEN_INVALID');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken;

    beforeEach(async () => {
      // Get auth token first
      const loginResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      authToken = loginResponse.body.data.token;
    });

    it('should refresh token with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).not.toBe(authToken); // Should be different
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TOKEN_MISSING');
    });
  });
});