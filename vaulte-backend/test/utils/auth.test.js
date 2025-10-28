jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn()
}));

jest.mock('ethers', () => ({
  ethers: {
    verifyMessage: jest.fn(),
    isAddress: jest.fn()
  }
}));

const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');

describe('utils/auth', () => {
  const auth = () => require('../../src/utils/auth');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifyToken returns payload when valid', () => {
    jwt.verify.mockReturnValueOnce({ userId: 'u1' });
    const { verifyToken } = auth();
    expect(verifyToken('t')).toEqual({ userId: 'u1' });
  });

  it('verifyToken throws Token expired for TokenExpiredError', () => {
    jwt.verify.mockImplementationOnce(() => {
      const err = new Error('expired');
      err.name = 'TokenExpiredError';
      throw err;
    });
    const { verifyToken } = auth();
    expect(() => verifyToken('t')).toThrow('Token expired');
  });

  it('verifyToken throws Invalid token for JsonWebTokenError', () => {
    jwt.verify.mockImplementationOnce(() => {
      const err = new Error('invalid');
      err.name = 'JsonWebTokenError';
      throw err;
    });
    const { verifyToken } = auth();
    expect(() => verifyToken('t')).toThrow('Invalid token');
  });

  it('verifyToken rethrows unknown errors', () => {
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const { verifyToken } = auth();
    expect(() => verifyToken('t')).toThrow('boom');
  });

  it('verifyWalletSignature returns true when recovered address matches (case-insensitive)', () => {
    ethers.verifyMessage.mockReturnValueOnce('0xABC');
    const { verifyWalletSignature } = auth();
    expect(verifyWalletSignature('msg', 'sig', '0xabc')).toBe(true);
  });

  it('verifyWalletSignature returns false when recovered address differs', () => {
    ethers.verifyMessage.mockReturnValueOnce('0xDEF');
    const { verifyWalletSignature } = auth();
    expect(verifyWalletSignature('msg', 'sig', '0xabc')).toBe(false);
  });

  it('verifyWalletSignature returns false when verifyMessage throws', () => {
    ethers.verifyMessage.mockImplementationOnce(() => { throw new Error('bad sig'); });
    const { verifyWalletSignature } = auth();
    expect(verifyWalletSignature('msg', 'sig', '0xabc')).toBe(false);
  });

  it('extractTokenFromHeader returns null when header missing or not Bearer', () => {
    const { extractTokenFromHeader } = auth();
    expect(extractTokenFromHeader(undefined)).toBeNull();
    expect(extractTokenFromHeader('Basic abc')).toBeNull();
  });

  it('extractTokenFromHeader returns token when Bearer', () => {
    const { extractTokenFromHeader } = auth();
    expect(extractTokenFromHeader('Bearer mytoken')).toBe('mytoken');
  });

  it('isValidEthereumAddress proxies ethers.isAddress', () => {
    ethers.isAddress.mockReturnValueOnce(true);
    const { isValidEthereumAddress } = auth();
    expect(isValidEthereumAddress('0xabc')).toBe(true);
    ethers.isAddress.mockReturnValueOnce(false);
    expect(isValidEthereumAddress('bad')).toBe(false);
  });

  it('uses fallback JWT_SECRET when env not set', () => {
    delete process.env.JWT_SECRET;
    jwt.sign.mockReturnValueOnce('token-with-fallback');
    const { generateToken } = require('../../src/utils/auth');
    
    generateToken({ userId: 'u1' });
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: 'u1' },
      'test-jwt-secret-key-for-testing-only',
      expect.any(Object)
    );
  });
});