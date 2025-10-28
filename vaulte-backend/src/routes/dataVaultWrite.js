const express = require('express');
const router = express.Router();
const dataVaultWriteController = require('../controllers/dataVaultWriteController');

/**
 * @route   POST /api/data-vault/categories
 * @desc    Register a new data category (owner)
 * @access  Protected via backend signer
 */
router.post('/categories', dataVaultWriteController.registerCategory);

/**
 * @route   POST /api/data-vault/categories/:categoryId/deactivate
 * @desc    Deactivate a data category
 * @access  Protected via backend signer
 */
router.post('/categories/:categoryId/deactivate', dataVaultWriteController.deactivateCategory);

/**
 * @route   POST /api/data-vault/categories/:categoryId/update
 * @desc    Update price and data hash of a category
 * @access  Protected via backend signer
 */
router.post('/categories/:categoryId/update', dataVaultWriteController.updateCategory);

/**
 * @route   POST /api/data-vault/permissions/grant
 * @desc    Grant permission to a buyer for a category
 * @access  Protected via backend signer
 */
router.post('/permissions/grant', dataVaultWriteController.grantPermission);

/**
 * @route   POST /api/data-vault/permissions/revoke
 * @desc    Revoke permission and compute refund
 * @access  Protected via backend signer
 */
router.post('/permissions/revoke', dataVaultWriteController.revokePermission);

module.exports = router;