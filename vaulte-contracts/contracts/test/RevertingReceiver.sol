// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RevertingReceiver - Test contract that reverts on receive
/// @notice Used to test error handling in PaymentSplitter
contract RevertingReceiver {
    /// @notice Always reverts when receiving ETH
    receive() external payable {
        revert("receive fail");
    }
}