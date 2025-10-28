jest.mock('../../src/services/dataMarketplaceService');
const request = require('supertest');
const app = require('../../src/index');
const dataMarketplaceService = require('../../src/services/dataMarketplaceService');

describe('DataMarketplace Controller (Endpoints)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/marketplace/requests/buyer/:address', () => {
    it('should return request details for buyer', async () => {
      const address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const ids = [1, 2];
      const details = [
        {
          id: 1,
          buyer: address,
          categoryId: 10,
          seller: '0x1234567890123456789012345678901234567890',
          durationDays: 7,
          totalAmount: '1000000000000000',
          status: 'Requested'
        },
        {
          id: 2,
          buyer: address,
          categoryId: 11,
          seller: '0x1234567890123456789012345678901234567890',
          durationDays: 3,
          totalAmount: '300000000000000',
          status: 'Approved'
        }
      ];

      dataMarketplaceService.getBuyerRequests.mockResolvedValue(ids);
      dataMarketplaceService.getRequestDetails
        .mockResolvedValueOnce(details[0])
        .mockResolvedValueOnce(details[1]);

      const res = await request(app)
        .get(`/api/marketplace/requests/buyer/${address}`)
        .expect(200);

      expect(dataMarketplaceService.getBuyerRequests).toHaveBeenCalledWith(address);
      expect(dataMarketplaceService.getRequestDetails).toHaveBeenCalledTimes(2);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(details);
    });
  });

  describe('GET /api/marketplace/requests/owner/:address', () => {
    it('should return request details for owner', async () => {
      const address = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
      const ids = [5n];
      const detail = {
        id: 5,
        buyer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        categoryId: 42,
        seller: address,
        durationDays: 30,
        totalAmount: '5000000000000000',
        status: 'Requested'
      };

      dataMarketplaceService.getOwnerRequests.mockResolvedValue(ids);
      dataMarketplaceService.getRequestDetails.mockResolvedValue(detail);

      const res = await request(app)
        .get(`/api/marketplace/requests/owner/${address}`)
        .expect(200);

      expect(dataMarketplaceService.getOwnerRequests).toHaveBeenCalledWith(address);
      expect(dataMarketplaceService.getRequestDetails).toHaveBeenCalledWith(ids[0]);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([detail]);
    });
  });

  describe('GET /api/marketplace/requests/:requestId', () => {
    it('should return request detail by ID', async () => {
      const requestId = 9;
      const detail = {
        id: requestId,
        buyer: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        categoryId: 1,
        seller: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        durationDays: 14,
        totalAmount: '1400000000000000',
        status: 'Approved'
      };

      dataMarketplaceService.getRequestDetails.mockResolvedValue(detail);

      const res = await request(app)
        .get(`/api/marketplace/requests/${requestId}`)
        .expect(200);

      expect(dataMarketplaceService.getRequestDetails).toHaveBeenCalledWith(String(requestId));
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(detail);
    });
  });

  describe('POST /api/marketplace/quote', () => {
    it('should calculate quote with valid payload', async () => {
      const quote = {
        totalAmount: '1000000000000000',
        platformFee: '100000000000000',
        ownerAmount: '900000000000000'
      };

      dataMarketplaceService.quote.mockResolvedValue(quote);

      const res = await request(app)
        .post('/api/marketplace/quote')
        .send({ categoryId: 1, durationDays: 10 })
        .expect(200);

      expect(dataMarketplaceService.quote).toHaveBeenCalledWith(1, 10);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(quote);
    });

    it('should return 400 when missing fields', async () => {
      const res = await request(app)
        .post('/api/marketplace/quote')
        .send({ categoryId: 1 })
        .expect(400);

      expect(res.body.error).toBe(true);
    });
  });
});