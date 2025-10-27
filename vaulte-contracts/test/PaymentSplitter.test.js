const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentSplitter", function () {
  let owner, platform, recipient, other;
  let PaymentSplitter, splitter;
  let RevertingReceiver, reverter;

  beforeEach(async function () {
    [owner, platform, recipient, other] = await ethers.getSigners();
    PaymentSplitter = await ethers.getContractFactory("PaymentSplitter", owner);
    splitter = await PaymentSplitter.deploy(platform.address);
    await splitter.waitForDeployment();

    // Deploy reverting receiver for transfer failure tests
    RevertingReceiver = await ethers.getContractFactory("RevertingReceiver", owner);
    reverter = await RevertingReceiver.deploy();
    await reverter.waitForDeployment();
  });

  it("constructor reverts on zero platform wallet", async function () {
    await expect(PaymentSplitter.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      PaymentSplitter, 
      "ZeroAddress"
    );
  });

  it("sets platform wallet and fee", async function () {
    await splitter.setPlatformFeePercentage(20);
    expect(await splitter.platformFeePercentage()).to.equal(20n);

    await splitter.setPlatformWallet(other.address);
    expect(await splitter.platformWallet()).to.equal(other.address);
  });

  it("split reverts on bad inputs", async function () {
    await expect(splitter.split(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      splitter, 
      "ZeroAddress"
    );
    await expect(splitter.split(recipient.address, { value: 0 })).to.be.revertedWithCustomError(
      splitter, 
      "ZeroAmount"
    );
  });

  it("splits payment according to percentage", async function () {
    await splitter.setPlatformFeePercentage(25); // 25%

    const platformBefore = await ethers.provider.getBalance(platform.address);
    const recipientBefore = await ethers.provider.getBalance(recipient.address);

    const value = ethers.parseEther("1");
    const tx = await splitter.split(recipient.address, { value });
    await tx.wait();

    const platformAfter = await ethers.provider.getBalance(platform.address);
    const recipientAfter = await ethers.provider.getBalance(recipient.address);

    const platformFee = ethers.parseEther("0.25");
    const ownerAmount = ethers.parseEther("0.75");

    expect(platformAfter - platformBefore).to.equal(platformFee);
    expect(recipientAfter - recipientBefore).to.equal(ownerAmount);
  });

  it("setPlatformFeePercentage reverts when >100", async function () {
    await expect(splitter.setPlatformFeePercentage(101)).to.be.revertedWithCustomError(
      splitter,
      "PercentageExceeded"
    );
  });

  it("only owner can set platform fee", async function () {
    await expect(splitter.connect(other).setPlatformFeePercentage(10))
      .to.be.revertedWithCustomError(splitter, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("setPlatformWallet reverts on zero address", async function () {
    await expect(splitter.setPlatformWallet(ethers.ZeroAddress)).to.be.revertedWithCustomError(
      splitter,
      "ZeroAddress"
    );
  });

  it("only owner can set platform wallet", async function () {
    await expect(splitter.connect(other).setPlatformWallet(recipient.address))
      .to.be.revertedWithCustomError(splitter, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("fee boundary: 0% sends all to owner", async function () {
    await splitter.setPlatformFeePercentage(0);

    const platformBefore = await ethers.provider.getBalance(platform.address);
    const recipientBefore = await ethers.provider.getBalance(recipient.address);

    const value = ethers.parseEther("1");
    const tx = await splitter.split(recipient.address, { value });
    await tx.wait();

    const platformAfter = await ethers.provider.getBalance(platform.address);
    const recipientAfter = await ethers.provider.getBalance(recipient.address);

    expect(platformAfter - platformBefore).to.equal(0n);
    expect(recipientAfter - recipientBefore).to.equal(value);
  });

  it("fee boundary: 100% sends all to platform", async function () {
    await splitter.setPlatformFeePercentage(100);

    const platformBefore = await ethers.provider.getBalance(platform.address);
    const recipientBefore = await ethers.provider.getBalance(recipient.address);

    const value = ethers.parseEther("1");
    const tx = await splitter.split(recipient.address, { value });
    await tx.wait();

    const platformAfter = await ethers.provider.getBalance(platform.address);
    const recipientAfter = await ethers.provider.getBalance(recipient.address);

    expect(platformAfter - platformBefore).to.equal(value);
    expect(recipientAfter - recipientBefore).to.equal(0n);
  });

  it("split reverts when owner transfer fails", async function () {
    await expect(splitter.split(reverter.target, { value: ethers.parseEther("1") }))
      .to.be.revertedWithCustomError(splitter, "OwnerTransferFailed");
  });

  it("split reverts when platform transfer fails", async function () {
    await splitter.setPlatformWallet(reverter.target);
    await expect(splitter.split(recipient.address, { value: ethers.parseEther("1") }))
      .to.be.revertedWithCustomError(splitter, "PlatformTransferFailed");
  });

  it("emits PaymentSplit event with correct amounts", async function () {
    await splitter.setPlatformFeePercentage(20); // 20%
    const value = ethers.parseEther("1");
    const platformFee = value * 20n / 100n;
    const ownerAmount = value - platformFee;

    await expect(splitter.split(recipient.address, { value }))
      .to.emit(splitter, "PaymentSplit")
      .withArgs(recipient.address, ownerAmount, platformFee);
  });

  describe("Pro-rated refund calculations", function () {
    it("calculates pro-rated refund correctly", async function () {
      const totalPaid = ethers.parseEther("1"); // 1 ETH
      const totalDuration = 30; // 30 days
      const usedDuration = 10; // 10 days used
      
      const refund = await splitter.calculateProRatedRefund(totalPaid, totalDuration, usedDuration);
      const expectedRefund = totalPaid * 20n / 30n; // 20 days unused = 2/3 of payment
      
      expect(refund).to.equal(expectedRefund);
    });

    it("returns zero refund when fully used", async function () {
      const totalPaid = ethers.parseEther("1");
      const totalDuration = 30;
      const usedDuration = 30; // Fully used
      
      const refund = await splitter.calculateProRatedRefund(totalPaid, totalDuration, usedDuration);
      expect(refund).to.equal(0n);
    });

    it("returns full refund when not used", async function () {
      const totalPaid = ethers.parseEther("1");
      const totalDuration = 30;
      const usedDuration = 0; // Not used at all
      
      const refund = await splitter.calculateProRatedRefund(totalPaid, totalDuration, usedDuration);
      expect(refund).to.equal(totalPaid);
    });

    it("reverts on invalid inputs", async function () {
      const totalPaid = ethers.parseEther("1");
      
      // Zero duration
      await expect(splitter.calculateProRatedRefund(totalPaid, 0, 0))
        .to.be.revertedWithCustomError(splitter, "ZeroDuration");
      
      // Used > total
      await expect(splitter.calculateProRatedRefund(totalPaid, 10, 15))
        .to.be.revertedWithCustomError(splitter, "UsedDurationExceedsTotal");
    });
  });

  describe("Platform fee management", function () {
    it("updates platform fee within limits", async function () {
      await splitter.setPlatformFeePercentage(15);
      expect(await splitter.platformFeePercentage()).to.equal(15n);
      
      await splitter.setPlatformFeePercentage(0);
      expect(await splitter.platformFeePercentage()).to.equal(0n);
      
      await splitter.setPlatformFeePercentage(100);
      expect(await splitter.platformFeePercentage()).to.equal(100n);
    });

    it("reverts when fee exceeds 100%", async function () {
      await expect(splitter.setPlatformFeePercentage(101))
        .to.be.revertedWithCustomError(splitter, "PercentageExceeded");
    });
  });
});