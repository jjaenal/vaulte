jest.mock('viem', () => ({
  createWalletClient: jest.fn(),
  http: jest.fn()
}));
jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn()
}));

describe('utils/wallet', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws when WALLET_PRIVATE_KEY is missing', () => {
    delete process.env.WALLET_PRIVATE_KEY;
    jest.doMock('dotenv', () => ({ config: jest.fn() }));
    expect(() => require('../../src/utils/wallet')).toThrow(
      'WALLET_PRIVATE_KEY is required in environment variables'
    );
  });

  it('throws when privateKeyToAccount fails', () => {
    process.env.WALLET_PRIVATE_KEY = 'invalid-key';
    const { privateKeyToAccount } = require('viem/accounts');
    privateKeyToAccount.mockImplementationOnce(() => {
      throw new Error('Invalid private key format');
    });
    
    expect(() => require('../../src/utils/wallet')).toThrow('Invalid private key format');
  });

  it('creates wallet client with provided private key and env', () => {
    process.env.WALLET_PRIVATE_KEY = '0xpriv';
    process.env.RPC_URL = 'http://node:8545';
    process.env.CHAIN_ID = '777';

    const { createWalletClient, http } = require('viem');
    const { privateKeyToAccount } = require('viem/accounts');
    createWalletClient.mockReturnValueOnce({ client: true });
    http.mockImplementationOnce((url) => ({ url }));
    privateKeyToAccount.mockReturnValueOnce({ address: '0xabc' });

    const wallet = require('../../src/utils/wallet');
    expect(privateKeyToAccount).toHaveBeenCalledWith('0xpriv');
    expect(createWalletClient).toHaveBeenCalledWith({
      account: { address: '0xabc' },
      transport: { url: 'http://node:8545' },
      chain: { id: 777 }
    });
    expect(wallet.account.address).toBe('0xabc');
    expect(wallet.walletClient).toEqual({ client: true });
  });
});