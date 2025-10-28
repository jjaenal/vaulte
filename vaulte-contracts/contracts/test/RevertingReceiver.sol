// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RevertingReceiver - Test contract that reverts on receive
/// @notice Used to test error handling in PaymentSplitter
contract RevertingReceiver {
    /// @dev Custom error used to replace string revert
    error ReceiveFail();
    /// @notice Always reverts when receiving ETH
    receive() external payable {
        revert ReceiveFail();
    }
}