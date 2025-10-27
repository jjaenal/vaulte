// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DataVault.sol";

/// @title AccessControl - Time-based access verification
/// @author Vaulté Team
/// @notice Verifies and manages access for buyers
/// @dev Base skeleton following TODO.md
contract AccessControl {
    DataVault public dataVault;

    constructor(address _dataVault) {
        dataVault = DataVault(_dataVault);
    }
}