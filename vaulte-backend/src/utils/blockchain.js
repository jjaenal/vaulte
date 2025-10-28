const { createPublicClient, http } = require('viem');
require('dotenv').config();

// Contract addresses from environment variables
const DATA_VAULT_ADDRESS = process.env.DATA_VAULT_ADDRESS;
const DATA_MARKETPLACE_ADDRESS = process.env.DATA_MARKETPLACE_ADDRESS;
const PAYMENT_SPLITTER_ADDRESS = process.env.PAYMENT_SPLITTER_ADDRESS;
const ACCESS_CONTROL_ADDRESS = process.env.ACCESS_CONTROL_ADDRESS;

// Import ABIs
const DataVaultABI = require('../../abis/DataVault.json').abi;
const DataMarketplaceABI = require('../../abis/DataMarketplace.json').abi;
const PaymentSplitterABI = require('../../abis/PaymentSplitter.json').abi;
const AccessControlABI = require('../../abis/AccessControl.json').abi;

// Create public client for read operations
const publicClient = createPublicClient({
  transport: http(process.env.RPC_URL || 'http://localhost:8545'),
  chain: { id: parseInt(process.env.CHAIN_ID || '31337') }
});

// Import wallet client for write operations
const { walletClient, account } = require('./wallet');

console.info(`Connected to blockchain: ${process.env.RPC_URL || 'http://localhost:8545'}`);
console.info(`Using wallet address: ${account.address}`);

module.exports = {
  publicClient,
  walletClient,
  account,
  DATA_VAULT_ADDRESS,
  DATA_MARKETPLACE_ADDRESS,
  PAYMENT_SPLITTER_ADDRESS,
  ACCESS_CONTROL_ADDRESS,
  DataVaultABI,
  DataMarketplaceABI,
  PaymentSplitterABI,
  AccessControlABI
};