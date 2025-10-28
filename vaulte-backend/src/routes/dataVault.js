const express = require('express');
const router = express.Router();
const dataVaultController = require('../controllers/dataVaultController');

/**
 * @route   GET /api/data-vault/categories/active
 * @desc    Get all active data categories
 * @access  Public
 */
router.get('/categories/active', dataVaultController.getAllActiveCategories);

/**
 * @route   GET /api/data-vault/categories/user/:address
 * @desc    Get all categories for a specific user
 * @access  Public
 */
router.get('/categories/user/:address', dataVaultController.getUserCategories);

/**
 * @route   GET /api/data-vault/categories/:categoryId
 * @desc    Get details for a specific category
 * @access  Public
 */
router.get('/categories/:categoryId', dataVaultController.getCategoryDetails);

/**
 * @route   GET /api/data-vault/permissions/check
 * @desc    Check permission for a buyer on a category
 * @access  Public
 */
router.get('/permissions/check', dataVaultController.checkPermission);

module.exports = router;