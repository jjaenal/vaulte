const { grantPermission, revokePermission, updateCategory } = require('../../src/controllers/dataVaultWriteController');
const dataVaultWriteService = require('../../src/services/dataVaultWriteService');

// Mock dependencies
jest.mock('../../src/services/dataVaultWriteService');

describe('DataVaultWriteController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateCategory', () => {
    it('should update category when valid data is provided', async () => {
      // Arrange
      const categoryId = '1';
      const newPricePerDayWei = '2000000000000000';
      const newDataHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      const txResult = { hash: '0x123', status: 'success' };
      
      req.params.categoryId = categoryId;
      req.body = { newPricePerDayWei, newDataHash };
      dataVaultWriteService.updateCategory.mockResolvedValue(txResult);

      // Act
      await updateCategory(req, res);

      // Assert
      expect(dataVaultWriteService.updateCategory).toHaveBeenCalledWith(
        BigInt(categoryId), 
        BigInt(newPricePerDayWei),
        newDataHash
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hash: txResult.hash,
        status: txResult.status
      });
    });

    it('should return 400 when invalid data is provided', async () => {
      // Arrange
      req.params.categoryId = '1';
      req.body = { newPricePerDayWei: '0' }; // Missing newDataHash

      // Act
      await updateCategory(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Invalid newPricePerDayWei'
      });
    });
  });

  describe('grantPermission', () => {
    it('should grant permission when valid data is provided', async () => {
      // Arrange
      const categoryId = '1';
      const buyer = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const durationDays = 5;
      const txResult = { hash: '0x123', status: 'success' };
      
      req.body = { categoryId, buyer, durationDays };
      dataVaultWriteService.grantPermission.mockResolvedValue(txResult);

      // Act
      await grantPermission(req, res);

      // Assert
      expect(dataVaultWriteService.grantPermission).toHaveBeenCalledWith(
        BigInt(categoryId), 
        buyer,
        Number(durationDays)
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hash: txResult.hash,
        status: txResult.status
      });
    });
  });

  describe('revokePermission', () => {
    it('should revoke permission when valid data is provided', async () => {
      // Arrange
      const categoryId = '1';
      const buyer = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const txResult = { 
        hash: '0x123', 
        status: 'success',
        refundAmount: '1000000000000000' 
      };
      
      req.body = { categoryId, buyer };
      dataVaultWriteService.revokePermission.mockResolvedValue(txResult);

      // Act
      await revokePermission(req, res);

      // Assert
      expect(dataVaultWriteService.revokePermission).toHaveBeenCalledWith(
        BigInt(categoryId), 
        buyer
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        hash: txResult.hash,
        status: txResult.status,
        refundAmount: txResult.refundAmount
      });
    });
  });
});