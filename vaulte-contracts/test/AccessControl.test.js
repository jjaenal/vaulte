const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AccessControl", function () {
  let owner;
  let DataVault, AccessControl, vault, access;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    DataVault = await ethers.getContractFactory("DataVault", owner);
    vault = await DataVault.deploy();
    await vault.waitForDeployment();

    AccessControl = await ethers.getContractFactory("AccessControl", owner);
    access = await AccessControl.deploy(vault.target);
    await access.waitForDeployment();
  });

  it("stores provided DataVault address", async function () {
    expect(await access.dataVault()).to.equal(vault.target);
  });
});