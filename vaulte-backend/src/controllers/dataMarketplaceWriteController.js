const dataMarketplaceWriteService = require('../services/dataMarketplaceWriteService');

/**
 * Controller for DataMarketplace write operations
 */
class DataMarketplaceWriteController {
  /**
   * Request access to a data category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async requestAccess(req, res, next) {
    try {
      const { categoryId, durationDays, buyerAddress } = req.body;
      
      if (!categoryId || !durationDays) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required parameters: categoryId and durationDays are required' 
        });
      }

      const result = await dataMarketplaceWriteService.requestAccess(
        buyerAddress, 
        Number(categoryId), 
        Number(durationDays)
      );

      return res.status(201).json({
        success: true,
        data: result,
        message: `Access request created with ID: ${result.requestId}`
      });
    } catch (error) {
      console.error('Error in requestAccess controller:', error);
      
      // Handle specific contract errors
      if (error.message.includes('CategoryNotActive')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Category is not active',
          error: error.message
        });
      }
      
      if (error.message.includes('ZeroDuration')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Duration must be greater than zero',
          error: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Approve an access request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async approveRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const { ownerAddress } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required parameter: requestId' 
        });
      }

      const result = await dataMarketplaceWriteService.approveRequest(
        Number(requestId),
        ownerAddress
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: `Request ${requestId} approved successfully`
      });
    } catch (error) {
      console.error('Error in approveRequest controller:', error);
      
      // Handle specific contract errors
      if (error.message.includes('NotRequestOwner')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only the data owner can approve this request',
          error: error.message
        });
      }
      
      if (error.message.includes('InvalidRequestStatus')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Request cannot be approved in its current status',
          error: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Reject an access request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async rejectRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const { ownerAddress } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required parameter: requestId' 
        });
      }

      const result = await dataMarketplaceWriteService.rejectRequest(
        Number(requestId),
        ownerAddress
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: `Request ${requestId} rejected successfully`
      });
    } catch (error) {
      console.error('Error in rejectRequest controller:', error);
      
      // Handle specific contract errors
      if (error.message.includes('NotRequestOwner')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only the data owner can reject this request',
          error: error.message
        });
      }
      
      if (error.message.includes('InvalidRequestStatus')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Request cannot be rejected in its current status',
          error: error.message
        });
      }

      next(error);
    }
  }

  /**
   * Cancel an access request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async cancelRequest(req, res, next) {
    try {
      const { requestId } = req.params;
      const { buyerAddress } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required parameter: requestId' 
        });
      }

      const result = await dataMarketplaceWriteService.cancelRequest(
        Number(requestId),
        buyerAddress
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: `Request ${requestId} cancelled successfully`
      });
    } catch (error) {
      console.error('Error in cancelRequest controller:', error);
      
      // Handle specific contract errors
      if (error.message.includes('NotRequestBuyer')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only the buyer can cancel this request',
          error: error.message
        });
      }
      
      if (error.message.includes('InvalidRequestStatus')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Request cannot be cancelled in its current status',
          error: error.message
        });
      }

      next(error);
    }
  }
}

module.exports = new DataMarketplaceWriteController();