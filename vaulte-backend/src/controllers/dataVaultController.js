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
      
      if (!categoryId) {
        return res.status(400).json({ error: true, message: 'Category ID is required' });
      }
      
      const category = await dataVaultService.getCategoryDetails(categoryId);
      
      return res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
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
  }
};

module.exports = dataVaultController;