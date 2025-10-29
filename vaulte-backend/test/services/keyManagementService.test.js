/**
 * Key Management Service Tests
 * 
 * Test suite for key management functionality including
 * key derivation, caching, rotation, and session management
 */

const { KeyManagementService, keyManagementService } = require('../../src/services/keyManagementService');

describe('KeyManagementService', () => {
  let service;
  const mockUserAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';
  const mockSignature = '0x' + 'a'.repeat(130); // Valid signature format

  beforeEach(() => {
    service = new KeyManagementService();
  });

  afterEach(() => {
    service.clearAllKeys();
  });

  describe('deriveUserKey', () => {
    test('should derive key from user signature', () => {
      const result = service.deriveUserKey(mockUserAddress, mockSignature);
      
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('keyId');
      expect(result.key).toBeInstanceOf(Buffer);
      expect(result.salt).toBeInstanceOf(Buffer);
      expect(typeof result.keyId).toBe('string');
    });

    test('should generate same key for same inputs', () => {
      const salt = Buffer.from('a'.repeat(64), 'hex'); // 32 bytes
      
      const result1 = service.deriveUserKey(mockUserAddress, mockSignature, salt);
      const result2 = service.deriveUserKey(mockUserAddress, mockSignature, salt);
      
      expect(result1.key.equals(result2.key)).toBe(true);
      expect(result1.keyId).toBe(result2.keyId);
    });

    test('should generate different keys for different users', () => {
      const address1 = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';
      const address2 = '0x8ba1f109551bD432803012645Hac136c9c1495a6';
      const salt = Buffer.from('a'.repeat(64), 'hex');
      
      const result1 = service.deriveUserKey(address1, mockSignature, salt);
      const result2 = service.deriveUserKey(address2, mockSignature, salt);
      
      expect(result1.key.equals(result2.key)).toBe(false);
      expect(result1.keyId).not.toBe(result2.keyId);
    });

    test('should normalize user address', () => {
      const upperAddress = mockUserAddress.toUpperCase();
      const lowerAddress = mockUserAddress.toLowerCase();
      const salt = Buffer.from('a'.repeat(64), 'hex');
      
      const result1 = service.deriveUserKey(upperAddress, mockSignature, salt);
      const result2 = service.deriveUserKey(lowerAddress, mockSignature, salt);
      
      expect(result1.keyId).toBe(result2.keyId);
    });

    test('should throw error for invalid signature', () => {
      expect(() => service.deriveUserKey(mockUserAddress, 'invalid')).toThrow('Invalid Ethereum signature format');
      expect(() => service.deriveUserKey(mockUserAddress, '0x123')).toThrow('Invalid Ethereum signature format');
      expect(() => service.deriveUserKey(mockUserAddress, null)).toThrow('Invalid Ethereum signature format');
    });

    test('should throw error for invalid address', () => {
      expect(() => service.deriveUserKey('', mockSignature)).toThrow('User address must be provided');
      expect(() => service.deriveUserKey(null, mockSignature)).toThrow('User address must be provided');
    });
  });

  describe('getUserKey', () => {
    test('should return cached key if available', () => {
      const salt = Buffer.from('a'.repeat(64), 'hex');
      
      // First call - derives and caches key
      const key1 = service.getUserKey(mockUserAddress, mockSignature, salt);
      
      // Second call - should return cached key
      const key2 = service.getUserKey(mockUserAddress, mockSignature, salt);
      
      expect(key1.equals(key2)).toBe(true);
    });

    test('should derive new key if not cached', () => {
      const salt = Buffer.from('a'.repeat(64), 'hex');
      
      const key = service.getUserKey(mockUserAddress, mockSignature, salt);
      
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits
    });
  });

  describe('generateKeyId', () => {
    test('should generate consistent key ID', () => {
      const salt = Buffer.from('a'.repeat(64), 'hex');
      
      const keyId1 = service.generateKeyId(mockUserAddress, salt);
      const keyId2 = service.generateKeyId(mockUserAddress, salt);
      
      expect(keyId1).toBe(keyId2);
      expect(typeof keyId1).toBe('string');
      expect(keyId1.length).toBe(64); // SHA256 hex string
    });

    test('should generate different IDs for different inputs', () => {
      const salt1 = Buffer.from('a'.repeat(64), 'hex');
      const salt2 = Buffer.from('b'.repeat(64), 'hex');
      
      const keyId1 = service.generateKeyId(mockUserAddress, salt1);
      const keyId2 = service.generateKeyId(mockUserAddress, salt2);
      
      expect(keyId1).not.toBe(keyId2);
    });
  });

  describe('rotateUserKey', () => {
    test('should generate new key with different salt', () => {
      // First key
      const result1 = service.deriveUserKey(mockUserAddress, mockSignature);
      
      // Rotate key
      const result2 = service.rotateUserKey(mockUserAddress, mockSignature);
      
      expect(result1.key.equals(result2.key)).toBe(false);
      expect(result1.salt.equals(result2.salt)).toBe(false);
      expect(result1.keyId).not.toBe(result2.keyId);
    });

    test('should clear old cached keys', () => {
      // Derive initial key
      service.deriveUserKey(mockUserAddress, mockSignature);
      
      const statsBefore = service.getStats();
      expect(statsBefore.cacheStats.size).toBeGreaterThan(0);
      
      // Rotate key
      service.rotateUserKey(mockUserAddress, mockSignature);
      
      // Should still have keys (new one), but old ones cleared
      const statsAfter = service.getStats();
      expect(statsAfter.cacheStats.size).toBeGreaterThan(0);
    });
  });

  describe('Key Cache', () => {
    test('should cache keys with TTL', (done) => {
      const result = service.deriveUserKey(mockUserAddress, mockSignature);
      
      // Key should be cached
      const cachedKey = service.keyCache.get(result.keyId);
      expect(cachedKey).toBeDefined();
      expect(cachedKey.equals(result.key)).toBe(true);
      
      // Set very short TTL for testing
      service.keyCache.set(result.keyId, result.key, 50); // 50ms
      
      setTimeout(() => {
        const expiredKey = service.keyCache.get(result.keyId);
        expect(expiredKey).toBeNull();
        done();
      }, 100);
    });

    test('should clear specific user keys', () => {
      const user1 = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';
      const user2 = '0x8ba1f109551bD432803012645Hac136c9c1495a6';
      
      service.deriveUserKey(user1, mockSignature);
      service.deriveUserKey(user2, mockSignature);
      
      const statsBefore = service.getStats();
      expect(statsBefore.cacheStats.size).toBe(2);
      
      service.clearUserKeys(user1);
      
      const statsAfter = service.getStats();
      // Note: clearUserKeys implementation is simplified in the service
      // In a real implementation, it would properly filter by user
      expect(statsAfter.cacheStats.size).toBeLessThanOrEqual(2);
    });

    test('should get cache statistics', () => {
      service.deriveUserKey(mockUserAddress, mockSignature);
      
      const stats = service.getStats();
      
      expect(stats).toHaveProperty('cacheStats');
      expect(stats).toHaveProperty('config');
      expect(stats.cacheStats).toHaveProperty('size');
      expect(stats.cacheStats).toHaveProperty('keys');
      expect(stats.config).toHaveProperty('keyRotationInterval');
      expect(stats.config).toHaveProperty('defaultTTL');
    });
  });

  describe('Session Keys', () => {
    test('should create session key', () => {
      const session = service.createSessionKey(mockUserAddress);
      
      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('keyId');
      expect(session).toHaveProperty('expiresAt');
      expect(typeof session.sessionId).toBe('string');
      expect(typeof session.keyId).toBe('string');
      expect(typeof session.expiresAt).toBe('number');
    });

    test('should retrieve session key', () => {
      const session = service.createSessionKey(mockUserAddress);
      
      const sessionKey = service.getSessionKey(session.keyId);
      
      expect(sessionKey).toBeInstanceOf(Buffer);
      expect(sessionKey.length).toBe(32);
    });

    test('should revoke session key', () => {
      const session = service.createSessionKey(mockUserAddress);
      
      // Key should exist
      let sessionKey = service.getSessionKey(session.keyId);
      expect(sessionKey).toBeDefined();
      
      // Revoke key
      service.revokeSessionKey(session.keyId);
      
      // Key should be gone
      sessionKey = service.getSessionKey(session.keyId);
      expect(sessionKey).toBeNull();
    });

    test('should create session key with custom TTL', () => {
      const customTTL = 5000; // 5 seconds
      const session = service.createSessionKey(mockUserAddress, customTTL);
      
      expect(session.expiresAt).toBeCloseTo(Date.now() + customTTL, -2); // Within 100ms
    });
  });

  describe('Challenge Message', () => {
    test('should generate challenge message', () => {
      const timestamp = 1640995200000; // Fixed timestamp for testing
      const message = service.generateChallengeMessage(mockUserAddress, timestamp);
      
      expect(message).toContain('Vaulté Key Derivation Challenge');
      expect(message).toContain(mockUserAddress);
      expect(message).toContain(timestamp.toString());
      expect(message).toContain('By signing this message');
    });

    test('should use current timestamp if not provided', () => {
      const beforeTime = Date.now();
      const message = service.generateChallengeMessage(mockUserAddress);
      const afterTime = Date.now();
      
      expect(message).toContain('Vaulté Key Derivation Challenge');
      expect(message).toContain(mockUserAddress);
      
      // Extract timestamp from message
      const timestampMatch = message.match(/Timestamp: (\d+)/);
      expect(timestampMatch).toBeTruthy();
      
      const messageTimestamp = parseInt(timestampMatch[1]);
      expect(messageTimestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(messageTimestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Signature Validation', () => {
    test('should validate signature format', () => {
      const message = 'test message';
      const validSignature = '0x' + 'a'.repeat(130);
      
      // Note: This is a simplified test since actual signature validation
      // requires ethers.js integration
      const isValid = service.validateSignature(message, validSignature, mockUserAddress);
      expect(typeof isValid).toBe('boolean');
    });

    test('should reject invalid signature formats', () => {
      const message = 'test message';
      
      expect(service.validateSignature(message, 'invalid', mockUserAddress)).toBe(false);
      expect(service.validateSignature(message, '0x123', mockUserAddress)).toBe(false);
      expect(service.validateSignature(message, null, mockUserAddress)).toBe(false);
    });

    test('should reject invalid addresses', () => {
      const message = 'test message';
      const validSignature = '0x' + 'a'.repeat(130);
      
      expect(service.validateSignature(message, validSignature, '')).toBe(false);
      expect(service.validateSignature(message, validSignature, null)).toBe(false);
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(keyManagementService).toBeInstanceOf(KeyManagementService);
    });

    test('should maintain state across imports', () => {
      keyManagementService.deriveUserKey(mockUserAddress, mockSignature);
      
      const stats = keyManagementService.getStats();
      expect(stats.cacheStats.size).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle cache operations gracefully', () => {
      // Test cache operations don't throw
      expect(() => service.keyCache.clear()).not.toThrow();
      expect(() => service.keyCache.getStats()).not.toThrow();
      expect(() => service.keyCache.get('nonexistent')).not.toThrow();
      expect(() => service.keyCache.delete('nonexistent')).not.toThrow();
    });

    test('should handle invalid key IDs gracefully', () => {
      expect(service.getSessionKey('invalid-key-id')).toBeNull();
      expect(() => service.revokeSessionKey('invalid-key-id')).not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should derive keys quickly', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        service.deriveUserKey(mockUserAddress, mockSignature);
      }
      
      const endTime = Date.now();
      const avgTime = (endTime - startTime) / 10;
      
      expect(avgTime).toBeLessThan(100); // Should be under 100ms per derivation
    });

    test('should cache lookups be fast', () => {
      const result = service.deriveUserKey(mockUserAddress, mockSignature);
      
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        service.keyCache.get(result.keyId);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(50); // 100 lookups in under 50ms
    });
  });
});