const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const dataVaultRoutes = require('./routes/dataVault');
const dataVaultWriteRoutes = require('./routes/dataVaultWrite');
const dataMarketplaceRoutes = require('./routes/dataMarketplace');
const dataMarketplaceWriteRoutes = require('./routes/dataMarketplaceWrite');
const authRoutes = require('./routes/auth');

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, 'docs/swagger.yaml'));

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(morgan('dev')); // Logging

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/api/data-vault', dataVaultRoutes);
app.use('/api/data-vault', dataVaultWriteRoutes);
app.use('/api/marketplace', dataMarketplaceRoutes);
app.use('/api/marketplace', dataMarketplaceWriteRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.info(`Vaulté API server running on port ${PORT}`);
    console.info(`Environment: ${process.env.NODE_ENV}`);
    console.info(`Connected to blockchain: ${process.env.RPC_URL}`);
  });
}

module.exports = app; // For testing