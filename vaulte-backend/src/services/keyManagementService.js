/**
 * Key Management Service for Vaulté
 * 
 * This service manages encryption keys for user data in a secure manner.
 * Keys are derived from user signatures and never stored in plaintext.
 * 
 * Security Features:
 * - User-controlled keys (derived from Ethereum signatures)
 * - No plaintext key storage
 * - Key rotation support
 * - Secure key derivation (PBKDF2)
 * - Session-based key caching (memory only)
 * 
 * @author Vaulté Team
 * @security-contact security@vaulte.io
 */

const crypto = require('crypto');
const { generateKey, generateSalt } = require('../utils/encryption');

/**
 * In-memory key cache for active sessions
 * Keys are automatically cleared after timeout
 */
class KeyCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
    this.defaultTTL = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Stores a key in cache with TTL
   * 
   * @param {string} keyId - Unique key identifier
   * @param {Buffer} key - Encryption key
   * @param {number} ttl - Time to live in milliseconds
   */
  set(keyId, key, ttl = this.defaultTTL) {
    // Clear existing timeout if key exists
    if (this.timeouts.has(keyId)) {
      clearTimeout(this.timeouts.get(keyId));
    }

    // Store key
    this.cache.set(keyId, key);

    // Set timeout to clear key
    const timeout = setTimeout(() => {
      this.delete(keyId);
    }, ttl);
    // Prevent timers from keeping the event loop alive in tests
    if (typeof timeout.unref === 'function') {
      timeout.unref();
    }

    this.timeouts.set(keyId, timeout);
  }

  /**
   * Retrieves a key from cache
   * 
   * @param {string} keyId - Key identifier
   * @returns {Buffer|null} Encryption key or null if not found
   */
  get(keyId) {
    return this.cache.get(keyId) || null;
  }

  /**
   * Removes a key from cache
   * 
   * @param {string} keyId - Key identifier
   */
  delete(keyId) {
    if (this.timeouts.has(keyId)) {
      clearTimeout(this.timeouts.get(keyId));
      this.timeouts.delete(keyId);
    }
    this.cache.delete(keyId);
  }

  /**
   * Clears all keys from cache
   */
  clear() {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.cache.clear();
    this.timeouts.clear();
  }

  /**
   * Gets cache statistics
   * 
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Key Management Service
 */
class KeyManagementService {
  constructor() {
    this.keyCache = new KeyCache();
    this.keyRotationInterval = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Derives encryption key from user's Ethereum signature
   * 
   * @param {string} userAddress - User's Ethereum address (lowercase)
   * @param {string} signature - User's signature (0x prefixed)
   * @param {Buffer} [salt] - Optional salt for key derivation
   * @returns {Object} Key derivation result
   * @returns {Buffer} returns.key - Derived encryption key
   * @returns {Buffer} returns.salt - Salt used for derivation
   * @returns {string} returns.keyId - Unique key identifier
   * @throws {Error} If signature is invalid
   */
  deriveUserKey(userAddress, signature, salt = null) {
    // Validate inputs
    if (!userAddress || typeof userAddress !== 'string') {
      throw new Error('User address must be provided');
    }

    if (!signature || !signature.startsWith('0x') || signature.length !== 132) {
      throw new Error('Invalid Ethereum signature format');
    }

    // Normalize address
    const normalizedAddress = userAddress.toLowerCase();

    // Generate salt if not provided
    if (!salt) {
      salt = generateSalt();
    }

    // Combine signature and user address for unique key derivation
    // This ensures different users with same signature get different keys
    const password = signature.slice(2) + normalizedAddress.slice(2);

    // Derive key
    const key = generateKey(password, salt);

    // Generate unique key ID
    const keyId = this.generateKeyId(normalizedAddress, salt);

    // Cache the key
    this.keyCache.set(keyId, key);

    return {
      key,
      salt,
      keyId
    };
  }

  /**
   * Retrieves user's encryption key (from cache or derives new)
   * 
   * @param {string} userAddress - User's Ethereum address
   * @param {string} signature - User's signature
   * @param {Buffer} salt - Salt for key derivation
   * @returns {Buffer} Encryption key
   * @throws {Error} If key derivation fails
   */
  getUserKey(userAddress, signature, salt) {
    const keyId = this.generateKeyId(userAddress.toLowerCase(), salt);
    
    // Try to get from cache first
    let key = this.keyCache.get(keyId);
    
    if (!key) {
      // Derive key if not in cache
      const result = this.deriveUserKey(userAddress, signature, salt);
      key = result.key;
    }

    return key;
  }

  /**
   * Generates a unique key identifier
   * 
   * @param {string} userAddress - User's Ethereum address (normalized)
   * @param {Buffer} salt - Salt used for key derivation
   * @returns {string} Unique key identifier
   */
  generateKeyId(userAddress, salt) {
    const data = `${userAddress}:${salt.toString('hex')}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Rotates user's encryption key (generates new salt)
   * 
   * @param {string} userAddress - User's Ethereum address
   * @param {string} signature - User's signature
   * @returns {Object} New key derivation result
   */
  rotateUserKey(userAddress, signature) {
    // Clear old key from cache
    const normalizedAddress = userAddress.toLowerCase();
    this.clearUserKeys(normalizedAddress);

    // Generate new key with new salt
    return this.deriveUserKey(userAddress, signature);
  }

  /**
   * Clears all cached keys for a user
   * 
   * @param {string} userAddress - User's Ethereum address
   */
  clearUserKeys(userAddress) {
    const normalizedAddress = userAddress.toLowerCase();
    const stats = this.keyCache.getStats();
    
    // Find and remove all keys for this user
    stats.keys.forEach(keyId => {
      if (keyId.startsWith(crypto.createHash('sha256').update(normalizedAddress).digest('hex').substring(0, 8))) {
        this.keyCache.delete(keyId);
      }
    });
  }

  /**
   * Validates if a signature belongs to the claimed address
   * 
   * @param {string} message - Original message that was signed
   * @param {string} signature - Signature to validate
   * @param {string} expectedAddress - Expected signer address
   * @returns {boolean} True if signature is valid
   */
  validateSignature(message, signature, expectedAddress) {
    try {
      // This is a simplified validation - in production, use ethers.js
      // to properly recover the address from signature
      
      // For now, we'll do basic format validation
      if (!signature || !signature.startsWith('0x') || signature.length !== 132) {
        return false;
      }

      if (!expectedAddress || typeof expectedAddress !== 'string') {
        return false;
      }

      // TODO: Implement proper signature recovery with ethers.js
      // const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      // return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
      
      return true; // Temporary - replace with actual validation
    } catch {
      return false;
    }
  }

  /**
   * Generates a challenge message for user to sign
   * 
   * @param {string} userAddress - User's Ethereum address
   * @param {number} timestamp - Current timestamp
   * @returns {string} Challenge message
   */
  generateChallengeMessage(userAddress, timestamp = Date.now()) {
    return `Vaulté Key Derivation Challenge\n\nAddress: ${userAddress}\nTimestamp: ${timestamp}\n\nBy signing this message, you authorize Vaulté to derive encryption keys for your data.`;
  }

  /**
   * Creates a session key for temporary operations
   * 
   * @param {string} userAddress - User's Ethereum address
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Object} Session key info
   */
  createSessionKey(userAddress, ttl = 15 * 60 * 1000) {
    const sessionKey = crypto.randomBytes(32);
    const sessionId = crypto.randomUUID();
    const keyId = `session:${userAddress.toLowerCase()}:${sessionId}`;

    this.keyCache.set(keyId, sessionKey, ttl);

    return {
      sessionId,
      keyId,
      expiresAt: Date.now() + ttl
    };
  }

  /**
   * Gets session key by ID
   * 
   * @param {string} keyId - Session key ID
   * @returns {Buffer|null} Session key or null if not found/expired
   */
  getSessionKey(keyId) {
    return this.keyCache.get(keyId);
  }

  /**
   * Revokes a session key
   * 
   * @param {string} keyId - Session key ID to revoke
   */
  revokeSessionKey(keyId) {
    this.keyCache.delete(keyId);
  }

  /**
   * Gets key management statistics
   * 
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      cacheStats: this.keyCache.getStats(),
      config: {
        keyRotationInterval: this.keyRotationInterval,
        defaultTTL: this.keyCache.defaultTTL
      }
    };
  }

  /**
   * Clears all cached keys (use with caution)
   */
  clearAllKeys() {
    this.keyCache.clear();
  }
}

// Export singleton instance
const keyManagementService = new KeyManagementService();

module.exports = {
  KeyManagementService,
  keyManagementService
};