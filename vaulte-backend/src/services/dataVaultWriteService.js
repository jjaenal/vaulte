const { 
  walletClient, 
  account, 
  publicClient, 
  DATA_VAULT_ADDRESS, 
  DataVaultABI 
} = require('../utils/blockchain');

class DataVaultWriteService {
  async registerCategory(name, pricePerDayWei, dataHash) {
    try {
      const { request } = await publicClient.simulateContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'registerDataCategory',
        args: [name, pricePerDayWei, dataHash],
        account: account.address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Decode event to get categoryId
      let categoryId = null;
      for (const log of receipt.logs) {
        try {
          const event = publicClient.decodeEventLog({
            abi: DataVaultABI,
            data: log.data,
            topics: log.topics,
          });
          if (event.eventName === 'DataCategoryRegistered') {
            categoryId = Number(event.args.categoryId);
            break;
          }
        } catch (_) {}
      }

      return { hash, status: receipt.status, categoryId };
    } catch (error) {
      console.error('Error registerCategory:', error);
      throw error;
    }
  }

  async deactivateCategory(categoryId) {
    try {
      const { request } = await publicClient.simulateContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'deactivateDataCategory',
        args: [categoryId],
        account: account.address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return { hash, status: receipt.status };
    } catch (error) {
      console.error('Error deactivateCategory:', error);
      throw error;
    }
  }

  async grantPermission(categoryId, buyerAddress, durationDays) {
    try {
      const { request } = await publicClient.simulateContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'grantPermission',
        args: [categoryId, buyerAddress, durationDays],
        account: account.address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return { hash, status: receipt.status };
    } catch (error) {
      console.error('Error grantPermission:', error);
      throw error;
    }
  }

  async revokePermission(categoryId, buyerAddress) {
    try {
      // simulateContract returns { result } for the return value
      const { request, result } = await publicClient.simulateContract({
        address: DATA_VAULT_ADDRESS,
        abi: DataVaultABI,
        functionName: 'revokePermission',
        args: [categoryId, buyerAddress],
        account: account.address,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const refundAmount = result; // bigint
      return { hash, status: receipt.status, refundAmount };
    } catch (error) {
      console.error('Error revokePermission:', error);
      throw error;
    }
  }
}

module.exports = new DataVaultWriteService();