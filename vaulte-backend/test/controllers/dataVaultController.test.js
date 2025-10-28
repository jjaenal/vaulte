const { getCategoryDetails, checkPermission } = require('../../src/controllers/dataVaultController');
const dataVaultService = require('../../src/services/dataVaultService');

// Mock dependencies
jest.mock('../../src/services/dataVaultService');

describe('DataVaultController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategoryDetails', () => {
    it('should return category details when valid ID is provided', async () => {
      // Arrange
      const categoryId = '1';
      const categoryData = {
        id: '1',
        name: 'Fitness Data',
        owner: '0x123',
        active: true,
        pricePerDay: '1000000000000000',
        dataHash: '0x123'
      };
      
      req.params.categoryId = categoryId;
      dataVaultService.getCategoryDetails.mockResolvedValue(categoryData);

      // Act
      await getCategoryDetails(req, res);

      // Assert
      expect(dataVaultService.getCategoryDetails).toHaveBeenCalledWith(BigInt(categoryId));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: categoryData
      });
    });

    it('should return 400 when invalid ID is provided', async () => {
      // Arrange
      req.params.categoryId = '0';

      // Act
      await getCategoryDetails(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: true,
        message: 'Invalid categoryId'
      });
    });

    it('should return 404 when category does not exist', async () => {
      // Arrange
      req.params.categoryId = '999';
      dataVaultService.getCategoryDetails.mockRejectedValue({ message: 'CategoryNotExists' });

      // Act
      await getCategoryDetails(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Category not found' });
    });
  });

  describe('checkPermission', () => {
    it('should return permission status when valid parameters are provided', async () => {
      // Arrange
      const categoryId = '1';
      const buyer = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const hasAccess = true;
      
      req.query = { categoryId, buyer };
      dataVaultService.checkPermission.mockResolvedValue(hasAccess);

      // Act
      await checkPermission(req, res);

      // Assert
      expect(dataVaultService.checkPermission).toHaveBeenCalledWith(BigInt(categoryId), buyer);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        categoryId,
        buyer,
        hasAccess
      });
    });

    it('should return 400 when parameters are missing', async () => {
      // Arrange
      req.query = {};

      // Act
      await checkPermission(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Invalid categoryId' });
    });
  });
});