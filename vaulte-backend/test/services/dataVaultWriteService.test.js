const dataVaultWriteService = require('../../src/services/dataVaultWriteService');

// Mock blockchain utils used by the write service
jest.mock('../../src/utils/blockchain', () => {
  const writeContract = jest.fn(async () => '0xhash');
  const simulateContract = jest.fn(async ({ functionName }) => {
    if (functionName === 'registerDataCategory') {
      return { request: { to: '0xVault', data: '0xregister' } };
    }
    if (functionName === 'deactivateDataCategory') {
      return { request: { to: '0xVault', data: '0xdeactivate' } };
    }
    if (functionName === 'grantPermission') {
      return { request: { to: '0xVault', data: '0xgrant' } };
    }
    if (functionName === 'revokePermission') {
      return { request: { to: '0xVault', data: '0xrevoke' }, result: 1000n };
    }
    if (functionName === 'updateDataCategory') {
      return { request: { to: '0xVault', data: '0xupdate' } };
    }
    throw new Error(`Unknown functionName: ${functionName}`);
  });

  const decodeEventLog = jest.fn(({ topics }) => {
    if (topics && topics[0] === '0xDataCategoryRegistered') {
      return { eventName: 'DataCategoryRegistered', args: { categoryId: 42n } };
    }
    return { eventName: 'OtherEvent', args: {} };
  });

  const waitForTransactionReceipt = jest.fn(async ({ hash }) => {
    return {
      status: 'success',
      transactionHash: hash,
      logs: [
        { data: '0x', topics: ['0xDataCategoryRegistered'] },
      ],
    };
  });

  return {
    walletClient: { writeContract },
    publicClient: { simulateContract, waitForTransactionReceipt, decodeEventLog },
    account: { address: '0xDefaultAccount' },
    DATA_VAULT_ADDRESS: '0xVault',
    DataVaultABI: [{ name: 'dummy' }],
  };
});

const { publicClient } = require('../../src/utils/blockchain');

describe('DataVaultWriteService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerCategory', () => {
    it('returns hash, status, and decoded categoryId', async () => {
      const res = await dataVaultWriteService.registerCategory('Name', 1000000000000000n, '0x'.padEnd(66, 'a'));
      expect(res).toEqual({ hash: '0xhash', status: 'success', categoryId: 42 });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xVault',
        abi: expect.any(Array),
        functionName: 'registerDataCategory',
        args: ['Name', 1000000000000000n, expect.stringMatching(/^0x[0-9a-fA-F]{64}$/)],
        account: '0xDefaultAccount',
      });
    });

    it('returns null categoryId when event not found', async () => {
      publicClient.waitForTransactionReceipt.mockResolvedValueOnce({ status: 'success', logs: [{ data: '0x', topics: ['0xother'] }] });
      const res = await dataVaultWriteService.registerCategory('X', 1n, '0x'.padEnd(66, 'b'));
      expect(res.categoryId).toBeNull();
    });

    it('gracefully handles decodeEventLog throwing', async () => {
      publicClient.decodeEventLog.mockImplementationOnce(() => {
        throw new Error('decode fail');
      });
      const res = await dataVaultWriteService.registerCategory('Y', 1n, '0x'.padEnd(66, 'e'));
      expect(res.categoryId).toBeNull();
    });

    it('skips bad log and decodes next log successfully', async () => {
      publicClient.waitForTransactionReceipt.mockResolvedValueOnce({
        status: 'success',
        logs: [
          { data: '0x', topics: ['0xbad'] },
          { data: '0x', topics: ['0xDataCategoryRegistered'] },
        ],
      });
      publicClient.decodeEventLog
        .mockImplementationOnce(() => { throw new Error('bad log'); })
        .mockImplementationOnce(() => ({ eventName: 'DataCategoryRegistered', args: { categoryId: 42n } }));

      const res = await dataVaultWriteService.registerCategory('Z', 1n, '0x'.padEnd(66, 'f'));
      expect(res.categoryId).toBe(42);
    });

    it('throws when simulateContract fails', async () => {
      publicClient.simulateContract.mockRejectedValueOnce(new Error('RPC error'));
      await expect(
        dataVaultWriteService.registerCategory('Bad', 0n, '0x'.padEnd(66, 'c'))
      ).rejects.toThrow('RPC error');
    });
  });

  describe('deactivateCategory', () => {
    it('returns hash and status on success', async () => {
      const res = await dataVaultWriteService.deactivateCategory(2n);
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xVault',
        abi: expect.any(Array),
        functionName: 'deactivateDataCategory',
        args: [2n],
        account: '0xDefaultAccount',
      });
    });

    it('throws when waitForTransactionReceipt fails', async () => {
      publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('Wait fail'));
      await expect(
        dataVaultWriteService.deactivateCategory(3n)
      ).rejects.toThrow('Wait fail');
    });
  });

  describe('grantPermission', () => {
    it('returns hash and status on success', async () => {
      const res = await dataVaultWriteService.grantPermission(3n, '0xbuyer', 7);
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xVault',
        abi: expect.any(Array),
        functionName: 'grantPermission',
        args: [3n, '0xbuyer', 7],
        account: '0xDefaultAccount',
      });
    });

    it('throws when waitForTransactionReceipt fails', async () => {
      publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('Wait fail'));
      await expect(
        dataVaultWriteService.grantPermission(1n, '0xbuyer', 1)
      ).rejects.toThrow('Wait fail');
    });
  });

  describe('revokePermission', () => {
    it('returns hash, status, and refundAmount from simulation result', async () => {
      const res = await dataVaultWriteService.revokePermission(5n, '0xbuyer');
      expect(res).toEqual({ hash: '0xhash', status: 'success', refundAmount: 1000n });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xVault',
        abi: expect.any(Array),
        functionName: 'revokePermission',
        args: [5n, '0xbuyer'],
        account: '0xDefaultAccount',
      });
    });

    it('throws when simulateContract fails', async () => {
      publicClient.simulateContract.mockRejectedValueOnce(new Error('RPC fail'));
      await expect(
        dataVaultWriteService.revokePermission(5n, '0xbuyer')
      ).rejects.toThrow('RPC fail');
    });
  });

  describe('updateCategory', () => {
    it('returns hash and status on success', async () => {
      const res = await dataVaultWriteService.updateCategory(1n, 999n, '0x'.padEnd(66, 'd'));
      expect(res).toEqual({ hash: '0xhash', status: 'success' });
      expect(publicClient.simulateContract).toHaveBeenCalledWith({
        address: '0xVault',
        abi: expect.any(Array),
        functionName: 'updateDataCategory',
        args: [1n, 999n, expect.stringMatching(/^0x[0-9a-fA-F]{64}$/)],
        account: '0xDefaultAccount',
      });
    });

    it('throws when waitForTransactionReceipt fails', async () => {
      publicClient.waitForTransactionReceipt.mockRejectedValueOnce(new Error('Wait fail'));
      await expect(
        dataVaultWriteService.updateCategory(2n, 100n, '0x'.padEnd(66, 'a'))
      ).rejects.toThrow('Wait fail');
    });
  });
});