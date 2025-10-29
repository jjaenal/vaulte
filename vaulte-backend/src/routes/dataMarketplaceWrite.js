const express = require('express');
const router = express.Router();
const dataMarketplaceWriteController = require('../controllers/dataMarketplaceWriteController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route POST /api/marketplace/request
 * @desc Request access to a data category
 * @access Protected (JWT required)
 */
router.post('/request', authenticateToken, dataMarketplaceWriteController.requestAccess);

/**
 * @route POST /api/marketplace/approve/:requestId
 * @desc Approve an access request
 * @access Protected (JWT required)
 */
router.post('/approve/:requestId', authenticateToken, dataMarketplaceWriteController.approveRequest);

/**
 * @route POST /api/marketplace/reject/:requestId
 * @desc Reject an access request
 * @access Protected (JWT required)
 */
router.post('/reject/:requestId', authenticateToken, dataMarketplaceWriteController.rejectRequest);

/**
 * @route POST /api/marketplace/cancel/:requestId
 * @desc Cancel an access request
 * @access Protected (JWT required)
 */
router.post('/cancel/:requestId', authenticateToken, dataMarketplaceWriteController.cancelRequest);

module.exports = router;