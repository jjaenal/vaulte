const dataMarketplaceWriteService = require('../../src/services/dataMarketplaceWriteService');

// Mock blockchain utils used by the write service
jest.mock('../../src/utils/blockchain', () => {
  const writeContract = jest.fn(async () => '0xhash');
  const simulateContract = jest.fn(async ({ functionName }) => {
    if (functionName === 'requestAccess') {
      return { request: { to: '0xMarket', data: '0xreq' } };
    }
    if (functionName === 'approveRequest') {
      return { request: { to: '0xMarket', data: '0xapprove' } };
    }
    if (functionName === 'rejectRequest') {
      return { request: { to: '0xMarket', data: '0xreject' } };
    }
    if (functionName === 'cancelRequest') {
      return { request: { to: '0xMarket', data: '0xcancel' } };
    }
    throw new Error(`Unknown functionName: ${functionName}`);
  });

  const decodeEventLog = jest.fn(({ topics }) => {
    // Return RequestCreated for a specific topic marker
    if (topics && topics[0] === '0xrequestCreated') {
      return { eventName: 'RequestCreated', args: { requestId: 123n } };
    }
    return { eventName: 'OtherEvent', args: {} };
  });

  const waitForTransactionReceipt = jest.fn(async ({ hash }) => {
    return {
      status: 'success',
      transactionHash: hash,
      logs: [
        { data: '0x', topics: ['0xrequestCreated'] },
      ],
    };
  });

  return {
    walletClient: { writeContract },
    publicClient: { simulateContract, waitForTransactionReceipt, decodeEventLog },
    account: { address: '0xDefaultAccount' },
    DATA_MARKETPLACE_ADDRESS: '0xMarket',
    DataMarketplaceABI: [{ name: 'dummy' }],
  };
});

const { publicClient } = require('../../src/utils/blockchain');

describe('DataMarketplaceWriteService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestAccess', () => {
    it('returns requestId, hash, and status on success', async () => {
      const result = await dataMarketplaceWriteService.requestAccess(
        '0xbuyer',
        1,
        7
      );
      expect(result).toEqual({ requestId: 123, hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'requestAccess',
        args: [1, 7],
        account: '0xbuyer',
      });
    });

    it('uses default account when buyerAddress is not provided', async () => {
      const result = await dataMarketplaceWriteService.requestAccess(
        undefined,
        2,
        14
      );
      expect(result.hash).toBe('0xhash');
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'requestAccess',
        args: [2, 14],
        account: expect.any(String),
      });
    });

    it('sets requestId to null when event not found', async () => {
      // Change receipt logs to non-matching event
      publicClient.waitForTransactionReceipt.mockResolvedValueOnce({
        status: 'success',
        logs: [{ data: '0x', topics: ['0xother'] }],
      });
      const result = await dataMarketplaceWriteService.requestAccess('0xbuyer', 3, 3);
      expect(result.requestId).toBeNull();
    });

    it('throws when simulateContract fails', async () => {
      publicClient.simulateContract.mockRejectedValueOnce(new Error('RPC error'));
      await expect(
        dataMarketplaceWriteService.requestAccess('0xbuyer', 4, 1)
      ).rejects.toThrow('RPC error');
    });

    it('gracefully handles decodeEventLog throwing', async () => {
      publicClient.decodeEventLog.mockImplementationOnce(() => {
        throw new Error('decode fail');
      });
      const result = await dataMarketplaceWriteService.requestAccess('0xbuyer', 9, 1);
      expect(result.requestId).toBeNull();
    });

    it('returns null requestId when receipt has no logs', async () => {
      publicClient.waitForTransactionReceipt.mockResolvedValueOnce({ status: 'success', logs: [] });
      const result = await dataMarketplaceWriteService.requestAccess('0xbuyer', 10, 1);
      expect(result.requestId).toBeNull();
    });

    it('throws when decoding the found RequestCreated log fails', async () => {
      // First decode (inside find) returns RequestCreated, second decode throws
      publicClient.decodeEventLog
        .mockImplementationOnce(() => ({ eventName: 'RequestCreated', args: { requestId: 999n } }))
        .mockImplementationOnce(() => { throw new Error('decode second fail'); });
      await expect(
        dataMarketplaceWriteService.requestAccess('0xbuyer', 11, 1)
      ).rejects.toThrow('decode second fail');
    });

    it('skips bad logs then decodes a later RequestCreated successfully', async () => {
      // Receipt with multiple logs, first causes decode error, second is non-matching, third is RequestCreated
      publicClient.waitForTransactionReceipt.mockResolvedValueOnce({
        status: 'success',
        logs: [
          { data: '0x', topics: ['0xbad'] },
          { data: '0x', topics: ['0xother'] },
          { data: '0x', topics: ['0xrequestCreated'] },
        ],
      });
      publicClient.decodeEventLog
        .mockImplementationOnce(() => { throw new Error('bad log'); })
        .mockImplementationOnce(() => ({ eventName: 'OtherEvent', args: {} }))
        .mockImplementationOnce(() => ({ eventName: 'RequestCreated', args: { requestId: 321n } }))
        .mockImplementationOnce(() => ({ eventName: 'RequestCreated', args: { requestId: 321n } }));

      const result = await dataMarketplaceWriteService.requestAccess('0xbuyer', 12, 1);
      expect(result).toEqual({ requestId: 321, hash: '0xhash', status: 'success' });
    });
  });

  describe('approveRequest', () => {
    it('returns hash and status on success', async () => {
      const res = await dataMarketplaceWriteService.approveRequest(55, '0xowner');
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'approveRequest',
        args: [55],
        account: '0xowner',
      });
    });

    it('throws when write fails', async () => {
      // Simulate failure by making simulateContract succeed but waitForTransactionReceipt reject
      publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('Tx failed'));
      await expect(
        dataMarketplaceWriteService.approveRequest(10, '0xowner')
      ).rejects.toThrow('Tx failed');
    });

    it('uses default account when ownerAddress is not provided', async () => {
      const res = await dataMarketplaceWriteService.approveRequest(99);
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'approveRequest',
        args: [99],
        account: '0xDefaultAccount',
      });
    });
  });

  describe('rejectRequest', () => {
    it('returns hash and status on success', async () => {
      const res = await dataMarketplaceWriteService.rejectRequest(77, '0xowner');
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'rejectRequest',
        args: [77],
        account: '0xowner',
      });
    });

    it('throws when simulateContract fails', async () => {
      publicClient.simulateContract.mockRejectedValueOnce(new Error('RPC fail'));
      await expect(
        dataMarketplaceWriteService.rejectRequest(1, '0xowner')
      ).rejects.toThrow('RPC fail');
    });

    it('uses default account when ownerAddress is not provided', async () => {
      const res = await dataMarketplaceWriteService.rejectRequest(101);
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'rejectRequest',
        args: [101],
        account: '0xDefaultAccount',
      });
    });
  });

  describe('cancelRequest', () => {
    it('returns hash and status on success', async () => {
      const res = await dataMarketplaceWriteService.cancelRequest(88, '0xbuyer');
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'cancelRequest',
        args: [88],
        account: '0xbuyer',
      });
    });

    it('throws when waitForTransactionReceipt fails', async () => {
      publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('Wait fail'));
      await expect(
        dataMarketplaceWriteService.cancelRequest(2, '0xbuyer')
      ).rejects.toThrow('Wait fail');
    });

    it('uses default account when buyerAddress is not provided', async () => {
      const res = await dataMarketplaceWriteService.cancelRequest(77);
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xMarket',
        abi: expect.any(Array),
        functionName: 'cancelRequest',
        args: [77],
        account: '0xDefaultAccount',
      });
    });

    it('throws when writeContract fails', async () => {
      const { walletClient } = require('../../src/utils/blockchain');
      walletClient.writeContract.mockRejectedValueOnce(new Error('Write fail'));
      await expect(
        dataMarketplaceWriteService.cancelRequest(3, '0xbuyer')
      ).rejects.toThrow('Write fail');
    });
  });
});