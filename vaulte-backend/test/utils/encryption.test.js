/**
 * Encryption Utility Tests
 * 
 * Comprehensive test suite for encryption/decryption functionality
 * Tests security, performance, and edge cases
 */

const {
  generateKey,
  generateSalt,
  encrypt,
  decrypt,
  encryptWithSignature,
  decryptWithSignature,
  generateSecurePassword,
  isValidEncryptedObject,
  getEncryptionMetadata,
  ENCRYPTION_CONFIG
} = require('../../src/utils/encryption');

describe('Encryption Utilities', () => {
  
  describe('generateSalt', () => {
    test('should generate salt of correct length', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Buffer);
      expect(salt.length).toBe(ENCRYPTION_CONFIG.saltLength);
    });

    test('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1.equals(salt2)).toBe(false);
    });
  });

  describe('generateKey', () => {
    test('should generate key from password and salt', () => {
      const password = 'test-password-123';
      const salt = generateSalt();
      
      const key = generateKey(password, salt);
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(ENCRYPTION_CONFIG.keyLength);
    });

    test('should generate same key for same password and salt', () => {
      const password = 'test-password-123';
      const salt = generateSalt();
      
      const key1 = generateKey(password, salt);
      const key2 = generateKey(password, salt);
      
      expect(key1.equals(key2)).toBe(true);
    });

    test('should generate different keys for different passwords', () => {
      const salt = generateSalt();
      
      const key1 = generateKey('password1', salt);
      const key2 = generateKey('password2', salt);
      
      expect(key1.equals(key2)).toBe(false);
    });

    test('should generate different keys for different salts', () => {
      const password = 'test-password';
      
      const key1 = generateKey(password, generateSalt());
      const key2 = generateKey(password, generateSalt());
      
      expect(key1.equals(key2)).toBe(false);
    });

    test('should throw error for empty password', () => {
      const salt = generateSalt();
      expect(() => generateKey('', salt)).toThrow('Password must be a non-empty string');
      expect(() => generateKey(null, salt)).toThrow('Password must be a non-empty string');
    });

    test('should throw error for invalid salt', () => {
      expect(() => generateKey('password', Buffer.alloc(16))).toThrow('Salt must be 32 bytes');
      expect(() => generateKey('password', null)).toThrow('Salt must be 32 bytes');
    });
  });

  describe('encrypt/decrypt', () => {
    const testPassword = 'test-encryption-password-123';
    
    test('should encrypt and decrypt string data', () => {
      const originalData = 'Hello, Vaulté! This is sensitive user data.';
      
      const encrypted = encrypt(originalData, testPassword);
      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('algorithm');
      expect(encrypted).toHaveProperty('timestamp');
      
      const decrypted = decrypt(encrypted, testPassword);
      expect(decrypted).toBe(originalData);
    });

    test('should encrypt and decrypt object data', () => {
      const originalData = {
        name: 'John Doe',
        email: 'john@example.com',
        fitnessData: {
          steps: 10000,
          heartRate: [72, 75, 78, 80],
          workouts: ['running', 'cycling']
        }
      };
      
      const encrypted = encrypt(originalData, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      
      expect(JSON.parse(decrypted)).toEqual(originalData);
    });

    test('should handle empty string', () => {
      expect(() => encrypt('', testPassword)).toThrow('Data cannot be empty');
      expect(() => encrypt(null, testPassword)).toThrow('Data cannot be empty');
    });

    test('should handle large data', () => {
      const largeData = 'x'.repeat(1000000); // 1MB of data
      
      const encrypted = encrypt(largeData, testPassword);
      const decrypted = decrypt(encrypted, testPassword);
      
      expect(decrypted).toBe(largeData);
    });

    test('should fail with wrong password', () => {
      const originalData = 'Secret data';
      const encrypted = encrypt(originalData, testPassword);
      
      expect(() => decrypt(encrypted, 'wrong-password')).toThrow('Decryption failed');
    });

    test('should fail with tampered data', () => {
      const originalData = 'Secret data';
      const encrypted = encrypt(originalData, testPassword);
      
      // Tamper with encrypted data
      encrypted.encryptedData = encrypted.encryptedData.slice(0, -4) + 'XXXX';
      
      expect(() => decrypt(encrypted, testPassword)).toThrow('Decryption failed');
    });

    test('should fail with tampered authentication tag', () => {
      const originalData = 'Secret data';
      const encrypted = encrypt(originalData, testPassword);
      
      // Tamper with auth tag
      encrypted.tag = encrypted.tag.slice(0, -4) + 'XXXX';
      
      expect(() => decrypt(encrypted, testPassword)).toThrow('Decryption failed');
    });

    test('should use provided salt', () => {
      const originalData = 'Test data';
      const salt = generateSalt();
      
      const encrypted1 = encrypt(originalData, testPassword, salt);
      const encrypted2 = encrypt(originalData, testPassword, salt);
      
      // Same salt should produce same encrypted result (with same IV)
      expect(encrypted1.salt).toBe(encrypted2.salt);
    });
  });

  describe('encryptWithSignature/decryptWithSignature', () => {
    const mockSignature = '0x' + 'a'.repeat(130); // Valid signature format
    
    test('should encrypt and decrypt with Ethereum signature', () => {
      const originalData = 'User fitness data encrypted with signature';
      
      const encrypted = encryptWithSignature(originalData, mockSignature);
      const decrypted = decryptWithSignature(encrypted, mockSignature);
      
      expect(decrypted).toBe(originalData);
    });

    test('should fail with invalid signature format', () => {
      const data = 'test data';
      
      expect(() => encryptWithSignature(data, 'invalid-signature')).toThrow('Invalid Ethereum signature format');
      expect(() => encryptWithSignature(data, '0x123')).toThrow('Invalid Ethereum signature format');
      expect(() => encryptWithSignature(data, 'a'.repeat(132))).toThrow('Invalid Ethereum signature format');
    });

    test('should fail decryption with wrong signature', () => {
      const data = 'test data';
      const signature1 = '0x' + 'a'.repeat(130);
      const signature2 = '0x' + 'b'.repeat(130);
      
      const encrypted = encryptWithSignature(data, signature1);
      
      expect(() => decryptWithSignature(encrypted, signature2)).toThrow('Decryption failed');
    });
  });

  describe('generateSecurePassword', () => {
    test('should generate password of default length', () => {
      const password = generateSecurePassword();
      expect(typeof password).toBe('string');
      expect(password.length).toBe(64); // 32 bytes = 64 hex chars
    });

    test('should generate password of custom length', () => {
      const password = generateSecurePassword(16);
      expect(password.length).toBe(32); // 16 bytes = 32 hex chars
    });

    test('should generate unique passwords', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      expect(password1).not.toBe(password2);
    });
  });

  describe('isValidEncryptedObject', () => {
    test('should validate correct encrypted object', () => {
      const encrypted = encrypt('test data', 'password');
      expect(isValidEncryptedObject(encrypted)).toBe(true);
    });

    test('should reject invalid objects', () => {
      expect(isValidEncryptedObject(null)).toBe(false);
      expect(isValidEncryptedObject({})).toBe(false);
      expect(isValidEncryptedObject({ encryptedData: 'test' })).toBe(false);
      expect(isValidEncryptedObject({ 
        encryptedData: 'test',
        iv: 'test',
        salt: 'test'
        // missing tag
      })).toBe(false);
    });
  });

  describe('getEncryptionMetadata', () => {
    test('should return metadata for encrypted object', () => {
      const originalData = 'test data for metadata';
      const encrypted = encrypt(originalData, 'password');
      
      const metadata = getEncryptionMetadata(encrypted);
      
      expect(metadata).toHaveProperty('algorithm');
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('hasData');
      expect(metadata).toHaveProperty('dataSize');
      expect(metadata.hasData).toBe(true);
      expect(metadata.dataSize).toBeGreaterThan(0);
    });

    test('should throw error for invalid object', () => {
      expect(() => getEncryptionMetadata({})).toThrow('Invalid encrypted object');
    });
  });

  describe('Performance Tests', () => {
    test('should encrypt small data quickly', () => {
      const data = 'Small test data';
      const password = 'test-password';
      
      const startTime = Date.now();
      const encrypted = encrypt(data, password);
      const encryptTime = Date.now() - startTime;
      
      expect(encryptTime).toBeLessThan(100); // Should be under 100ms
      expect(encrypted).toBeDefined();
    });

    test('should decrypt small data quickly', () => {
      const data = 'Small test data';
      const password = 'test-password';
      const encrypted = encrypt(data, password);
      
      const startTime = Date.now();
      const decrypted = decrypt(encrypted, password);
      const decryptTime = Date.now() - startTime;
      
      expect(decryptTime).toBeLessThan(100); // Should be under 100ms
      expect(decrypted).toBe(data);
    });

    test('should handle medium data efficiently', () => {
      const data = 'x'.repeat(10000); // 10KB
      const password = 'test-password';
      
      const startTime = Date.now();
      const encrypted = encrypt(data, password);
      const decrypted = decrypt(encrypted, password);
      const totalTime = Date.now() - startTime;
      
      expect(totalTime).toBeLessThan(500); // Should be under 500ms
      expect(decrypted).toBe(data);
    });
  });

  describe('Security Tests', () => {
    test('should produce different ciphertext for same plaintext', () => {
      const data = 'Same plaintext data';
      const password = 'same-password';
      
      const encrypted1 = encrypt(data, password);
      const encrypted2 = encrypt(data, password);
      
      // Should be different due to random IV
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      
      // But both should decrypt to same data
      expect(decrypt(encrypted1, password)).toBe(data);
      expect(decrypt(encrypted2, password)).toBe(data);
    });

    test('should detect data tampering', () => {
      const data = 'Important data that should not be tampered';
      const password = 'secure-password';
      const encrypted = encrypt(data, password);
      
      // Tamper with different parts
      const tamperedData = { ...encrypted, encryptedData: 'tampered' };
      const tamperedIV = { ...encrypted, iv: 'tampered' };
      const tamperedTag = { ...encrypted, tag: 'tampered' };
      
      expect(() => decrypt(tamperedData, password)).toThrow();
      expect(() => decrypt(tamperedIV, password)).toThrow();
      expect(() => decrypt(tamperedTag, password)).toThrow();
    });

    test('should use strong key derivation', () => {
      const password = 'test-password';
      const salt = generateSalt();
      
      // Key derivation should be deterministic
      const key1 = generateKey(password, salt);
      const key2 = generateKey(password, salt);
      expect(key1.equals(key2)).toBe(true);
      
      // But different for different inputs
      const key3 = generateKey(password + '1', salt);
      expect(key1.equals(key3)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle special characters', () => {
      const data = '🔐 Special chars: áéíóú ñ 中文 العربية русский';
      const password = 'test-password';
      
      const encrypted = encrypt(data, password);
      const decrypted = decrypt(encrypted, password);
      
      expect(decrypted).toBe(data);
    });

    test('should handle JSON with nested objects', () => {
      const data = {
        user: 'test@example.com',
        data: {
          nested: {
            deep: {
              value: 'deeply nested value',
              array: [1, 2, 3, { inner: 'object' }]
            }
          }
        },
        timestamp: new Date().toISOString()
      };
      
      const encrypted = encrypt(data, 'password');
      const decrypted = JSON.parse(decrypt(encrypted, 'password'));
      
      expect(decrypted).toEqual(data);
    });

    test('should handle very long passwords', () => {
      const data = 'test data';
      const longPassword = 'x'.repeat(1000);
      
      const encrypted = encrypt(data, longPassword);
      const decrypted = decrypt(encrypted, longPassword);
      
      expect(decrypted).toBe(data);
    });
  });
});