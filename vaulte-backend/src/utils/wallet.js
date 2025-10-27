// Wallet utility for signing transactions
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();

// Get private key from environment variables
const privateKey = process.env.WALLET_PRIVATE_KEY;
if (!privateKey) {
  throw new Error('WALLET_PRIVATE_KEY is required in environment variables');
}

// Create account from private key
const account = privateKeyToAccount(privateKey);

// Create wallet client
const walletClient = createWalletClient({
  account,
  transport: http(process.env.RPC_URL || 'http://localhost:8545'),
  chain: { id: parseInt(process.env.CHAIN_ID || '31337') }
});

module.exports = {
  walletClient,
  account
};