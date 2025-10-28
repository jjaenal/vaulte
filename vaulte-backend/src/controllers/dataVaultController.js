const dataVaultService = require('../services/dataVaultService');

/**
 * Controller for DataVault endpoints
 */
const dataVaultController = {
  /**
   * Get all categories for a specific user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUserCategories(req, res, next) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ error: true, message: 'User address is required' });
      }
      
      const categories = await dataVaultService.getUserCategories(address);
      
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get details for a specific category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getCategoryDetails(req, res, next) {
    try {
      const { categoryId } = req.params;
      if (!categoryId || BigInt(categoryId) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid categoryId' });
      }

      const category = await dataVaultService.getCategoryDetails(BigInt(categoryId));
      
      return res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      const msg = String(error?.shortMessage || error?.message || 'Unknown error');
      if (msg.includes('CategoryNotExists')) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      if (msg.includes('InvalidCategoryId')) {
        return res.status(400).json({ success: false, error: 'Invalid categoryId' });
      }
      next(error);
    }
  },

  /**
   * Get all active categories across all users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllActiveCategories(req, res, next) {
    try {
      const categoryIds = await dataVaultService.getAllActiveCategories();
      
      // Get details for each category
      const categoriesPromises = categoryIds.map(id => 
        dataVaultService.getCategoryDetails(id)
      );
      
      const categories = await Promise.all(categoriesPromises);
      
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Check permission for a buyer on a category
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  async checkPermission(req, res, next) {
    try {
      const { categoryId, buyer } = req.query;
      if (!categoryId || BigInt(categoryId) <= 0n) {
        return res.status(400).json({ error: true, message: 'Invalid categoryId' });
      }
      if (!buyer || typeof buyer !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(buyer)) {
        return res.status(400).json({ error: true, message: 'Invalid buyer address' });
      }
      const hasAccess = await dataVaultService.checkPermission(BigInt(categoryId), buyer);
      return res.status(200).json({ success: true, categoryId: String(categoryId), buyer, hasAccess });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dataVaultController;