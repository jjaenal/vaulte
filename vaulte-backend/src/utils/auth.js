const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Authentication utilities for Vaulté backend
 * Handles JWT tokens, password hashing, and wallet signature verification
 */

const JWT_SECRET = process.env.JWT_SECRET || 'vaulte-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;

/**
 * Generate JWT token for authenticated user
 * @param {Object} payload - User data to encode in token
 * @param {string} payload.userId - User ID
 * @param {string} payload.walletAddress - User's wallet address
 * @param {string} payload.email - User's email (optional)
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'vaulte-api',
    audience: 'vaulte-app',
    jwtid: crypto.randomUUID()
  });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'vaulte-api',
      audience: 'vaulte-app'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Verify wallet signature for authentication
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature from wallet
 * @param {string} expectedAddress - Expected wallet address
 * @returns {boolean} True if signature is valid
 */
function verifyWalletSignature(message, signature, expectedAddress) {
  try {
    // Recover address from signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error.message);
    return false;
  }
}

/**
 * Generate authentication message for wallet signing
 * @param {string} walletAddress - User's wallet address
 * @param {number} nonce - Random nonce for security
 * @returns {string} Message to be signed by wallet
 */
function generateAuthMessage(walletAddress, nonce) {
  const timestamp = Date.now();
  return `Welcome to Vaulté!

This request will not trigger a blockchain transaction or cost any gas fees.

Wallet: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

Sign this message to authenticate with Vaulté.`;
}

/**
 * Generate secure random nonce
 * @returns {string} Random nonce
 */
function generateNonce() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} JWT token or null if not found
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Validate Ethereum address format
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid Ethereum address
 */
function isValidEthereumAddress(address) {
  return ethers.isAddress(address);
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  verifyWalletSignature,
  generateAuthMessage,
  generateNonce,
  extractTokenFromHeader,
  isValidEthereumAddress
};