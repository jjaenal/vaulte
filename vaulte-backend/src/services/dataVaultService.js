const { publicClient, contractAddresses, contractABIs } = require('../utils/blockchain');

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
        address: contractAddresses.dataVault,
        abi: contractABIs.dataVault,
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
        address: contractAddresses.dataVault,
        abi: contractABIs.dataVault,
        functionName: 'getCategory',
        args: [categoryId]
      });
      
      return {
        id: categoryId,
        name: result[0],
        owner: result[1],
        pricePerDay: result[2],
        dataHash: result[3],
        active: result[4]
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
        address: contractAddresses.dataVault,
        abi: contractABIs.dataVault,
        functionName: 'totalCategories'
      });

      const active = [];
      for (let i = 1n; i <= totalCategories; i++) {
        const cat = await publicClient.readContract({
          address: contractAddresses.dataVault,
          abi: contractABIs.dataVault,
          functionName: 'getDataCategory',
          args: [i]
        });
        // cat: [name, owner, isActive, pricePerDay, dataHash]
        if (cat[2]) {
          active.push({
            id: i,
            name: cat[0],
            owner: cat[1],
            active: cat[2],
            pricePerDay: cat[3],
            dataHash: cat[4]
          });
        }
      }
      return active;
    } catch (error) {
      console.error('Error fetching all active categories:', error);
      throw error;
    }
  }
}

module.exports = new DataVaultService();