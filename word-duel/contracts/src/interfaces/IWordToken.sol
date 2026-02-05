// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IWordToken
 * @notice Interface for the $WORD token with staking capabilities
 */
interface IWordToken is IERC20 {
    /**
     * @notice Stakes tokens to become eligible for fee distribution
     * @param amount The amount of tokens to stake
     */
    function stake(uint256 amount) external;

    /**
     * @notice Unstakes tokens
     * @param amount The amount of tokens to unstake
     */
    function unstake(uint256 amount) external;

    /**
     * @notice Returns the staked balance of an account
     * @param account The address to query
     * @return The staked token balance
     */
    function stakedBalanceOf(address account) external view returns (uint256);

    /**
     * @notice Returns the total amount of staked tokens
     * @return The total staked supply
     */
    function totalStaked() external view returns (uint256);

    /**
     * @notice Returns all stakers and their staked amounts
     * @return stakers Array of staker addresses
     * @return amounts Array of staked amounts
     */
    function getStakers() external view returns (address[] memory stakers, uint256[] memory amounts);
}
