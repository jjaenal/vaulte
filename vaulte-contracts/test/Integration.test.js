const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Integration Tests - Full Flow", function () {
  let owner, seller, buyer, platform;
  let dataVault, marketplace, paymentSplitter;
  let categoryId, requestId;

  beforeEach(async function () {
    [owner, seller, buyer, platform] = await ethers.getSigners();

    // Deploy PaymentSplitter
    const PaymentSplitter = await ethers.getContractFactory("PaymentSplitter", owner);
    paymentSplitter = await PaymentSplitter.deploy(platform.address);
    await paymentSplitter.waitForDeployment();

    // Deploy DataVault
    const DataVault = await ethers.getContractFactory("DataVault", owner);
    dataVault = await DataVault.deploy();
    await dataVault.waitForDeployment();

    // Deploy DataMarketplace
    const DataMarketplace = await ethers.getContractFactory("DataMarketplace", owner);
    marketplace = await DataMarketplace.deploy(
      await dataVault.getAddress(),
      await paymentSplitter.getAddress()
    );
    await marketplace.waitForDeployment();

    // Set marketplace in DataVault
    await dataVault.setMarketplace(await marketplace.getAddress());

    // Seller registers a data category
    const tx = await dataVault.connect(seller).registerDataCategory(
      "Fitness Data",
      ethers.parseEther("0.1"), // 0.1 ETH per day
      ethers.keccak256(ethers.toUtf8Bytes("fitness-data-hash"))
    );
    const receipt = await tx.wait();
    categoryId = receipt.logs[0].args[1]; // Get categoryId from event
  });

  describe("Complete marketplace flow", function () {
    it("should complete full flow: request → approve → permission granted", async function () {
      const durationDays = 7;
      const totalCost = ethers.parseEther("0.7"); // 0.1 ETH * 7 days

      // Step 1: Buyer requests access
      const requestTx = await marketplace.connect(buyer).requestAccess(
        categoryId,
        durationDays,
        { value: totalCost }
      );
      const requestReceipt = await requestTx.wait();
      const event = requestReceipt.logs.find(log => 
        log.fragment && log.fragment.name === 'DataAccessRequested'
      );
      requestId = event.args[0]; // Get requestId from event

      // Verify request was created
      const request = await marketplace.requestsById(requestId);
      expect(request.buyer).to.equal(buyer.address);
      expect(request.seller).to.equal(seller.address);
      expect(request.categoryId).to.equal(categoryId);
      expect(request.status).to.equal(0); // Pending

      // Step 2: Seller approves request
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const platformBalanceBefore = await ethers.provider.getBalance(platform.address);

      await marketplace.connect(owner).approveRequest(requestId);

      // Verify request status updated
      const updatedRequest = await marketplace.requestsById(requestId);
      expect(updatedRequest.status).to.equal(1); // Approved

      // Step 3: Verify permission was granted in DataVault
      const hasPermission = await dataVault.checkPermission(categoryId, buyer.address);
      expect(hasPermission).to.be.true;

      // Step 4: Verify payment was split correctly
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const platformBalanceAfter = await ethers.provider.getBalance(platform.address);

      const platformFee = totalCost * 10n / 100n; // 10% platform fee
      const sellerAmount = totalCost - platformFee;

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(platformFee);
    });

    it("should handle rejection flow correctly", async function () {
      const durationDays = 5;
      const totalCost = ethers.parseEther("0.5");

      // Buyer requests access
      const requestTx = await marketplace.connect(buyer).requestAccess(
        categoryId,
        durationDays,
        { value: totalCost }
      );
      const requestReceipt = await requestTx.wait();
      const event = requestReceipt.logs.find(log => 
        log.fragment && log.fragment.name === 'DataAccessRequested'
      );
      requestId = event.args[0];

      // Record buyer balance before rejection
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      // Seller rejects request
      await marketplace.connect(owner).rejectRequest(requestId);

      // Verify request status
      const request = await marketplace.requestsById(requestId);
      expect(request.status).to.equal(2); // Rejected

      // Verify buyer got full refund
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      expect(buyerBalanceAfter - buyerBalanceBefore).to.equal(totalCost);

      // Verify no permission was granted
      const hasPermission = await dataVault.checkPermission(categoryId, buyer.address);
      expect(hasPermission).to.be.false;
    });

    it("should handle cancellation flow correctly", async function () {
      const durationDays = 3;
      const totalCost = ethers.parseEther("0.3");

      // Buyer requests access
      const requestTx = await marketplace.connect(buyer).requestAccess(
        categoryId,
        durationDays,
        { value: totalCost }
      );
      const requestReceipt = await requestTx.wait();
      const event = requestReceipt.logs.find(log => 
        log.fragment && log.fragment.name === 'DataAccessRequested'
      );
      requestId = event.args[0];

      // Record buyer balance before cancellation
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      // Buyer cancels request
      const cancelTx = await marketplace.connect(buyer).cancelRequest(requestId);
      const cancelReceipt = await cancelTx.wait();
      const gasPrice = cancelReceipt.gasPrice ?? cancelReceipt.effectiveGasPrice ?? 0n;
      const gasUsed = cancelReceipt.gasUsed * gasPrice;

      // Verify request status
      const request = await marketplace.requestsById(requestId);
      expect(request.status).to.equal(3); // Cancelled

      // Verify buyer got refund (minus gas costs)
      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const expectedBalance = buyerBalanceBefore + totalCost - gasUsed;
      const tolerance = ethers.parseEther("0.001");
      const diff = buyerBalanceAfter > expectedBalance
        ? buyerBalanceAfter - expectedBalance
        : expectedBalance - buyerBalanceAfter;
      expect(diff <= tolerance).to.equal(true);
    });

    it("should prevent double approval", async function () {
      const durationDays = 1;
      const totalCost = ethers.parseEther("0.1");

      // Create and approve request
      const requestTx = await marketplace.connect(buyer).requestAccess(
        categoryId,
        durationDays,
        { value: totalCost }
      );
      const requestReceipt = await requestTx.wait();
      const event = requestReceipt.logs.find(log => 
        log.fragment && log.fragment.name === 'DataAccessRequested'
      );
      requestId = event.args[0];

      await marketplace.connect(owner).approveRequest(requestId);

      // Try to approve again - should fail
      await expect(marketplace.connect(owner).approveRequest(requestId))
        .to.be.revertedWith("not requested");
    });

    it("should calculate quote correctly", async function () {
      const durationDays = 10;
      const expectedCost = ethers.parseEther("1.0"); // 0.1 ETH * 10 days

      const [total, platformFee, ownerAmount] = await marketplace.quote(categoryId, durationDays);
      expect(total).to.equal(expectedCost);
      expect(platformFee).to.equal(expectedCost * 10n / 100n); // 10% platform fee
      expect(ownerAmount).to.equal(expectedCost - (expectedCost * 10n / 100n));
    });
  });
});