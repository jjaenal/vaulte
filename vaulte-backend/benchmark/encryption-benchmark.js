/**
 * Encryption Performance Benchmark
 * 
 * This script benchmarks the performance of our encryption utilities
 * with different data sizes and scenarios.
 */

const { 
  encrypt, 
  decrypt, 
  encryptWithSignature, 
  decryptWithSignature,
  generateKey,
  generateSalt,
  generateSecurePassword
} = require('../src/utils/encryption');

const { keyManagementService } = require('../src/services/keyManagementService');

// Test data generators
function generateTestData(size) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateTestObject(complexity) {
  const obj = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    data: generateTestData(complexity * 100),
    nested: {
      level1: {
        level2: {
          value: generateTestData(complexity * 50)
        }
      }
    },
    array: Array.from({ length: complexity }, (_, i) => ({
      index: i,
      value: generateTestData(50)
    }))
  };
  return obj;
}

// Benchmark utilities
function benchmark(name, fn, iterations = 1000) {
  console.info(`\n🔄 Running ${name}...`);
  
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = process.hrtime.bigint();
  const totalTime = Number(end - start) / 1000000; // Convert to milliseconds
  const avgTime = totalTime / iterations;
  
  console.info(`✅ ${name}:`);
  console.info(`   Total time: ${totalTime.toFixed(2)}ms`);
  console.info(`   Average time: ${avgTime.toFixed(4)}ms per operation`);
  console.info(`   Operations per second: ${(1000 / avgTime).toFixed(0)}`);
  
  return { totalTime, avgTime, opsPerSecond: 1000 / avgTime };
}

async function runBenchmarks() {
  console.info('🚀 Starting Vaulté Encryption Performance Benchmark\n');
  console.info('=' .repeat(60));
  
  const results = {};
  
  // Test configurations
  const dataSizes = [
    { name: 'Small (1KB)', size: 1024 },
    { name: 'Medium (10KB)', size: 10240 },
    { name: 'Large (100KB)', size: 102400 },
    { name: 'XLarge (1MB)', size: 1048576 }
  ];
  
  const password = 'test-password-123';
  const salt = generateSalt();
  // Derive a key once to ensure PBKDF2 path is exercised
  generateKey(password, salt);
  
  // Mock Ethereum signature for testing
  const mockSignature = '0x' + 'a'.repeat(130);
  const mockAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87';
  
  console.info('\n📊 BASIC ENCRYPTION/DECRYPTION BENCHMARKS');
  console.info('=' .repeat(60));
  
  // Test different data sizes
  for (const config of dataSizes) {
    const testData = generateTestData(config.size);
    
    console.info(`\n📦 Testing with ${config.name} data`);
    
    // Encryption benchmark
    let encryptedData;
    results[`encrypt_${config.name}`] = benchmark(
      `Encrypt ${config.name}`,
      () => {
        encryptedData = encrypt(testData, password, salt);
      },
      config.size > 100000 ? 100 : 1000 // Fewer iterations for large data
    );
    
    // Decryption benchmark
    results[`decrypt_${config.name}`] = benchmark(
      `Decrypt ${config.name}`,
      () => {
        decrypt(encryptedData, password);
      },
      config.size > 100000 ? 100 : 1000
    );
  }
  
  console.info('\n🔐 SIGNATURE-BASED ENCRYPTION BENCHMARKS');
  console.info('=' .repeat(60));
  
  // Test signature-based encryption
  for (const config of dataSizes.slice(0, 3)) { // Skip XLarge for signature tests
    const testData = generateTestData(config.size);
    
    console.info(`\n🔑 Testing signature encryption with ${config.name} data`);
    
    let encryptedData;
    results[`encryptWithSig_${config.name}`] = benchmark(
      `Encrypt with Signature ${config.name}`,
      () => {
        encryptedData = encryptWithSignature(testData, mockSignature);
      },
      config.size > 10000 ? 100 : 500
    );
    
    results[`decryptWithSig_${config.name}`] = benchmark(
      `Decrypt with Signature ${config.name}`,
      () => {
        decryptWithSignature(encryptedData, mockSignature);
      },
      config.size > 10000 ? 100 : 500
    );
  }
  
  console.info('\n🗝️  KEY MANAGEMENT BENCHMARKS');
  console.info('=' .repeat(60));
  
  // Key derivation benchmark
  results.keyDerivation = benchmark(
    'Key Derivation',
    () => {
      keyManagementService.deriveUserKey(mockAddress, mockSignature);
    },
    1000
  );
  
  // Key caching benchmark
  const keyResult = keyManagementService.deriveUserKey(mockAddress, mockSignature);
  results.keyCaching = benchmark(
    'Key Cache Lookup',
    () => {
      keyManagementService.getUserKey(mockAddress, mockSignature, keyResult.salt);
    },
    10000
  );
  
  console.info('\n🏗️  UTILITY FUNCTIONS BENCHMARKS');
  console.info('=' .repeat(60));
  
  // Salt generation
  results.saltGeneration = benchmark(
    'Salt Generation',
    () => {
      generateSalt();
    },
    10000
  );
  
  // Password generation
  results.passwordGeneration = benchmark(
    'Secure Password Generation',
    () => {
      generateSecurePassword(32);
    },
    5000
  );
  
  // Key generation
  results.keyGeneration = benchmark(
    'Key Generation (PBKDF2)',
    () => {
      generateKey(password, salt);
    },
    1000
  );
  
  console.info('\n📈 COMPLEX DATA BENCHMARKS');
  console.info('=' .repeat(60));
  
  // Test with complex objects
  const complexities = [
    { name: 'Simple Object', complexity: 1 },
    { name: 'Medium Object', complexity: 5 },
    { name: 'Complex Object', complexity: 10 }
  ];
  
  for (const config of complexities) {
    const testObject = generateTestObject(config.complexity);
    
    console.info(`\n🧩 Testing ${config.name}`);
    
    let encryptedObject;
    results[`encryptObject_${config.name}`] = benchmark(
      `Encrypt ${config.name}`,
      () => {
        encryptedObject = encrypt(testObject, password, salt);
      },
      500
    );
    
    results[`decryptObject_${config.name}`] = benchmark(
      `Decrypt ${config.name}`,
      () => {
        decrypt(encryptedObject, password);
      },
      500
    );
  }
  
  console.info('\n📊 BENCHMARK SUMMARY');
  console.info('=' .repeat(60));
  
  // Performance analysis
  const encryptionSpeeds = [];
  const decryptionSpeeds = [];
  
  for (const config of dataSizes) {
    const encryptResult = results[`encrypt_${config.name}`];
    const decryptResult = results[`decrypt_${config.name}`];
    
    if (encryptResult && decryptResult) {
      const throughputMBps = (config.size / 1024 / 1024) / (encryptResult.avgTime / 1000);
      encryptionSpeeds.push({
        size: config.name,
        throughput: throughputMBps,
        avgTime: encryptResult.avgTime
      });
      
      const decryptThroughputMBps = (config.size / 1024 / 1024) / (decryptResult.avgTime / 1000);
      decryptionSpeeds.push({
        size: config.name,
        throughput: decryptThroughputMBps,
        avgTime: decryptResult.avgTime
      });
    }
  }
  
  console.info('\n🚀 Encryption Throughput:');
  encryptionSpeeds.forEach(speed => {
    console.info(`   ${speed.size}: ${speed.throughput.toFixed(2)} MB/s (${speed.avgTime.toFixed(2)}ms)`);
  });
  
  console.info('\n🔓 Decryption Throughput:');
  decryptionSpeeds.forEach(speed => {
    console.info(`   ${speed.size}: ${speed.throughput.toFixed(2)} MB/s (${speed.avgTime.toFixed(2)}ms)`);
  });
  
  // Performance recommendations
  console.info('\n💡 PERFORMANCE RECOMMENDATIONS');
  console.info('=' .repeat(60));
  
  const avgEncryptTime = encryptionSpeeds.reduce((sum, s) => sum + s.avgTime, 0) / encryptionSpeeds.length;
  const avgDecryptTime = decryptionSpeeds.reduce((sum, s) => sum + s.avgTime, 0) / decryptionSpeeds.length;
  
  console.info(`\n📈 Average Performance:`);
  console.info(`   Encryption: ${avgEncryptTime.toFixed(2)}ms average`);
  console.info(`   Decryption: ${avgDecryptTime.toFixed(2)}ms average`);
  console.info(`   Key Derivation: ${results.keyDerivation.avgTime.toFixed(2)}ms`);
  console.info(`   Key Cache Lookup: ${results.keyCaching.avgTime.toFixed(4)}ms`);
  
  if (avgEncryptTime > 100) {
    console.warn('\n⚠️  Warning: Encryption is slower than recommended (>100ms)');
    console.info('   Consider optimizing for production use');
  } else {
    console.info('\n✅ Encryption performance is within acceptable range');
  }
  
  if (results.keyDerivation.avgTime > 50) {
    console.warn('\n⚠️  Warning: Key derivation is slower than recommended (>50ms)');
    console.info('   Consider caching keys for better user experience');
  } else {
    console.info('\n✅ Key derivation performance is acceptable');
  }
  
  console.info('\n🎯 PRODUCTION RECOMMENDATIONS:');
  console.info('   • Cache derived keys for 15-30 minutes');
  console.info('   • Use worker threads for large file encryption');
  console.info('   • Implement progressive encryption for large datasets');
  console.info('   • Monitor encryption performance in production');
  console.info('   • Consider hardware acceleration for high-volume scenarios');
  
  console.info('\n🏁 Benchmark completed successfully!');
  console.info('=' .repeat(60));
  
  return results;
}

// Run benchmarks if called directly
if (require.main === module) {
  runBenchmarks().catch(console.error);
}

module.exports = { runBenchmarks };