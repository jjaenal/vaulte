jest.mock('../../src/services/dataMarketplaceWriteService');
const request = require('supertest');
const app = require('../../src/index');
const dataMarketplaceWriteService = require('../../src/services/dataMarketplaceWriteService');

describe('DataMarketplace Write Controller (Endpoints)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/marketplace/request', () => {
    it('should create access request with valid payload', async () => {
      const payload = { categoryId: 1, durationDays: 7, buyerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' };
      const result = { requestId: 123, hash: '0xabc', status: 'success' };

      dataMarketplaceWriteService.requestAccess.mockResolvedValue(result);

      const res = await request(app)
        .post('/api/marketplace/request')
        .send(payload)
        .expect(201);

      expect(dataMarketplaceWriteService.requestAccess).toHaveBeenCalledWith(
        payload.buyerAddress,
        Number(payload.categoryId),
        Number(payload.durationDays)
      );
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(result);
    });

    it('should return 400 when missing fields', async () => {
      const res = await request(app)
        .post('/api/marketplace/request')
        .send({ categoryId: 1 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should map CategoryNotActive error to 400', async () => {
      dataMarketplaceWriteService.requestAccess.mockRejectedValue(new Error('CategoryNotActive'));

      const res = await request(app)
        .post('/api/marketplace/request')
        .send({ categoryId: 1, durationDays: 7 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Category is not active');
    });

    it('should map ZeroDuration error to 400', async () => {
      dataMarketplaceWriteService.requestAccess.mockRejectedValue(new Error('ZeroDuration'));

      const res = await request(app)
        .post('/api/marketplace/request')
        .send({ categoryId: 1, durationDays: 7 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Duration must be greater than zero');
    });
  });

  describe('POST /api/marketplace/approve/:requestId', () => {
    it('should approve request with valid data', async () => {
      const result = { hash: '0xdef', status: 'success' };
      dataMarketplaceWriteService.approveRequest.mockResolvedValue(result);

      const res = await request(app)
        .post('/api/marketplace/approve/55')
        .send({ ownerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })
        .expect(200);

      expect(dataMarketplaceWriteService.approveRequest).toHaveBeenCalledWith(55, '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(result);
    });

    it('should map NotRequestOwner to 403', async () => {
      dataMarketplaceWriteService.approveRequest.mockRejectedValue(new Error('NotRequestOwner'));

      const res = await request(app)
        .post('/api/marketplace/approve/55')
        .send({ ownerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Only the data owner can approve this request');
    });

    it('should map InvalidRequestStatus to 400', async () => {
      dataMarketplaceWriteService.approveRequest.mockRejectedValue(new Error('InvalidRequestStatus'));

      const res = await request(app)
        .post('/api/marketplace/approve/55')
        .send({ ownerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Request cannot be approved in its current status');
    });
  });

  describe('POST /api/marketplace/reject/:requestId', () => {
    it('should reject request with valid data', async () => {
      const result = { hash: '0xghi', status: 'success' };
      dataMarketplaceWriteService.rejectRequest.mockResolvedValue(result);

      const res = await request(app)
        .post('/api/marketplace/reject/77')
        .send({ ownerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })
        .expect(200);

      expect(dataMarketplaceWriteService.rejectRequest).toHaveBeenCalledWith(77, '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(result);
    });

    it('should map NotRequestOwner to 403', async () => {
      dataMarketplaceWriteService.rejectRequest.mockRejectedValue(new Error('NotRequestOwner'));

      const res = await request(app)
        .post('/api/marketplace/reject/77')
        .send({ ownerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Only the data owner can reject this request');
    });

    it('should map InvalidRequestStatus to 400', async () => {
      dataMarketplaceWriteService.rejectRequest.mockRejectedValue(new Error('InvalidRequestStatus'));

      const res = await request(app)
        .post('/api/marketplace/reject/77')
        .send({ ownerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Request cannot be rejected in its current status');
    });
  });

  describe('POST /api/marketplace/cancel/:requestId', () => {
    it('should cancel request with valid data', async () => {
      const result = { hash: '0xjkl', status: 'success' };
      dataMarketplaceWriteService.cancelRequest.mockResolvedValue(result);

      const res = await request(app)
        .post('/api/marketplace/cancel/88')
        .send({ buyerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })
        .expect(200);

      expect(dataMarketplaceWriteService.cancelRequest).toHaveBeenCalledWith(88, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(result);
    });

    it('should map NotRequestBuyer to 403', async () => {
      dataMarketplaceWriteService.cancelRequest.mockRejectedValue(new Error('NotRequestBuyer'));

      const res = await request(app)
        .post('/api/marketplace/cancel/88')
        .send({ buyerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Only the buyer can cancel this request');
    });

    it('should map InvalidRequestStatus to 400', async () => {
      dataMarketplaceWriteService.cancelRequest.mockRejectedValue(new Error('InvalidRequestStatus'));

      const res = await request(app)
        .post('/api/marketplace/cancel/88')
        .send({ buyerAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Request cannot be cancelled in its current status');
    });
  });
});