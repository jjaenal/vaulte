const express = require('express');
const router = express.Router();
const dataMarketplaceWriteController = require('../controllers/dataMarketplaceWriteController');

/**
 * @route POST /api/marketplace/request
 * @desc Request access to a data category
 * @access Public
 */
router.post('/request', dataMarketplaceWriteController.requestAccess);

/**
 * @route POST /api/marketplace/approve/:requestId
 * @desc Approve an access request
 * @access Public
 */
router.post('/approve/:requestId', dataMarketplaceWriteController.approveRequest);

/**
 * @route POST /api/marketplace/reject/:requestId
 * @desc Reject an access request
 * @access Public
 */
router.post('/reject/:requestId', dataMarketplaceWriteController.rejectRequest);

/**
 * @route POST /api/marketplace/cancel/:requestId
 * @desc Cancel an access request
 * @access Public
 */
router.post('/cancel/:requestId', dataMarketplaceWriteController.cancelRequest);

module.exports = router;