const express = require('express');
const helmet = require('helmet');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
// Rate limiting middleware
const {
  generalLimiter,
  authLimiter,
  writeLimiter,
  progressiveSlowdown,
  rateLimitInfo
} = require('./middleware/rateLimiting');
const { createCompositeLimiter, testBypass } = require('./middleware/rateLimiting');
const { errorHandler } = require('./middleware/errorHandler');
const { createCors } = require('./middleware/cors');
const { createLogger } = require('./middleware/logging');

// Load environment variables
dotenv.config();

// Import routes
const dataVaultRoutes = require('./routes/dataVault');
const dataVaultWriteRoutes = require('./routes/dataVaultWrite');
const dataMarketplaceRoutes = require('./routes/dataMarketplace');
const dataMarketplaceWriteRoutes = require('./routes/dataMarketplaceWrite');
const authRoutes = require('./routes/auth');
const sseRoutes = require('./routes/sse');
const { startWatcher } = require('./services/categoryWatcher');

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, 'docs/swagger.yaml'));

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Izinkan resource diakses lintas origin untuk SSE (CORP), tetap aman untuk header lain
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(createCors());
app.use(express.json());
app.use(createLogger()); // Logging
// Rate limit info headers
app.use(rateLimitInfo);
// Apply general rate limiter and progressive slowdown globally
app.use(generalLimiter);
app.use(progressiveSlowdown);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/data-vault', dataVaultRoutes);
// Apply write limiter only for write routes
app.use('/api/data-vault', writeLimiter, dataVaultWriteRoutes);
app.use('/api/marketplace', dataMarketplaceRoutes);
app.use('/api/marketplace', writeLimiter, dataMarketplaceWriteRoutes);
// Strict limiter for auth endpoints, bypass during tests
const authLimiterWithBypass = createCompositeLimiter(testBypass, authLimiter);
app.use('/api/auth', authLimiterWithBypass, authRoutes);

// SSE routes (server-push)
app.use('/sse', sseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.info(`Vaulté API server running on port ${PORT}`);
    console.info(`Environment: ${process.env.NODE_ENV}`);
    console.info(`Connected to blockchain: ${process.env.RPC_URL}`);
    // Start watcher untuk push update
    startWatcher();
  });
}

module.exports = app; // For testing