# Vaulté Encryption Strategy

## Overview

This document outlines Vaulté's encryption approach for securing user data while enabling controlled access for authorized buyers.

## Core Encryption Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User Data  │────▶│  Encrypted  │────▶│   Storage   │
│   Source    │     │  Data Pack  │     │    IPFS     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Metadata   │────▶│ Blockchain  │
                    │ & Key Info  │     │  Contract   │
                    └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Access    │
                                        │  Control &  │
                                        │ Key Sharing │
                                        └─────────────┘
```

## Encryption Standards

1. **Primary Encryption**: AES-256-GCM
   - Industry standard symmetric encryption
   - Authenticated encryption with associated data (AEAD)
   - Fast performance for large datasets

2. **Key Management**: ECDH (Elliptic Curve Diffie-Hellman)
   - Curve: secp256k1 (compatible with Ethereum keys)
   - Enables secure key exchange between data owners and buyers

3. **Key Derivation**: PBKDF2 with high iteration count
   - Salt: Unique per data package
   - Iterations: Minimum 310,000 (OWASP recommendation)

## Implementation Flow

### Data Owner Flow

1. **Key Generation**
   ```javascript
   // Generate a unique data encryption key (DEK) for each data package
   const dataEncryptionKey = crypto.randomBytes(32); // 256 bits
   
   // Generate initialization vector
   const iv = crypto.randomBytes(12);
   ```

2. **Data Encryption**
   ```javascript
   // Encrypt data with AES-256-GCM
   const cipher = crypto.createCipheriv('aes-256-gcm', dataEncryptionKey, iv);
   let encryptedData = cipher.update(rawData, 'utf8', 'base64');
   encryptedData += cipher.final('base64');
   const authTag = cipher.getAuthTag();
   ```

3. **Key Encryption**
   ```javascript
   // Encrypt DEK with owner's public key (for recovery)
   const encryptedDEKForOwner = eccEncrypt(dataEncryptionKey, ownerPublicKey);
   
   // Store encrypted DEK, IV, and authTag in smart contract
   await dataVaultContract.storeEncryptionMetadata(
     dataId, 
     encryptedDEKForOwner,
     iv.toString('base64'),
     authTag.toString('base64')
   );
   ```

4. **Storage**
   ```javascript
   // Store encrypted data on IPFS
   const cid = await ipfs.add(encryptedData);
   
   // Store CID in smart contract
   await dataVaultContract.storeDataLocation(dataId, cid.toString());
   ```

### Data Buyer Flow

1. **Access Request**
   ```javascript
   // Buyer requests access to data
   await marketplaceContract.requestAccess(dataId, duration);
   ```

2. **Key Exchange** (after owner approval)
   ```javascript
   // Owner derives shared secret with buyer using ECDH
   const sharedSecret = deriveSharedSecret(ownerPrivateKey, buyerPublicKey);
   
   // Encrypt DEK with shared secret
   const encryptedDEKForBuyer = encryptWithSharedSecret(dataEncryptionKey, sharedSecret);
   
   // Share encrypted DEK with buyer via smart contract
   await dataVaultContract.shareEncryptedKey(
     dataId, 
     buyerAddress, 
     encryptedDEKForBuyer,
     expiryTimestamp
   );
   ```

3. **Data Decryption** (buyer side)
   ```javascript
   // Buyer retrieves encrypted data and metadata
   const encryptedData = await ipfs.cat(cid);
   const metadata = await dataVaultContract.getEncryptionMetadata(dataId);
   
   // Derive shared secret (same as owner derived)
   const sharedSecret = deriveSharedSecret(buyerPrivateKey, ownerPublicKey);
   
   // Decrypt the DEK
   const dataEncryptionKey = decryptWithSharedSecret(metadata.encryptedDEKForBuyer, sharedSecret);
   
   // Decrypt the data
   const decipher = crypto.createDecipheriv(
     'aes-256-gcm', 
     dataEncryptionKey, 
     Buffer.from(metadata.iv, 'base64')
   );
   decipher.setAuthTag(Buffer.from(metadata.authTag, 'base64'));
   
   let decryptedData = decipher.update(encryptedData, 'base64', 'utf8');
   decryptedData += decipher.final('utf8');
   ```

## Key Rotation & Expiry

1. **Time-Based Access Control**
   - Keys automatically expire after purchased duration
   - Smart contract enforces time-based access control

2. **Key Rotation**
   - Owner can rotate keys for active buyers
   - New DEK generated and re-encrypted for all authorized buyers

3. **Access Revocation**
   - Owner can revoke access before expiry
   - Smart contract removes buyer's access to encrypted DEK

## Security Considerations

1. **Key Storage**
   - DEKs never stored in plaintext
   - All keys encrypted at rest and in transit

2. **Forward Secrecy**
   - New DEK for each data package
   - Compromise of one key doesn't affect other data

3. **Metadata Protection**
   - Minimal metadata stored on-chain
   - Sensitive metadata encrypted before storage

4. **Quantum Resistance Planning**
   - Current implementation: Classical cryptography
   - Future upgrade path: Post-quantum algorithms when standards mature

## Performance Optimization

1. **Benchmark Results**
   - AES-256-GCM: ~500MB/s encryption/decryption on modern hardware
   - ECDH key derivation: ~5ms per operation
   - Overall latency: <100ms for typical operations

2. **Chunked Encryption**
   - Large files split into 10MB chunks
   - Parallel encryption/decryption
   - Progressive loading for better UX

## Implementation Timeline

1. **Phase 1** (MVP)
   - Basic AES-256 encryption
   - Manual key management
   - IPFS storage

2. **Phase 2** (Enhanced Security)
   - Add ECDH key exchange
   - Implement time-based access
   - Add key rotation

3. **Phase 3** (Advanced Features)
   - Zero-knowledge proofs for privacy
   - Threshold encryption for recovery
   - Homomorphic encryption for select operations