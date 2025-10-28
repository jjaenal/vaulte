jest.mock('viem', () => ({
  createPublicClient: jest.fn(),
  http: jest.fn()
}));
jest.mock('../../src/utils/wallet', () => ({
  walletClient: { writeContract: jest.fn() },
  account: { address: '0xDefaultAccount' }
}));

describe('utils/blockchain', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates public client with default RPC and chain when env missing', () => {
    delete process.env.RPC_URL;
    delete process.env.CHAIN_ID;
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    const { createPublicClient, http } = require('viem');
    createPublicClient.mockReturnValueOnce({ pub: true });
    http.mockImplementationOnce((url) => ({ url }));
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const bc = require('../../src/utils/blockchain');
    expect(createPublicClient).toHaveBeenCalledWith({
      transport: { url: 'http://localhost:8545' },
      chain: { id: 31337 }
    });
    expect(bc.publicClient).toEqual({ pub: true });
    expect(bc.DATA_VAULT_ADDRESS).toBeUndefined();
    expect(bc.DATA_MARKETPLACE_ADDRESS).toBeUndefined();
    expect(bc.PAYMENT_SPLITTER_ADDRESS).toBeUndefined();
    expect(bc.ACCESS_CONTROL_ADDRESS).toBeUndefined();
    consoleInfoSpy.mockRestore();
  });

  it('uses provided env RPC_URL, CHAIN_ID and addresses', () => {
    process.env.RPC_URL = 'http://example:1234';
    process.env.CHAIN_ID = '555';
    process.env.DATA_VAULT_ADDRESS = '0xVault';
    process.env.DATA_MARKETPLACE_ADDRESS = '0xMarket';
    process.env.PAYMENT_SPLITTER_ADDRESS = '0xSplitter';
    process.env.ACCESS_CONTROL_ADDRESS = '0xAccess';

    const { createPublicClient, http } = require('viem');
    createPublicClient.mockReturnValueOnce({ pub: 'env' });
    http.mockImplementationOnce((url) => ({ url }));

    const bc = require('../../src/utils/blockchain');
    expect(createPublicClient).toHaveBeenCalledWith({
      transport: { url: 'http://example:1234' },
      chain: { id: 555 }
    });
    expect(bc.publicClient).toEqual({ pub: 'env' });
    expect(bc.DATA_VAULT_ADDRESS).toBe('0xVault');
    expect(bc.DATA_MARKETPLACE_ADDRESS).toBe('0xMarket');
    expect(bc.PAYMENT_SPLITTER_ADDRESS).toBe('0xSplitter');
    expect(bc.ACCESS_CONTROL_ADDRESS).toBe('0xAccess');
  });
});