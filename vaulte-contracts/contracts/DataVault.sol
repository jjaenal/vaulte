// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Vaulté DataVault
/// @notice Manages data categories and access permissions for the Vaulté platform
/// @dev Week 2 implementation: core structs, storage, and functions per TODO.md
contract DataVault is Ownable, ReentrancyGuard {
    /// @notice Data category definition
    /// @param name Human-readable category name (unique per platform intent)
    /// @param owner Address of category creator/owner
    /// @param isActive Whether category is active for new permissions
    /// @param pricePerDay Price in wei per day of access
    /// @param dataHash Hash/CID reference to off-chain metadata
    struct DataCategory {
        string name;
        address owner;
        bool isActive;
        uint256 pricePerDay;
        bytes32 dataHash;
    }

    /// @notice Permission for a buyer to access a category
    /// @param granted True if permission currently active
    /// @param expiryTimestamp When permission expires
    /// @param totalPaid Total paid for the permission (pricePerDay * durationDays)
    /// @param startTimestamp When permission was granted
    struct Permission {
        bool granted;
        uint256 expiryTimestamp;
        uint256 totalPaid;
        uint256 startTimestamp;
    }

    /// @notice Custom errors for better gas efficiency and clarity
    error Unauthorized();
    error EmptyName();
    error ZeroPrice();
    error ZeroAddress();
    error InvalidCategoryId();
    error CategoryNotExists();
    error CategoryInactive();
    error CategoryAlreadyInactive();
    error PermissionNotGranted();
    error ZeroDuration();

    /// @notice Emitted when a new data category is registered
    event DataCategoryRegistered(address indexed owner, uint256 indexed categoryId, string name);
    /// @notice Emitted when a category is updated
    event DataCategoryUpdated(uint256 indexed categoryId);
    /// @notice Emitted when a category is deactivated
    event DataCategoryDeactivated(uint256 indexed categoryId);
    /// @notice Emitted when permission is granted
    event PermissionGranted(
        uint256 indexed categoryId,
        address indexed buyer,
        uint256 expiryTimestamp,
        uint256 totalPaid
    );
    /// @notice Emitted when permission is revoked
    event PermissionRevoked(uint256 indexed categoryId, address indexed buyer, uint256 refundAmount);

    // Storage
    uint256 public totalCategories;
    mapping(uint256 => DataCategory) private categoriesById;
    mapping(address => uint256[]) private userCategoryIds;
    mapping(uint256 => mapping(address => Permission)) private categoryPermissions;

    address public marketplace;

    modifier onlyOwnerOrMarketplace() {
        if (msg.sender != owner() && msg.sender != marketplace) {
            revert Unauthorized();
        }
        _;
    }

    constructor() Ownable(msg.sender) {}
    /// @notice Register a new data category
    /// @param _name Category name (must be non-empty)
    /// @param _pricePerDay Price in wei per day (must be > 0)
    /// @param _dataHash Data hash/CID reference
    /// @return categoryId Newly assigned category id
    function registerDataCategory(
        string calldata _name,
        uint256 _pricePerDay,
        bytes32 _dataHash
    ) external nonReentrant returns (uint256 categoryId) {
        if (bytes(_name).length == 0) revert EmptyName();
        if (_pricePerDay == 0) revert ZeroPrice();

        categoryId = ++totalCategories;
        categoriesById[categoryId] = DataCategory({
            name: _name,
            owner: msg.sender,
            isActive: true,
            pricePerDay: _pricePerDay,
            dataHash: _dataHash
        });
        userCategoryIds[msg.sender].push(categoryId);

        emit DataCategoryRegistered(msg.sender, categoryId, _name);
    }

    /// @notice Update price and data hash for a category
    /// @dev Restricted to contract owner for MVP per TODO.md
    /// @param _categoryId Category id
    /// @param _newPricePerDay New price per day (must be > 0)
    /// @param _newDataHash New data hash
    function updateDataCategory(
        uint256 _categoryId,
        uint256 _newPricePerDay,
        bytes32 _newDataHash
    ) external onlyOwner nonReentrant {
        if (_categoryId == 0 || _categoryId > totalCategories) revert InvalidCategoryId();
        if (_newPricePerDay == 0) revert ZeroPrice();

        DataCategory storage cat = categoriesById[_categoryId];
        if (cat.owner == address(0)) revert CategoryNotExists();

        cat.pricePerDay = _newPricePerDay;
        cat.dataHash = _newDataHash;

        emit DataCategoryUpdated(_categoryId);
    }

    /// @notice Deactivate a category, preventing new permissions
    /// @dev Restricted to contract owner for MVP per TODO.md
    /// @param _categoryId Category id
    function deactivateDataCategory(uint256 _categoryId) external onlyOwner nonReentrant {
        if (_categoryId == 0 || _categoryId > totalCategories) revert InvalidCategoryId();
        
        DataCategory storage cat = categoriesById[_categoryId];
        if (cat.owner == address(0)) revert CategoryNotExists();
        if (!cat.isActive) revert CategoryAlreadyInactive();

        cat.isActive = false;
        emit DataCategoryDeactivated(_categoryId);
    }

    /// @notice Grant permission to a buyer for a duration in days
    /// @dev Restricted to contract owner for MVP per TODO.md
    /// @param _categoryId Category id
    /// @param _buyer Buyer address to grant permission to
    /// @param _durationDays Number of days for the permission
    function grantPermission(
        uint256 _categoryId,
        address _buyer,
        uint256 _durationDays
    ) external onlyOwnerOrMarketplace nonReentrant {
        if (_buyer == address(0)) revert ZeroAddress();
        if (_durationDays == 0) revert ZeroDuration();
        if (_categoryId == 0 || _categoryId > totalCategories) revert InvalidCategoryId();

        DataCategory storage cat = categoriesById[_categoryId];
        if (cat.owner == address(0)) revert CategoryNotExists();
        if (!cat.isActive) revert CategoryInactive();

        Permission storage p = categoryPermissions[_categoryId][_buyer];
        uint256 start = block.timestamp;
        uint256 expiry = start + (_durationDays * 1 days);
        uint256 totalPaid = cat.pricePerDay * _durationDays;

        p.granted = true;
        p.startTimestamp = start;
        p.expiryTimestamp = expiry;
        p.totalPaid = totalPaid;

        emit PermissionGranted(_categoryId, _buyer, expiry, totalPaid);
    }

    /// @notice Revoke permission early and compute pro-rated refund amount
    /// @dev Refund is proportional to remaining time vs total duration
    /// @param _categoryId Category id
    /// @param _buyer Buyer whose permission is revoked
    /// @return refundAmount Calculated refund in wei
    function revokePermission(
        uint256 _categoryId,
        address _buyer
    ) external onlyOwnerOrMarketplace nonReentrant returns (uint256 refundAmount) {
        if (_buyer == address(0)) revert ZeroAddress();
        if (_categoryId == 0 || _categoryId > totalCategories) revert InvalidCategoryId();

        Permission storage p = categoryPermissions[_categoryId][_buyer];
        if (!p.granted) revert PermissionNotGranted();

        // Calculate pro-rated refund based on remaining days
        uint256 totalDurationDays = (p.expiryTimestamp - p.startTimestamp) / 1 days;
        if (totalDurationDays == 0) {
            refundAmount = 0;
        } else {
            uint256 elapsedDays = (block.timestamp - p.startTimestamp) / 1 days;
            if (elapsedDays > totalDurationDays) {
                elapsedDays = totalDurationDays; // cap
            }
            uint256 remainingDays = totalDurationDays - elapsedDays;
            refundAmount = (p.totalPaid * remainingDays) / totalDurationDays;
        }

        p.granted = false;
        p.expiryTimestamp = block.timestamp; // mark revoked now

        emit PermissionRevoked(_categoryId, _buyer, refundAmount);
    }

    /// @notice Check if buyer currently has valid permission
    /// @param _categoryId Category id
    /// @param _buyer Buyer address
    /// @return hasAccess True if granted and not expired
    function checkPermission(uint256 _categoryId, address _buyer) external view returns (bool hasAccess) {
        Permission storage p = categoryPermissions[_categoryId][_buyer];
        return p.granted && block.timestamp < p.expiryTimestamp;
    }

    /// @notice Get a category by id
    /// @param _categoryId Category id
    /// @return category Category struct
    function getDataCategory(uint256 _categoryId) external view returns (DataCategory memory category) {
        category = categoriesById[_categoryId];
    }

    /// @notice List category IDs created by a user
    /// @param _user Address of user
    /// @return ids Array of category ids
    function getUserCategories(address _user) external view returns (uint256[] memory ids) {
        ids = userCategoryIds[_user];
    }

    /// @notice Set authorized marketplace contract that can manage permissions
    /// @param _marketplace Marketplace contract address
    function setMarketplace(address _marketplace) external onlyOwner {
        if (_marketplace == address(0)) revert ZeroAddress();
        marketplace = _marketplace;
    }
}