const dataMarketplaceService = require('../services/dataMarketplaceService');

/**
 * Controller for DataMarketplace endpoints
 */
const dataMarketplaceController = {
  /**
   * Get all requests for a specific buyer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getBuyerRequests(req, res, next) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ error: true, message: 'Buyer address is required' });
      }
      
      const requestIds = await dataMarketplaceService.getBuyerRequests(address);
      
      // Get details for each request
      const requestsPromises = requestIds.map(id => 
        dataMarketplaceService.getRequestDetails(id)
      );
      
      const requests = await Promise.all(requestsPromises);
      
      return res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all requests for a specific data owner
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getOwnerRequests(req, res, next) {
    try {
      const { address } = req.params;
      
      if (!address) {
        return res.status(400).json({ error: true, message: 'Owner address is required' });
      }
      
      const requestIds = await dataMarketplaceService.getOwnerRequests(address);
      
      // Get details for each request
      const requestsPromises = requestIds.map(id => 
        dataMarketplaceService.getRequestDetails(id)
      );
      
      const requests = await Promise.all(requestsPromises);
      
      return res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get details for a specific request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getRequestDetails(req, res, next) {
    try {
      const { requestId } = req.params;
      
      if (!requestId) {
        return res.status(400).json({ error: true, message: 'Request ID is required' });
      }
      
      const request = await dataMarketplaceService.getRequestDetails(requestId);
      
      return res.status(200).json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Calculate quote for data access
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async calculateQuote(req, res, next) {
    try {
      const { categoryId, durationDays } = req.body;
      
      if (!categoryId || !durationDays) {
        return res.status(400).json({ 
          error: true, 
          message: 'Category ID and duration days are required' 
        });
      }
      
      const quote = await dataMarketplaceService.quote(categoryId, durationDays);
      
      return res.status(200).json({
        success: true,
        data: quote
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dataMarketplaceController;