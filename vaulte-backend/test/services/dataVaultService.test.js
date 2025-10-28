// Mock blockchain module
jest.mock('../../src/utils/blockchain', () => ({
  publicClient: {
    readContract: jest.fn()
  },
  DATA_VAULT_ADDRESS: '0xVaultAddress',
  DataVaultABI: []
}));

const { publicClient } = require('../../src/utils/blockchain');
const dataVaultService = require('../../src/services/dataVaultService');

describe('DataVaultService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCategories', () => {
    it('returns categories for user address', async () => {
      // Mock data
      const mockCategories = [1n, 2n, 3n];
      publicClient.readContract.mockResolvedValueOnce(mockCategories);
      
      // Call service
      const result = await dataVaultService.getUserCategories('0xUserAddress');
      
      // Assertions
      expect(publicClient.readContract).toHaveBeenCalledWith({
        address: '0xVaultAddress',
        abi: expect.any(Array),
        functionName: 'getUserCategories',
        args: ['0xUserAddress']
      });
      expect(result).toEqual(mockCategories);
    });

    it('throws error when blockchain call fails', async () => {
      // Mock error
      const mockError = new Error('RPC error');
      publicClient.readContract.mockRejectedValueOnce(mockError);
      
      // Call and expect error
      await expect(dataVaultService.getUserCategories('0xUserAddress'))
        .rejects.toThrow(mockError);
    });
  });

  describe('getCategoryDetails', () => {
    it('maps category details correctly', async () => {
      // Mock data
      const mockCategory = {
        name: 'Health Data',
        owner: '0xOwnerAddress',
        isActive: true,
        pricePerDay: 1000n,
        dataHash: '0xDataHash'
      };
      publicClient.readContract.mockResolvedValueOnce(mockCategory);
      
      // Call service
      const result = await dataVaultService.getCategoryDetails(1);
      
      // Assertions
      expect(publicClient.readContract).toHaveBeenCalledWith({
        address: '0xVaultAddress',
        abi: expect.any(Array),
        functionName: 'getDataCategory',
        args: [1]
      });
      expect(result).toEqual({
        id: '1',
        name: 'Health Data',
        owner: '0xOwnerAddress',
        active: true,
        pricePerDay: '1000',
        dataHash: '0xDataHash'
      });
    });

    it('handles string conversion for pricePerDay', async () => {
      // Mock data with number instead of BigInt
      const mockCategory = {
        name: 'Health Data',
        owner: '0xOwnerAddress',
        isActive: true,
        pricePerDay: 1000, // Number instead of BigInt
        dataHash: '0xDataHash'
      };
      publicClient.readContract.mockResolvedValueOnce(mockCategory);
      
      // Call service
      const result = await dataVaultService.getCategoryDetails(1);
      
      // Assertions
      expect(result.pricePerDay).toBe('1000');
    });

    it('throws error when blockchain call fails', async () => {
      // Mock error
      const mockError = new Error('RPC error');
      publicClient.readContract.mockRejectedValueOnce(mockError);
      
      // Call and expect error
      await expect(dataVaultService.getCategoryDetails(1))
        .rejects.toThrow(mockError);
    });

    it('formats pricePerDay via toString when available', async () => {
      const mockDetail = {
        name: 'Cat', owner: '0x1', isActive: true, pricePerDay: 1234n, dataHash: '0xHash'
      };
      publicClient.readContract.mockResolvedValueOnce(mockDetail);
      const res = await dataVaultService.getCategoryDetails(5);
      expect(res.pricePerDay).toBe('1234');
    });

    it('formats pricePerDay via String() when toString missing', async () => {
      const mockDetail = {
        name: 'Cat', owner: '0x1', isActive: true, pricePerDay: null, dataHash: '0xHash'
      };
      publicClient.readContract.mockResolvedValueOnce(mockDetail);
      const res = await dataVaultService.getCategoryDetails(6);
      expect(res.pricePerDay).toBe('null');
    });
  });

  describe('getAllActiveCategories', () => {
    it('filters and returns only active categories', async () => {
      // Mock data
      publicClient.readContract.mockResolvedValueOnce(3n); // totalCategories = 3
      
      // Mock category responses
      const mockCategories = [
        { name: 'Cat1', owner: '0x1', isActive: true, pricePerDay: 100n, dataHash: '0xHash1' },
        { name: 'Cat2', owner: '0x2', isActive: false, pricePerDay: 200n, dataHash: '0xHash2' },
        { name: 'Cat3', owner: '0x3', isActive: true, pricePerDay: 300n, dataHash: '0xHash3' }
      ];
      
      // Setup mock responses for each category
      publicClient.readContract
        .mockResolvedValueOnce(mockCategories[0])
        .mockResolvedValueOnce(mockCategories[1])
        .mockResolvedValueOnce(mockCategories[2]);
      
      // Call service
      const result = await dataVaultService.getAllActiveCategories();
      
      // Assertions
      expect(publicClient.readContract).toHaveBeenCalledTimes(4); // 1 for total + 3 categories
      expect(result.length).toBe(2); // Only 2 active categories
      expect(result[0].name).toBe('Cat1');
      expect(result[1].name).toBe('Cat3');
      expect(result[0].active).toBe(true);
      expect(result[1].active).toBe(true);
    });

    it('returns empty array when no categories exist', async () => {
      // Mock data - no categories
      publicClient.readContract.mockResolvedValueOnce(0n); // totalCategories = 0
      
      // Call service
      const result = await dataVaultService.getAllActiveCategories();
      
      // Assertions
      expect(publicClient.readContract).toHaveBeenCalledTimes(1); // Only call for totalCategories
      expect(result).toEqual([]);
    });

    it('throws error when blockchain call fails', async () => {
      // Mock error
      const mockError = new Error('RPC error');
      publicClient.readContract.mockRejectedValueOnce(mockError);
      
      // Call and expect error
      await expect(dataVaultService.getAllActiveCategories())
        .rejects.toThrow(mockError);
    });

    it('uses String() fallback for pricePerDay when toString missing', async () => {
      // totalCategories = 1
      publicClient.readContract
        .mockResolvedValueOnce(1n)
        .mockResolvedValueOnce({
          name: 'X', owner: '0x1', isActive: true, pricePerDay: null, dataHash: '0xHash'
        });
      const res = await dataVaultService.getAllActiveCategories();
      expect(res[0].pricePerDay).toBe('null');
    });
  });

  describe('checkPermission', () => {
    it('returns true when user has permission', async () => {
      // Mock data
      publicClient.readContract.mockResolvedValueOnce(true);
      
      // Call service
      const result = await dataVaultService.checkPermission(1, '0xBuyerAddress');
      
      // Assertions
      expect(publicClient.readContract).toHaveBeenCalledWith({
        address: '0xVaultAddress',
        abi: expect.any(Array),
        functionName: 'checkPermission',
        args: [1n, '0xBuyerAddress']
      });
      expect(result).toBe(true);
    });

    it('returns false when user does not have permission', async () => {
      // Mock data
      publicClient.readContract.mockResolvedValueOnce(false);
      
      // Call service
      const result = await dataVaultService.checkPermission(1, '0xBuyerAddress');
      
      // Assertions
      expect(result).toBe(false);
    });

    it('throws error when blockchain call fails', async () => {
      // Mock error
      const mockError = new Error('RPC error');
      publicClient.readContract.mockRejectedValueOnce(mockError);
      
      // Call and expect error
      await expect(dataVaultService.checkPermission(1, '0xBuyerAddress'))
        .rejects.toThrow(mockError);
    });
  });
});