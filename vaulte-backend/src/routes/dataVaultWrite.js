const express = require('express');
const router = express.Router();
const dataVaultWriteController = require('../controllers/dataVaultWriteController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /api/data-vault/categories
 * @desc    Register a new data category (owner)
 * @access  Protected (JWT required)
 */
router.post('/categories', authenticateToken, dataVaultWriteController.registerCategory);

/**
 * @route   POST /api/data-vault/categories/:categoryId/deactivate
 * @desc    Deactivate a data category
 * @access  Protected (JWT required)
 */
router.post('/categories/:categoryId/deactivate', authenticateToken, dataVaultWriteController.deactivateCategory);

/**
 * @route   POST /api/data-vault/categories/:categoryId/update
 * @desc    Update price and data hash of a category
 * @access  Protected (JWT required)
 */
router.post('/categories/:categoryId/update', authenticateToken, dataVaultWriteController.updateCategory);

/**
 * @route   POST /api/data-vault/permissions/grant
 * @desc    Grant permission to a buyer for a category
 * @access  Protected (JWT required)
 */
router.post('/permissions/grant', authenticateToken, dataVaultWriteController.grantPermission);

/**
 * @route   POST /api/data-vault/permissions/revoke
 * @desc    Revoke permission and compute refund
 * @access  Protected (JWT required)
 */
router.post('/permissions/revoke', authenticateToken, dataVaultWriteController.revokePermission);

module.exports = router;