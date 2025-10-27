// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DataVault.sol";
import "./PaymentSplitter.sol";

/// @title DataMarketplace - Data access request and payment flow
/// @author Vaulté Team
/// @notice Handles data access requests and payment splitting
/// @dev MVP implementation per TODO.md Week 3
contract DataMarketplace is Ownable, ReentrancyGuard {
    DataVault public dataVault;
    PaymentSplitter public paymentSplitter;

    enum RequestStatus { Requested, Approved, Rejected, Cancelled }

    struct AccessRequest {
        address buyer;
        address seller;
        uint256 categoryId;
        uint256 durationDays;
        uint256 amount; // total amount paid by buyer
        RequestStatus status;
    }

    /// @notice Custom errors for better gas efficiency and clarity
    error ZeroDuration();
    error CategoryNotExists();
    error CategoryInactive();
    error IncorrectPaymentAmount();
    error RequestNotExists();
    error RequestNotRequested();
    error NotRequestBuyer();
    error RefundFailed();

    uint256 public totalRequests;
    mapping(uint256 => AccessRequest) public requestsById;

    /// @notice Emitted when a data access is requested
    event DataAccessRequested(uint256 indexed requestId, address indexed buyer, address indexed seller);
    /// @notice Emitted when a request is approved
    event RequestApproved(uint256 indexed requestId);
    /// @notice Emitted when a request is rejected
    event RequestRejected(uint256 indexed requestId, uint256 refundAmount);
    /// @notice Emitted when a request is cancelled
    event RequestCancelled(uint256 indexed requestId, uint256 refundAmount);

    constructor(address _dataVault, address _paymentSplitter) Ownable(msg.sender) {
        dataVault = DataVault(_dataVault);
        paymentSplitter = PaymentSplitter(_paymentSplitter);
    }

    /// @notice Quote total price for a category and duration
    function quote(uint256 categoryId, uint256 durationDays)
        public
        view
        returns (uint256 total, uint256 platformFee, uint256 ownerAmount)
    {
        if (durationDays == 0) revert ZeroDuration();
        
        DataVault.DataCategory memory cat = dataVault.getDataCategory(categoryId);
        if (cat.owner == address(0)) revert CategoryNotExists();
        if (!cat.isActive) revert CategoryInactive();
        
        total = cat.pricePerDay * durationDays;
        uint256 pct = paymentSplitter.platformFeePercentage();
        platformFee = (total * pct) / 100;
        ownerAmount = total - platformFee;
    }

    /// @notice Request access for a given category by paying exact quote
    function requestAccess(uint256 categoryId, uint256 durationDays)
        external
        payable
        nonReentrant
        returns (uint256 requestId)
    {
        (uint256 total,,) = quote(categoryId, durationDays);
        if (msg.value != total) revert IncorrectPaymentAmount();
        
        DataVault.DataCategory memory cat = dataVault.getDataCategory(categoryId);
        requestId = ++totalRequests;
        requestsById[requestId] = AccessRequest({
            buyer: msg.sender,
            seller: cat.owner,
            categoryId: categoryId,
            durationDays: durationDays,
            amount: total,
            status: RequestStatus.Requested
        });
        emit DataAccessRequested(requestId, msg.sender, cat.owner);
    }

    /// @notice Approve a pending request, grant permission, and split payment
    function approveRequest(uint256 requestId) external onlyOwner nonReentrant {
        AccessRequest storage r = requestsById[requestId];
        if (r.buyer == address(0)) revert RequestNotExists();
        if (r.status != RequestStatus.Requested) revert RequestNotRequested();

        dataVault.grantPermission(r.categoryId, r.buyer, r.durationDays);
        paymentSplitter.split{value: r.amount}(r.seller);

        r.status = RequestStatus.Approved;
        emit RequestApproved(requestId);
    }

    /// @notice Reject a pending request and refund buyer
    function rejectRequest(uint256 requestId) external onlyOwner nonReentrant {
        AccessRequest storage r = requestsById[requestId];
        if (r.buyer == address(0)) revert RequestNotExists();
        if (r.status != RequestStatus.Requested) revert RequestNotRequested();

        r.status = RequestStatus.Rejected;
        (bool s, ) = payable(r.buyer).call{value: r.amount}("");
        if (!s) revert RefundFailed();
        
        emit RequestRejected(requestId, r.amount);
    }

    /// @notice Cancel own pending request and get refund
    function cancelRequest(uint256 requestId) external nonReentrant {
        AccessRequest storage r = requestsById[requestId];
        if (r.buyer != msg.sender) revert NotRequestBuyer();
        if (r.status != RequestStatus.Requested) revert RequestNotRequested();
        
        r.status = RequestStatus.Cancelled;
        (bool s, ) = payable(r.buyer).call{value: r.amount}("");
        if (!s) revert RefundFailed();
        
        emit RequestCancelled(requestId, r.amount);
    }
}