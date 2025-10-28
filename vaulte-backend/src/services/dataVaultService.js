const { publicClient, DATA_VAULT_ADDRESS, DataVaultABI } = require('../utils/blockchain');

/**
 * Service for interacting with DataVault smart contract
 */
class DataVaultService {
  /**
   * Get all data categories for a specific user
   * @param {string} userAddress - Ethereum address of the user
   * @returns {Promise<Array>} - Array of data categories
   */
  async getUserCategories(userAddress) {
    try {
      const result = await publicClient.readContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'getUserCategories',
        args: [userAddress]
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching user categories:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific data category
   * @param {string} categoryId - ID of the data category
   * @returns {Promise<Object>} - Category details
   */
  async getCategoryDetails(categoryId) {
    try {
      const result = await publicClient.readContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'getDataCategory',
        args: [categoryId]
      });
      
      return {
        id: String(categoryId),
        name: result.name,
        owner: result.owner,
        active: result.isActive,
        pricePerDay: result.pricePerDay?.toString?.() ?? String(result.pricePerDay),
        dataHash: result.dataHash
      };
    } catch (error) {
      console.error(`Error fetching category details for ID ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get all active categories across all users
   * Iterates totalCategories and returns details for active ones
   * @returns {Promise<Array>} - Array of active category details
   */
  async getAllActiveCategories() {
    try {
      // Read totalCategories (public uint)
      const totalCategories = await publicClient.readContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'totalCategories'
      });

      const active = [];
      for (let i = 1n; i <= totalCategories; i++) {
        const cat = await publicClient.readContract({
          address: DATA_VAULT_ADDRESS,
          abi: DataVaultABI,
          functionName: 'getDataCategory',
          args: [i]
        });
        // cat: [name, owner, isActive, pricePerDay, dataHash]
        if (cat.isActive) {
          active.push({
            id: String(i),
            name: cat.name,
            owner: cat.owner,
            active: cat.isActive,
            pricePerDay: cat.pricePerDay?.toString?.() ?? String(cat.pricePerDay),
            dataHash: cat.dataHash
          });
        }
      }
      return active;
    } catch (error) {
      console.error('Error fetching all active categories:', error);
      throw error;
    }
  }

  /**
   * Check whether a buyer currently has valid permission
   * @param {bigint|string|number} categoryId
   * @param {string} buyer
   * @returns {Promise<boolean>}
   */
  async checkPermission(categoryId, buyer) {
    try {
      const hasAccess = await publicClient.readContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'checkPermission',
        args: [BigInt(categoryId), buyer]
      });
      return hasAccess;
    } catch (error) {
      console.error('Error checking permission:', error);
      throw error;
    }
  }
}

module.exports = new DataVaultService();