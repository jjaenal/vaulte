const { publicClient, contractAddresses, contractABIs } = require('../utils/blockchain');

/**
 * Service for interacting with DataMarketplace smart contract
 */
class DataMarketplaceService {
  /**
   * Get all data requests for a specific buyer
   * @param {string} buyerAddress - Ethereum address of the buyer
   * @returns {Promise<Array>} - Array of data requests
   */
  async getBuyerRequests(buyerAddress) {
    try {
      // Iterate totalRequests and filter by buyer
      const totalRequests = await publicClient.readContract({
        address: contractAddresses.dataMarketplace,
        abi: contractABIs.dataMarketplace,
        functionName: 'totalRequests'
      });
      const matches = [];
      for (let i = 1n; i <= totalRequests; i++) {
        const r = await publicClient.readContract({
          address: contractAddresses.dataMarketplace,
          abi: contractABIs.dataMarketplace,
          functionName: 'requestsById',
          args: [i]
        });
        // r: [buyer, seller, categoryId, durationDays, amount, status]
        if (r[0].toLowerCase() === buyerAddress.toLowerCase()) {
          matches.push(i);
        }
      }
      return matches;
    } catch (error) {
      console.error('Error fetching buyer requests:', error);
      throw error;
    }
  }

  /**
   * Get all data requests for a specific data owner
   * @param {string} ownerAddress - Ethereum address of the data owner
   * @returns {Promise<Array>} - Array of data requests
   */
  async getOwnerRequests(ownerAddress) {
    try {
      // Iterate totalRequests and filter by seller
      const totalRequests = await publicClient.readContract({
        address: contractAddresses.dataMarketplace,
        abi: contractABIs.dataMarketplace,
        functionName: 'totalRequests'
      });
      const matches = [];
      for (let i = 1n; i <= totalRequests; i++) {
        const r = await publicClient.readContract({
          address: contractAddresses.dataMarketplace,
          abi: contractABIs.dataMarketplace,
          functionName: 'requestsById',
          args: [i]
        });
        if (r[1].toLowerCase() === ownerAddress.toLowerCase()) {
          matches.push(i);
        }
      }
      return matches;
    } catch (error) {
      console.error('Error fetching owner requests:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific data request
   * @param {string} requestId - ID of the data request
   * @returns {Promise<Object>} - Request details
   */
  async getRequestDetails(requestId) {
    try {
      const result = await publicClient.readContract({
        address: contractAddresses.dataMarketplace,
        abi: contractABIs.dataMarketplace,
        functionName: 'requestsById',
        args: [requestId]
      });
      
      return {
        id: requestId,
        buyer: result[0],
        categoryId: result[1],
        seller: result[2],
        durationDays: result[3],
        totalAmount: result[4],
        status: this._mapRequestStatus(result[5])
      };
    } catch (error) {
      console.error(`Error fetching request details for ID ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate quote for data access
   * @param {string} categoryId - ID of the data category
   * @param {number} durationDays - Duration in days
   * @returns {Promise<Object>} - Quote details
   */
  async quote(categoryId, durationDays) {
    try {
      const result = await publicClient.readContract({
        address: contractAddresses.dataMarketplace,
        abi: contractABIs.dataMarketplace,
        functionName: 'quote',
        args: [categoryId, durationDays]
      });
      
      // result: [total, platformFee, ownerAmount]
      return {
        totalAmount: result[0],
        platformFee: result[1],
        ownerAmount: result[2]
      };
    } catch (error) {
      console.error('Error calculating quote:', error);
      throw error;
    }
  }

  /**
   * Map numeric request status to string representation
   * @param {number} statusCode - Numeric status code
   * @returns {string} - String representation of status
   * @private
   */
  _mapRequestStatus(statusCode) {
    const statuses = ['Requested', 'Approved', 'Rejected', 'Cancelled', 'Expired'];
    return statuses[statusCode] || 'Unknown';
  }
}

module.exports = new DataMarketplaceService();