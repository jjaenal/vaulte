const express = require('express');
const router = express.Router();
const dataMarketplaceController = require('../controllers/dataMarketplaceController');

/**
 * @route   GET /api/marketplace/requests/buyer/:address
 * @desc    Get all requests for a specific buyer
 * @access  Public
 */
router.get('/requests/buyer/:address', dataMarketplaceController.getBuyerRequests);

/**
 * @route   GET /api/marketplace/requests/owner/:address
 * @desc    Get all requests for a specific data owner
 * @access  Public
 */
router.get('/requests/owner/:address', dataMarketplaceController.getOwnerRequests);

/**
 * @route   GET /api/marketplace/requests/:requestId
 * @desc    Get details for a specific request
 * @access  Public
 */
router.get('/requests/:requestId', dataMarketplaceController.getRequestDetails);

/**
 * @route   POST /api/marketplace/quote
 * @desc    Calculate quote for data access
 * @access  Public
 */
router.post('/quote', dataMarketplaceController.calculateQuote);

module.exports = router;