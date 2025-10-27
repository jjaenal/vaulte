require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const dataVaultRoutes = require('./routes/dataVault');
const dataMarketplaceRoutes = require('./routes/dataMarketplace');
const dataMarketplaceWriteRoutes = require('./routes/dataMarketplaceWrite');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/data-vault', dataVaultRoutes);
app.use('/api/marketplace', dataMarketplaceRoutes);
app.use('/api/marketplace', dataMarketplaceWriteRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Vaulté API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Connected to blockchain: ${process.env.RPC_URL}`);
});

module.exports = app; // For testing