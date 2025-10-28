const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DataMarketplace", function () {
  let owner, seller, buyer, platform, other;
  let DataVault, PaymentSplitter, DataMarketplace;
  let vault, splitter, market;

  beforeEach(async function () {
    [owner, seller, buyer, platform, other] = await ethers.getSigners();

    DataVault = await ethers.getContractFactory("DataVault", owner);
    vault = await DataVault.deploy();
    await vault.waitForDeployment();

    PaymentSplitter = await ethers.getContractFactory("PaymentSplitter", owner);
    splitter = await PaymentSplitter.deploy(platform.address);
    await splitter.waitForDeployment();

    DataMarketplace = await ethers.getContractFactory("DataMarketplace", owner);
    market = await DataMarketplace.deploy(vault.target, splitter.target);
    await market.waitForDeployment();

    // Seller registers a category
    const tx = await vault.connect(seller).registerDataCategory("CAT", ethers.parseEther("1"), ethers.ZeroHash);
    await tx.wait();

    // Authorize marketplace in DataVault
    await vault.setMarketplace(market.target);
  });

  it("quotes price and splits correctly", async function () {
    const [total, platformFee, ownerAmount] = await market.quote(1, 3);
    expect(total).to.equal(ethers.parseEther("3"));
    expect(platformFee).to.equal(ethers.parseEther("0.3"));
    expect(ownerAmount).to.equal(ethers.parseEther("2.7"));
  });

  it("buyer can request access by paying exact quote", async function () {
    const [total] = await market.quote(1, 2);
    const balBefore = await ethers.provider.getBalance(market.target);
    const tx = await market.connect(buyer).requestAccess(1, 2, { value: total });
    await tx.wait();

    const balAfter = await ethers.provider.getBalance(market.target);
    expect(balAfter - balBefore).to.equal(total);

    const r = await market.requestsById(1);
    expect(r.buyer).to.equal(buyer.address);
    expect(r.seller).to.equal(seller.address);
    expect(r.categoryId).to.equal(1n);
    expect(r.durationDays).to.equal(2n);
    expect(r.amount).to.equal(total);
    expect(r.status).to.equal(0n); // Requested
  });

  it("only owner can approve and reject requests", async function () {
    const [total] = await market.quote(1, 1);
    await market.connect(buyer).requestAccess(1, 1, { value: total });

    await expect(market.connect(seller).approveRequest(1)).to.be.revertedWithCustomError(
      market,
      "OwnableUnauthorizedAccount"
    ).withArgs(seller.address);

    await expect(market.connect(seller).rejectRequest(1)).to.be.revertedWithCustomError(
      market,
      "OwnableUnauthorizedAccount"
    ).withArgs(seller.address);
  });

  it("approve grants permission and splits payment to seller and platform", async function () {
    const [total, platformFee, ownerAmount] = await market.quote(1, 5);
    await market.connect(buyer).requestAccess(1, 5, { value: total });

    const sellerBalBefore = await ethers.provider.getBalance(seller.address);
    const platformBalBefore = await ethers.provider.getBalance(platform.address);

    const tx = await market.approveRequest(1);
    await tx.wait();

    const sellerBalAfter = await ethers.provider.getBalance(seller.address);
    const platformBalAfter = await ethers.provider.getBalance(platform.address);

    expect(sellerBalAfter - sellerBalBefore).to.equal(ownerAmount);
    expect(platformBalAfter - platformBalBefore).to.equal(platformFee);

    const hasAccess = await vault.checkPermission(1, buyer.address);
    expect(hasAccess).to.equal(true);

    const r = await market.requestsById(1);
    expect(r.status).to.equal(1n); // Approved
  });

  it("reject refunds buyer full amount", async function () {
    const [total] = await market.quote(1, 4);
    await market.connect(buyer).requestAccess(1, 4, { value: total });

    const buyerBalBefore = await ethers.provider.getBalance(buyer.address);
    const tx = await market.rejectRequest(1);
    await tx.wait();
    const buyerBalAfter = await ethers.provider.getBalance(buyer.address);

    // Buyer receives full refund; balance increases by 'total'
    expect(buyerBalAfter - buyerBalBefore).to.equal(total);

    const r = await market.requestsById(1);
    expect(r.status).to.equal(2n); // Rejected
  });

  it("buyer can cancel pending request and marketplace balance decreases", async function () {
    const [total] = await market.quote(1, 2);
    await market.connect(buyer).requestAccess(1, 2, { value: total });

    const marketBalBefore = await ethers.provider.getBalance(market.target);
    const tx = await market.connect(buyer).cancelRequest(1);
    await tx.wait();
    const marketBalAfter = await ethers.provider.getBalance(market.target);

    expect(marketBalBefore - marketBalAfter).to.equal(total);
    const r = await market.requestsById(1);
    expect(r.status).to.equal(3n); // Cancelled
  });

  // Edge case tests for better branch coverage
  it("approve request reverts for non-existent request", async function () {
    await expect(market.approveRequest(999))
      .to.be.revertedWithCustomError(market, "RequestNotExists");
  });

  it("reject request reverts for non-existent request", async function () {
    await expect(market.rejectRequest(999))
      .to.be.revertedWithCustomError(market, "RequestNotExists");
  });

  it("cancel request reverts for non-existent request", async function () {
    await expect(market.connect(buyer).cancelRequest(999))
      .to.be.revertedWithCustomError(market, "NotRequestBuyer");
  });

  it("approve request reverts if not pending", async function () {
    const [total] = await market.quote(1, 5);
    await market.connect(buyer).requestAccess(1, 5, { value: total });
    
    // Approve once
    await market.approveRequest(1);
    
    // Try to approve again
    await expect(market.approveRequest(1))
      .to.be.revertedWithCustomError(market, "RequestNotRequested");
  });

  it("reject request reverts if not pending", async function () {
    const [total] = await market.quote(1, 5);
    await market.connect(buyer).requestAccess(1, 5, { value: total });
    
    // Reject once
    await market.rejectRequest(1);
    
    // Try to reject again
    await expect(market.rejectRequest(1))
      .to.be.revertedWithCustomError(market, "RequestNotRequested");
  });

  it("cancel request reverts if not pending", async function () {
    const [total] = await market.quote(1, 5);
    await market.connect(buyer).requestAccess(1, 5, { value: total });
    
    // Approve first (changes status to Approved)
    await market.approveRequest(1);
    
    // Try to cancel approved request
    await expect(market.connect(buyer).cancelRequest(1))
      .to.be.revertedWithCustomError(market, "RequestNotRequested");
  });

  it("only owner can approve request", async function () {
    const [total] = await market.quote(1, 5);
    await market.connect(buyer).requestAccess(1, 5, { value: total });
    
    await expect(market.connect(buyer).approveRequest(1))
      .to.be.revertedWithCustomError(market, "OwnableUnauthorizedAccount")
      .withArgs(buyer.address);
  });

  it("only owner can reject request", async function () {
    const [total] = await market.quote(1, 5);
    await market.connect(buyer).requestAccess(1, 5, { value: total });
    
    await expect(market.connect(buyer).rejectRequest(1))
      .to.be.revertedWithCustomError(market, "OwnableUnauthorizedAccount")
      .withArgs(buyer.address);
  });

  it("only buyer can cancel request", async function () {
    const [total] = await market.quote(1, 5);
    await market.connect(buyer).requestAccess(1, 5, { value: total });
    
    await expect(market.connect(other).cancelRequest(1))
      .to.be.revertedWithCustomError(market, "NotRequestBuyer");
  });

  it("quote reverts for non-existent category", async function () {
    await expect(market.quote(999, 5))
      .to.be.revertedWithCustomError(market, "CategoryNotExists");
  });

  it("quote reverts on zero duration", async function () {
    await expect(market.quote(1, 0))
      .to.be.revertedWithCustomError(market, "ZeroDuration");
  });

  it("request access reverts for inactive category", async function () {
    // Deactivate the category
    await vault.deactivateDataCategory(1);
    
    await expect(market.connect(buyer).requestAccess(1, 5, { value: 0 }))
      .to.be.revertedWithCustomError(market, "CategoryInactive");
  });

  it("requestAccess reverts on bad amount", async function () {
    const [total] = await market.quote(1, 3);
    // Underpay by 1 wei
    await expect(market.connect(buyer).requestAccess(1, 3, { value: total - 1n }))
      .to.be.revertedWithCustomError(market, "IncorrectPaymentAmount");
  });

  it("rejectRequest refund fails when buyer reverts on receive", async function () {
    // Deploy RefundReverter buyer
    const RefundReverter = await ethers.getContractFactory("RefundReverter", owner);
    const reverter = await RefundReverter.deploy();
    await reverter.waitForDeployment();

    // Make request as buyer contract with value
    const [total] = await market.quote(1, 2);
    const txReq = await reverter.request(market.target, 1, 2, { value: total });
    await txReq.wait();

    // Owner rejects; refund to buyer contract should fail
    await expect(market.rejectRequest(1))
      .to.be.revertedWithCustomError(market, "RefundFailed");
  });

  it("cancelRequest refund fails when buyer reverts on receive", async function () {
    const RefundReverter = await ethers.getContractFactory("RefundReverter", owner);
    const reverter = await RefundReverter.deploy();
    await reverter.waitForDeployment();

    const [total] = await market.quote(1, 1);
    const txReq = await reverter.request(market.target, 1, 1, { value: total });
    await txReq.wait();

    // Cancel via buyer contract; refund back to buyer contract should fail
    await expect(reverter.cancel(market.target, 1))
      .to.be.revertedWithCustomError(market, "RefundFailed");
  });

  it("emits RequestApproved with correct requestId", async function () {
    const [total] = await market.quote(1, 2);
    await market.connect(buyer).requestAccess(1, 2, { value: total });
    await expect(market.approveRequest(1))
      .to.emit(market, "RequestApproved")
      .withArgs(1);
  });

  it("approve uses current platform fee: 0% all to seller", async function () {
    const [total] = await market.quote(1, 2);
    await market.connect(buyer).requestAccess(1, 2, { value: total });

    // Change platform fee to 0% before approval
    await splitter.setPlatformFeePercentage(0);

    const sellerBefore = await ethers.provider.getBalance(seller.address);
    const platformBefore = await ethers.provider.getBalance(platform.address);

    const tx = await market.approveRequest(1);
    await tx.wait();

    const sellerAfter = await ethers.provider.getBalance(seller.address);
    const platformAfter = await ethers.provider.getBalance(platform.address);

    expect(sellerAfter - sellerBefore).to.equal(total);
    expect(platformAfter - platformBefore).to.equal(0n);
  });

  it("emits RequestRejected with correct refund amount", async function () {
    const [total] = await market.quote(1, 3);
    await market.connect(buyer).requestAccess(1, 3, { value: total });
    await expect(market.rejectRequest(1))
      .to.emit(market, "RequestRejected")
      .withArgs(1, total);
  });

  it("emits RequestCancelled with correct refund amount", async function () {
    const [total] = await market.quote(1, 4);
    await market.connect(buyer).requestAccess(1, 4, { value: total });
    await expect(market.connect(buyer).cancelRequest(1))
      .to.emit(market, "RequestCancelled")
      .withArgs(1, total);
  });

  it("approve uses current platform fee: 100% all to platform", async function () {
    const [total] = await market.quote(1, 2);
    await market.connect(buyer).requestAccess(1, 2, { value: total });

    // Change platform fee to 100% before approval
    await splitter.setPlatformFeePercentage(100);

    const sellerBefore = await ethers.provider.getBalance(seller.address);
    const platformBefore = await ethers.provider.getBalance(platform.address);

    const tx = await market.approveRequest(1);
    await tx.wait();

    const sellerAfter = await ethers.provider.getBalance(seller.address);
    const platformAfter = await ethers.provider.getBalance(platform.address);

    expect(platformAfter - platformBefore).to.equal(total);
    expect(sellerAfter - sellerBefore).to.equal(0n);
  });
});