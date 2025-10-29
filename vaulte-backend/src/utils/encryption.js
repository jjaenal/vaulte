/**
 * Encryption Utility Functions for Vaulté
 * 
 * This module provides secure encryption/decryption functionality for user data.
 * Uses AES-256-GCM for authenticated encryption with additional data (AEAD).
 * 
 * Security Features:
 * - AES-256-GCM encryption (industry standard)
 * - Random IV generation for each encryption
 * - PBKDF2 key derivation with salt
 * - Authentication tag for integrity verification
 * - Secure random number generation
 * 
 * @author Vaulté Team
 * @security-contact security@vaulte.io
 */

const crypto = require('crypto');

/**
 * Configuration constants for encryption
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-cbc',
  keyLength: 32, // 256 bits
  ivLength: 16,  // 128 bits for CBC
  saltLength: 32, // 256 bits
  iterations: 100000, // PBKDF2 iterations (OWASP recommended minimum)
};

/**
 * Generates a cryptographically secure key from password using PBKDF2
 * 
 * @param {string} password - User password or signature
 * @param {Buffer} salt - Random salt (32 bytes)
 * @returns {Buffer} Derived key (32 bytes)
 * @throws {Error} If password is empty or salt is invalid
 */
function generateKey(password, salt) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  
  if (!salt || salt.length !== ENCRYPTION_CONFIG.saltLength) {
    throw new Error(`Salt must be ${ENCRYPTION_CONFIG.saltLength} bytes`);
  }

  return crypto.pbkdf2Sync(
    password,
    salt,
    ENCRYPTION_CONFIG.iterations,
    ENCRYPTION_CONFIG.keyLength,
    'sha256'
  );
}

/**
 * Generates a random salt for key derivation
 * 
 * @returns {Buffer} Random salt (32 bytes)
 */
function generateSalt() {
  return crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
}

/**
 * Encrypts data using AES-256-GCM
 * 
 * @param {string|Object} data - Data to encrypt (will be JSON stringified if object)
 * @param {string} password - User password for key derivation
 * @param {Buffer} [salt] - Optional salt (generates random if not provided)
 * @returns {Object} Encrypted data with metadata
 * @returns {string} returns.encryptedData - Base64 encoded encrypted data
 * @returns {string} returns.iv - Base64 encoded initialization vector
 * @returns {string} returns.salt - Base64 encoded salt
 * @returns {string} returns.tag - Base64 encoded authentication tag
 * @throws {Error} If encryption fails
 */
function encrypt(data, password, salt = null) {
  try {
    // Input validation
    if (!data) {
      throw new Error('Data cannot be empty');
    }
    
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    // Convert data to string if it's an object
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Generate salt if not provided
    if (!salt) {
      salt = generateSalt();
    }
    
    // Derive key from password
    const key = generateKey(password, salt);
    
    // Generate random IV
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    
    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
    
    // Encrypt data
    let encrypted = cipher.update(dataString, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Create HMAC for integrity verification
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encrypted);
    hmac.update(iv);
    const tag = hmac.digest();
    
    return {
      encryptedData: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      tag: tag.toString('base64'),
      algorithm: ENCRYPTION_CONFIG.algorithm,
      timestamp: Date.now()
    };
    
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts data using AES-256-GCM
 * 
 * @param {Object} encryptedObj - Encrypted data object from encrypt()
 * @param {string} encryptedObj.encryptedData - Base64 encoded encrypted data
 * @param {string} encryptedObj.iv - Base64 encoded initialization vector
 * @param {string} encryptedObj.salt - Base64 encoded salt
 * @param {string} encryptedObj.tag - Base64 encoded authentication tag
 * @param {string} password - User password for key derivation
 * @returns {string} Decrypted data
 * @throws {Error} If decryption fails or authentication fails
 */
function decrypt(encryptedObj, password) {
  try {
    // Input validation
    if (!encryptedObj || typeof encryptedObj !== 'object') {
      throw new Error('Encrypted object must be provided');
    }
    
    const { encryptedData, iv, salt, tag } = encryptedObj;
    
    if (!encryptedData || !iv || !salt || !tag) {
      throw new Error('Missing required encryption metadata');
    }
    
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }
    
    // Convert base64 strings back to buffers
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const saltBuffer = Buffer.from(salt, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');
    
    // Derive key from password and salt
    const key = generateKey(password, saltBuffer);
    
    // Verify HMAC first
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(encryptedBuffer);
    hmac.update(ivBuffer);
    const computedTag = hmac.digest();
    
    if (!computedTag.equals(tagBuffer)) {
      throw new Error('Authentication failed - data may have been tampered with');
    }
    
    // Create decipher with key and IV
    const decipher = crypto.createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, ivBuffer);
    
    // Decrypt data
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
    
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypts data with a user's Ethereum signature as password
 * 
 * @param {string|Object} data - Data to encrypt
 * @param {string} signature - Ethereum signature (0x prefixed hex string)
 * @returns {Object} Encrypted data object
 * @throws {Error} If signature is invalid or encryption fails
 */
function encryptWithSignature(data, signature) {
  if (!signature || !signature.startsWith('0x') || signature.length !== 132) {
    throw new Error('Invalid Ethereum signature format');
  }
  
  // Use signature as password (remove 0x prefix)
  const password = signature.slice(2);
  return encrypt(data, password);
}

/**
 * Decrypts data with a user's Ethereum signature as password
 * 
 * @param {Object} encryptedObj - Encrypted data object
 * @param {string} signature - Ethereum signature (0x prefixed hex string)
 * @returns {string} Decrypted data
 * @throws {Error} If signature is invalid or decryption fails
 */
function decryptWithSignature(encryptedObj, signature) {
  if (!signature || !signature.startsWith('0x') || signature.length !== 132) {
    throw new Error('Invalid Ethereum signature format');
  }
  
  // Use signature as password (remove 0x prefix)
  const password = signature.slice(2);
  return decrypt(encryptedObj, password);
}

/**
 * Generates a secure random password for encryption
 * 
 * @param {number} length - Password length (default: 32)
 * @returns {string} Random password
 */
function generateSecurePassword(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validates encryption object structure
 * 
 * @param {Object} encryptedObj - Object to validate
 * @returns {boolean} True if valid structure
 */
function isValidEncryptedObject(encryptedObj) {
  if (!encryptedObj || typeof encryptedObj !== 'object') {
    return false;
  }
  
  const requiredFields = ['encryptedData', 'iv', 'salt', 'tag'];
  return requiredFields.every(field => 
    encryptedObj[field] && typeof encryptedObj[field] === 'string'
  );
}

/**
 * Gets encryption metadata (without sensitive data)
 * 
 * @param {Object} encryptedObj - Encrypted data object
 * @returns {Object} Metadata object
 */
function getEncryptionMetadata(encryptedObj) {
  if (!isValidEncryptedObject(encryptedObj)) {
    throw new Error('Invalid encrypted object');
  }
  
  return {
    algorithm: encryptedObj.algorithm || ENCRYPTION_CONFIG.algorithm,
    timestamp: encryptedObj.timestamp,
    hasData: !!encryptedObj.encryptedData,
    dataSize: encryptedObj.encryptedData ? 
      Buffer.from(encryptedObj.encryptedData, 'base64').length : 0
  };
}

module.exports = {
  // Core functions
  generateKey,
  generateSalt,
  encrypt,
  decrypt,
  
  // Ethereum signature functions
  encryptWithSignature,
  decryptWithSignature,
  
  // Utility functions
  generateSecurePassword,
  isValidEncryptedObject,
  getEncryptionMetadata,
  
  // Constants
  ENCRYPTION_CONFIG
};