// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFeeVault
 * @notice Interface for the fee distribution vault
 */
interface IFeeVault {
    /**
     * @notice Deposits fees into the vault
     * @dev Called by WordDuel when games complete
     */
    function depositFees() external payable;

    /**
     * @notice Returns the total amount claimable by a staker
     * @param account The staker's address
     * @return The amount of ETH claimable
     */
    function claimable(address account) external view returns (uint256);

    /**
     * @notice Claims accumulated fees for the caller
     */
    function claim() external;

    /**
     * @notice Returns the creator's accumulated fees
     * @return The amount of ETH claimable by creator
     */
    function creatorBalance() external view returns (uint256);

    /**
     * @notice Withdraws creator's accumulated fees
     * @dev Only callable by creator address
     */
    function creatorWithdraw() external;
}
