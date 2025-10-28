const dataMarketplaceService = require('../../src/services/dataMarketplaceService');

// Mock blockchain utils used by the service
jest.mock('../../src/utils/blockchain', () => {
  const mockReadContract = jest.fn(async ({ functionName, args }) => {
    if (functionName === 'totalRequests') {
      return 3n;
    }
    if (functionName === 'requestsById') {
      const id = args[0];
      // Tuple format: [buyer, seller, categoryId, durationDays, amount, status]
      if (id === 1n || id === 1) {
        return ['0xbuyer', '0xowner1', 11n, 7n, 1000n, 0n];
      }
      if (id === 2n || id === 2) {
        return ['0xother', '0xowner2', 22n, 14n, 2000n, 1n];
      }
      if (id === 3n || id === 3) {
        return ['0xbuyer', '0xowner3', 33n, 21n, 3000n, 2n];
      }
      // Default shape to avoid crashes
      return ['0xzero', '0xzero', 0n, 0n, 0n, 0n];
    }
    if (functionName === 'quote') {
      return [1000n, 100n, 900n];
    }
    throw new Error(`Unknown functionName: ${functionName}`);
  });

  return {
    publicClient: { readContract: mockReadContract },
    contractAddresses: { dataMarketplace: '0xdata_marketplace' },
    contractABIs: { dataMarketplace: [{ name: 'dummy' }] },
  };
});

const { publicClient } = require('../../src/utils/blockchain');

describe('DataMarketplaceService (unit)', () => {
  test('getBuyerRequests filters by buyer address', async () => {
    const result = await dataMarketplaceService.getBuyerRequests('0xbuyer');
    expect(result).toEqual([1n, 3n]);
  });

  test('getOwnerRequests filters by owner/seller address', async () => {
    const result = await dataMarketplaceService.getOwnerRequests('0xowner2');
    expect(result).toEqual([2n]);
  });

  test('getBuyerRequests returns empty when totalRequests is zero', async () => {
    publicClient.readContract.mockResolvedValueOnce(0n);
    const result = await dataMarketplaceService.getBuyerRequests('0xbuyer');
    expect(result).toEqual([]);
  });

  test('getBuyerRequests throws when totalRequests call fails', async () => {
    publicClient.readContract.mockRejectedValueOnce(new Error('RPC totalRequests'));
    await expect(dataMarketplaceService.getBuyerRequests('0xbuyer')).rejects.toThrow('RPC totalRequests');
  });

  test('getOwnerRequests throws when requestsById fails', async () => {
    publicClient.readContract
      .mockResolvedValueOnce(2n) // totalRequests
      .mockRejectedValueOnce(new Error('RPC requestsById')); // first requestsById
    await expect(dataMarketplaceService.getOwnerRequests('0xowner')).rejects.toThrow('RPC requestsById');
  });

  test('quote returns total/platform/owner amounts', async () => {
    const result = await dataMarketplaceService.quote(22n, 14);
    expect(result).toEqual({ totalAmount: 1000n, platformFee: 100n, ownerAmount: 900n });
  });

  test('_mapRequestStatus maps codes correctly', () => {
    expect(dataMarketplaceService._mapRequestStatus(0)).toBe('Requested');
    expect(dataMarketplaceService._mapRequestStatus(4)).toBe('Expired');
    expect(dataMarketplaceService._mapRequestStatus(10)).toBe('Unknown');
  });

  test('getRequestDetails maps tuple to object fields', async () => {
    const result = await dataMarketplaceService.getRequestDetails(2n);
    // Expect correct mapping based on tuple: [buyer, seller, categoryId, durationDays, amount, status]
    expect(result).toEqual({
      id: 2n,
      buyer: '0xother',
      seller: '0xowner2',
      categoryId: 22n,
      durationDays: 14n,
      totalAmount: 2000n,
      status: 'Approved',
    });
  });

  test('getRequestDetails throws when readContract fails', async () => {
    publicClient.readContract.mockRejectedValueOnce(new Error('RPC details'));
    await expect(dataMarketplaceService.getRequestDetails(1n)).rejects.toThrow('RPC details');
  });

  test('quote throws when readContract fails', async () => {
    publicClient.readContract.mockRejectedValueOnce(new Error('RPC quote'));
    await expect(dataMarketplaceService.quote(1n, 7)).rejects.toThrow('RPC quote');
  });
});