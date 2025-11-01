const { ethers } = require("hardhat");

async function main() {
  console.log("Seeding data untuk testing...");
  
  // Get contract factories
  const DataVault = await ethers.getContractFactory("DataVault");
  const DataMarketplace = await ethers.getContractFactory("DataMarketplace");
  
  // Get deployed contracts
  const dataVault = await DataVault.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  const dataMarketplace = await DataMarketplace.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
  
  // Get signers
  const [owner, buyer] = await ethers.getSigners();
  
  console.log("Owner address:", owner.address);
  console.log("Buyer address:", buyer.address);
  
  // Register data categories
  console.log("Registering data categories...");
  
  const tx1 = await dataVault.registerDataCategory(
    "Fitness Data", 
    ethers.parseEther("0.01"), 
    ethers.encodeBytes32String("fitness-data-hash")
  );
  await tx1.wait();
  console.log("Registered Fitness Data category");
  
  const tx2 = await dataVault.registerDataCategory(
    "Health Records", 
    ethers.parseEther("0.05"), 
    ethers.encodeBytes32String("health-records-hash")
  );
  await tx2.wait();
  console.log("Registered Health Records category");
  
  // Create data request from buyer
  console.log("Creating data request...");
  const requestDays = 7;
  const categoryId = 1; // Fitness Data
  
  // Calculate payment amount
  const category = await dataVault.getDataCategory(categoryId);
  const paymentAmount = category.pricePerDay * BigInt(requestDays);
  
  console.log(`Creating request for ${requestDays} days access to category ${categoryId}`);
  console.log(`Payment amount: ${ethers.formatEther(paymentAmount)} ETH`);
  
  // Switch to buyer account
  const buyerTx = await dataMarketplace.connect(buyer).requestDataAccess(
    owner.address,
    categoryId,
    requestDays,
    { value: paymentAmount }
  );
  await buyerTx.wait();
  
  console.log("Data request created successfully!");
  console.log("Seeding completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
