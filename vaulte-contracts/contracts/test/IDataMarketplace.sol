// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDataMarketplace {
    function requestAccess(uint256 categoryId, uint256 durationDays)
        external
        payable
        returns (uint256);

    function cancelRequest(uint256 requestId) external;
}