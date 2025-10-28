const { 
  walletClient, 
  account, 
  publicClient, 
  DATA_MARKETPLACE_ADDRESS, 
  DataMarketplaceABI 
} = require('../utils/blockchain');

class DataMarketplaceWriteService {
  /**
   * Request access to a data category
   * @param {string} buyerAddress - Address of the buyer requesting access
   * @param {number} categoryId - ID of the data category
   * @param {number} durationDays - Duration in days for access
   * @returns {Promise<{requestId: number, hash: string}>} - Transaction result
   */
  async requestAccess(buyerAddress, categoryId, durationDays) {
    try {
      // Prepare transaction
      const { request } = await publicClient.simulateContract({
        address: DATA_MARKETPLACE_ADDRESS,
        abi: DataMarketplaceABI,
        functionName: 'requestAccess',
        args: [categoryId, durationDays],
        account: buyerAddress || account.address,
      });

      // Send transaction
      const hash = await walletClient.writeContract(request);
      
      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Extract requestId from logs
      const requestCreatedLog = receipt.logs.find(log => {
        try {
          const event = publicClient.decodeEventLog({
            abi: DataMarketplaceABI,
            data: log.data,
            topics: log.topics,
          });
          return event.eventName === 'RequestCreated';
        } catch {
          console.warn('Decode log error, skipping');
          return false;
        }
      });
      
      let requestId = null;
      if (requestCreatedLog) {
        const event = publicClient.decodeEventLog({
          abi: DataMarketplaceABI,
          data: requestCreatedLog.data,
          topics: requestCreatedLog.topics,
        });
        requestId = Number(event.args.requestId);
      }

      return {
        requestId,
        hash: hash,
        status: receipt.status
      };
    } catch (error) {
      console.error('Error requesting access:', error);
      throw error;
    }
  }

  /**
   * Approve an access request
   * @param {number} requestId - ID of the request to approve
   * @param {string} ownerAddress - Address of the data owner
   * @returns {Promise<{hash: string}>} - Transaction result
   */
  async approveRequest(requestId, ownerAddress) {
    try {
      // Prepare transaction
      const { request } = await publicClient.simulateContract({
        address: DATA_MARKETPLACE_ADDRESS,
        abi: DataMarketplaceABI,
        functionName: 'approveRequest',
        args: [requestId],
        account: ownerAddress || account.address,
      });

      // Send transaction
      const hash = await walletClient.writeContract(request);
      
      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash: hash,
        status: receipt.status
      };
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  /**
   * Reject an access request
   * @param {number} requestId - ID of the request to reject
   * @param {string} ownerAddress - Address of the data owner
   * @returns {Promise<{hash: string}>} - Transaction result
   */
  async rejectRequest(requestId, ownerAddress) {
    try {
      // Prepare transaction
      const { request } = await publicClient.simulateContract({
        address: DATA_MARKETPLACE_ADDRESS,
        abi: DataMarketplaceABI,
        functionName: 'rejectRequest',
        args: [requestId],
        account: ownerAddress || account.address,
      });

      // Send transaction
      const hash = await walletClient.writeContract(request);
      
      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash: hash,
        status: receipt.status
      };
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  /**
   * Cancel an access request
   * @param {number} requestId - ID of the request to cancel
   * @param {string} buyerAddress - Address of the buyer
   * @returns {Promise<{hash: string}>} - Transaction result
   */
  async cancelRequest(requestId, buyerAddress) {
    try {
      // Prepare transaction
      const { request } = await publicClient.simulateContract({
        address: DATA_MARKETPLACE_ADDRESS,
        abi: DataMarketplaceABI,
        functionName: 'cancelRequest',
        args: [requestId],
        account: buyerAddress || account.address,
      });

      // Send transaction
      const hash = await walletClient.writeContract(request);
      
      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return {
        hash: hash,
        status: receipt.status
      };
    } catch (error) {
      console.error('Error canceling request:', error);
      throw error;
    }
  }
}

module.exports = new DataMarketplaceWriteService();