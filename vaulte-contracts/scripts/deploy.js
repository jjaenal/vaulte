const hre = require("hardhat");

async function main() {
  const network = hre.network;
  console.log("Deploying Vaulté contracts to", network.name);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Get platform wallet for PaymentSplitter
  const platformWallet = process.env.PLATFORM_WALLET || deployer.address;
  console.log("Platform wallet:", platformWallet);
  
  // Deploy PaymentSplitter first
  console.log("\n1. Deploying PaymentSplitter...");
  const PaymentSplitter = await hre.ethers.getContractFactory("PaymentSplitter");
  const paymentSplitter = await PaymentSplitter.deploy(platformWallet);
  await paymentSplitter.waitForDeployment();
  const paymentSplitterAddress = await paymentSplitter.getAddress();
  console.log("PaymentSplitter deployed to:", paymentSplitterAddress);
  
  // Deploy DataVault
  console.log("\n2. Deploying DataVault...");
  const DataVault = await hre.ethers.getContractFactory("DataVault");
  const dataVault = await DataVault.deploy();
  await dataVault.waitForDeployment();
  const dataVaultAddress = await dataVault.getAddress();
  console.log("DataVault deployed to:", dataVaultAddress);
  
  // Deploy DataMarketplace
  console.log("\n3. Deploying DataMarketplace...");
  const DataMarketplace = await hre.ethers.getContractFactory("DataMarketplace");
  const marketplace = await DataMarketplace.deploy(dataVaultAddress, paymentSplitterAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("DataMarketplace deployed to:", marketplaceAddress);
  
  // Set marketplace in DataVault
  console.log("\n4. Setting marketplace in DataVault...");
  const setMarketplaceTx = await dataVault.setMarketplace(marketplaceAddress);
  await setMarketplaceTx.wait();
  console.log("Marketplace set in DataVault");
  
  // Deploy AccessControl (if needed)
  console.log("\n5. Deploying AccessControl...");
  const AccessControl = await hre.ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy(dataVaultAddress);
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControl deployed to:", accessControlAddress);
  
  // Verify contracts if on testnet or mainnet
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting for block confirmations before verification...");
    // Wait for 5 block confirmations
    await paymentSplitter.deploymentTransaction().wait(5);
    await dataVault.deploymentTransaction().wait(5);
    await marketplace.deploymentTransaction().wait(5);
    await accessControl.deploymentTransaction().wait(5);
    
    console.log("\nVerifying contracts on Etherscan...");
    
    try {
      console.log("Verifying PaymentSplitter...");
      await hre.run("verify:verify", {
        address: paymentSplitterAddress,
        constructorArguments: [platformWallet],
      });
      console.log("PaymentSplitter verified ✅");
    } catch (error) {
      console.error("Error verifying PaymentSplitter:", error.message);
    }
    
    try {
      console.log("Verifying DataVault...");
      await hre.run("verify:verify", {
        address: dataVaultAddress,
        constructorArguments: [],
      });
      console.log("DataVault verified ✅");
    } catch (error) {
      console.error("Error verifying DataVault:", error.message);
    }
    
    try {
      console.log("Verifying DataMarketplace...");
      await hre.run("verify:verify", {
        address: marketplaceAddress,
        constructorArguments: [dataVaultAddress, paymentSplitterAddress],
      });
      console.log("DataMarketplace verified ✅");
    } catch (error) {
      console.error("Error verifying DataMarketplace:", error.message);
    }
    
    try {
      console.log("Verifying AccessControl...");
      await hre.run("verify:verify", {
        address: accessControlAddress,
        constructorArguments: [dataVaultAddress],
      });
      console.log("AccessControl verified ✅");
    } catch (error) {
      console.error("Error verifying AccessControl:", error.message);
    }
  }
  
  // Log all deployed contract addresses
  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("PaymentSplitter:", paymentSplitterAddress);
  console.log("DataVault:", dataVaultAddress);
  console.log("DataMarketplace:", marketplaceAddress);
  console.log("AccessControl:", accessControlAddress);
  console.log("=========================");
  
  // Save deployment info to a file
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    platformWallet: platformWallet,
    contracts: {
      PaymentSplitter: paymentSplitterAddress,
      DataVault: dataVaultAddress,
      DataMarketplace: marketplaceAddress,
      AccessControl: accessControlAddress
    },
    timestamp: new Date().toISOString()
  };
  
  const deploymentPath = `./deployments/${network.name}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to ${deploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});