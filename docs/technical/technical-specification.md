# Vaulté Technical Specification

## 1. Introduction

Vaulté is a decentralized personal data marketplace that enables individuals to monetize their personal data while maintaining privacy and control. This document outlines the technical specifications for the Vaulté platform.

## 2. System Architecture

The Vaulté platform consists of four main layers:
- Frontend Layer (Next.js, RainbowKit, Wagmi/Viem)
- Backend Layer (Node.js, PostgreSQL, Redis)
- Blockchain Layer (Polygon)
- Storage Layer (IPFS/Pinata)

See `system-architecture.svg` for a visual representation.

## 3. Smart Contracts

### 3.1 DataVault.sol
- **Purpose**: Manages user data categories and permissions
- **Key Functions**:
  - `registerDataCategory(string name, uint256 pricePerDay, bytes32 dataHash)`
  - `updateDataCategory(uint256 categoryId, string name, uint256 pricePerDay, bytes32 dataHash)`
  - `grantAccess(uint256 categoryId, address buyer, uint256 duration)`
  - `revokeAccess(uint256 categoryId, address buyer)`
  - `checkAccess(uint256 categoryId, address buyer)`

### 3.2 DataMarketplace.sol
- **Purpose**: Handles data listing, discovery, and transactions
- **Key Functions**:
  - `listDataCategory(uint256 categoryId, string description)`
  - `requestAccess(uint256 categoryId, uint256 duration)`
  - `approveRequest(uint256 requestId)`
  - `rejectRequest(uint256 requestId)`
  - `searchData(string[] keywords)`

### 3.3 PaymentSplitter.sol
- **Purpose**: Manages payment distribution between data owners and platform
- **Key Functions**:
  - `processPayment(uint256 categoryId, address buyer, uint256 duration)`
  - `withdrawFunds(address payable recipient)`
  - `calculateFees(uint256 amount)`

### 3.4 AccessControl.sol
- **Purpose**: Manages roles and permissions
- **Key Functions**:
  - `grantRole(bytes32 role, address account)`
  - `revokeRole(bytes32 role, address account)`
  - `hasRole(bytes32 role, address account)`

## 4. Data Flow

The data flow in Vaulté follows these steps:
1. Data owner registers data
2. Data is encrypted client-side
3. Encrypted data is stored on IPFS
4. Metadata and CID are stored on blockchain
5. Buyer requests access to data
6. Owner approves request
7. Payment is processed
8. Encryption key is shared with buyer
9. Buyer accesses and decrypts data

See `data-flow-diagram.svg` for a visual representation.

## 5. Encryption Strategy

Vaulté uses a hybrid encryption approach:
- AES-256-GCM for data encryption
- ECDH for secure key exchange
- Client-side encryption for all sensitive data

See `encryption-strategy.md` for detailed implementation.

## 6. API Endpoints

### 6.1 User API
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### 6.2 Data API
- `POST /api/data/categories` - Create data category
- `GET /api/data/categories` - List user's data categories
- `PUT /api/data/categories/:id` - Update data category
- `DELETE /api/data/categories/:id` - Delete data category
- `POST /api/data/upload` - Upload and encrypt data
- `GET /api/data/access/:id` - Access shared data

### 6.3 Marketplace API
- `GET /api/marketplace/listings` - Get all listings
- `POST /api/marketplace/listings` - Create listing
- `GET /api/marketplace/requests` - Get access requests
- `POST /api/marketplace/requests/:id/approve` - Approve request
- `POST /api/marketplace/requests/:id/reject` - Reject request

## 7. Database Schema

### 7.1 Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(100),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 DataCategories Table
```sql
CREATE TABLE data_categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  blockchain_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_per_day NUMERIC(18,8) NOT NULL,
  data_hash VARCHAR(66) NOT NULL,
  ipfs_cid VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7.3 AccessRequests Table
```sql
CREATE TABLE access_requests (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES data_categories(id),
  requester_id INTEGER REFERENCES users(id),
  blockchain_request_id INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 8. Frontend Components

### 8.1 Pages
- Home/Landing Page
- User Dashboard
- Data Category Management
- Marketplace Browse
- Data Request Management
- User Profile
- Settings

### 8.2 Key Components
- WalletConnect (RainbowKit)
- DataCategoryCard
- RequestList
- DataUploader
- AccessManager
- PaymentProcessor
- DataViewer

## 9. Deployment Architecture

### 9.1 Development Environment
- Local Hardhat Network
- Local PostgreSQL
- Local IPFS Node

### 9.2 Testnet Environment
- Polygon Mumbai
- Railway PostgreSQL
- Pinata IPFS

### 9.3 Production Environment
- Polygon Mainnet
- AWS RDS PostgreSQL
- Pinata + Arweave

## 10. Security Measures

### 10.1 Smart Contract Security
- Access control for all state-changing functions
- ReentrancyGuard for payment functions
- Input validation
- Events for all critical state changes

### 10.2 Frontend Security
- No private keys in localStorage
- Input validation and sanitization
- HTTPS only

### 10.3 Backend Security
- JWT with short expiration
- Rate limiting
- Parameterized queries
- Security logging

## 11. Performance Considerations

### 11.1 Smart Contracts
- Gas optimization
- Batch operations where possible
- Minimal on-chain storage

### 11.2 Frontend
- Code splitting
- Static generation where possible
- Image optimization
- Lazy loading

### 11.3 Backend
- Redis caching
- Database indexing
- Connection pooling
- Horizontal scaling

## 12. Testing Strategy

### 12.1 Smart Contract Testing
- Unit tests for all functions
- Integration tests for contract interactions
- Gas reporting

### 12.2 Frontend Testing
- Component tests with React Testing Library
- E2E tests with Cypress
- Accessibility testing

### 12.3 Backend Testing
- Unit tests for services
- API tests
- Integration tests

## 13. Monitoring and Logging

### 13.1 Smart Contracts
- Event monitoring
- Transaction tracking
- Gas usage monitoring

### 13.2 Frontend
- Error tracking (Sentry)
- Analytics (Plausible)
- Performance monitoring

### 13.3 Backend
- Request logging
- Error tracking
- Performance metrics

## 14. Implementation Timeline

### Phase 1: MVP (Weeks 1-4)
- Basic smart contracts
- Simple frontend
- Core API endpoints

### Phase 2: Enhanced Features (Weeks 5-8)
- Advanced marketplace features
- Improved UI/UX
- Enhanced security

### Phase 3: Scaling & Optimization (Weeks 9-12)
- Performance optimization
- Additional features
- Cross-chain support