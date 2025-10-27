// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./IDataMarketplace.sol";

/// @title RefundReverter - Buyer contract that reverts on receiving ETH
/// @notice Used to test refund paths in DataMarketplace (reject and cancel)
contract RefundReverter {
    receive() external payable {
        revert("refund receive fail");
    }

    function request(
        IDataMarketplace market,
        uint256 categoryId,
        uint256 durationDays
    ) external payable returns (uint256) {
        return market.requestAccess{value: msg.value}(categoryId, durationDays);
    }

    function cancel(IDataMarketplace market, uint256 requestId) external {
        market.cancelRequest(requestId);
    }
}