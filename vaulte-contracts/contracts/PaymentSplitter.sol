// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title PaymentSplitter - Platform fee and owner payment distribution
/// @author Vaulté Team
/// @notice Splits payments between platform and data owners
/// @dev MVP implementation: simple percentage split on incoming ETH
contract PaymentSplitter is Ownable {
    /// @notice Platform fee percentage (0-100)
    uint256 public platformFeePercentage = 10; // 10%

    /// @notice Platform wallet address
    address public platformWallet;

    /// @notice Custom errors for better gas efficiency and clarity
    error ZeroAddress();
    error ZeroAmount();
    error OwnerTransferFailed();
    error PlatformTransferFailed();
    error PercentageExceeded();
    error ZeroDuration();
    error UsedDurationExceedsTotal();

    /// @notice Emitted when payment is split
    event PaymentSplit(address indexed owner, uint256 ownerAmount, uint256 platformFee);

    constructor(address _platformWallet) Ownable(msg.sender) {
        if (_platformWallet == address(0)) revert ZeroAddress();
        platformWallet = _platformWallet;
    }

    /// @notice Split incoming ETH using current platform fee and forward funds
    /// @param owner The data owner to receive the owner share
    function split(address owner) external payable {
        if (owner == address(0)) revert ZeroAddress();
        if (msg.value == 0) revert ZeroAmount();
        
        uint256 platformFee = (msg.value * platformFeePercentage) / 100;
        uint256 ownerAmount = msg.value - platformFee;

        (bool s1, ) = payable(owner).call{value: ownerAmount}("");
        if (!s1) revert OwnerTransferFailed();
        
        (bool s2, ) = payable(platformWallet).call{value: platformFee}("");
        if (!s2) revert PlatformTransferFailed();

        emit PaymentSplit(owner, ownerAmount, platformFee);
    }

    /// @notice Update platform fee percentage
    /// @param newPct New percentage (0-100)
    function setPlatformFeePercentage(uint256 newPct) external onlyOwner {
        if (newPct > 100) revert PercentageExceeded();
        platformFeePercentage = newPct;
    }

    /// @notice Update platform wallet
    /// @param newWallet New wallet address
    function setPlatformWallet(address newWallet) external onlyOwner {
        if (newWallet == address(0)) revert ZeroAddress();
        platformWallet = newWallet;
    }

    /// @notice Calculate pro-rated refund based on usage
    /// @param totalPaid Total amount paid for the permission
    /// @param totalDuration Total duration in days
    /// @param usedDuration Used duration in days
    /// @return refundAmount Amount to refund
    function calculateProRatedRefund(
        uint256 totalPaid,
        uint256 totalDuration,
        uint256 usedDuration
    ) public pure returns (uint256 refundAmount) {
        if (totalDuration == 0) revert ZeroDuration();
        if (usedDuration > totalDuration) revert UsedDurationExceedsTotal();
        
        if (usedDuration >= totalDuration) {
            return 0; // No refund if fully used
        }
        
        uint256 unusedDuration = totalDuration - usedDuration;
        refundAmount = (totalPaid * unusedDuration) / totalDuration;
    }
}