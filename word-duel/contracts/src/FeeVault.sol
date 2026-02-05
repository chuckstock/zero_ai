// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title FeeVault
/// @notice Distributes game fees to $WORD stakers
/// @author Zer0
contract FeeVault is ReentrancyGuard {
    
    IERC20 public immutable wordToken;
    
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event FeesReceived(uint256 amount);
    
    constructor(address _wordToken) {
        wordToken = IERC20(_wordToken);
    }
    
    // ============ Staking ============
    
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        
        totalStaked += amount;
        stakedBalance[msg.sender] += amount;
        
        wordToken.transferFrom(msg.sender, address(this), amount);
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");
        
        totalStaked -= amount;
        stakedBalance[msg.sender] -= amount;
        
        wordToken.transfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            payable(msg.sender).transfer(reward);
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    // ============ Fee Reception ============
    
    receive() external payable {
        _distributeReward(msg.value);
        emit FeesReceived(msg.value);
    }
    
    function _distributeReward(uint256 amount) internal {
        if (totalStaked == 0) {
            return; // No stakers, fees go to next distribution
        }
        
        rewardPerTokenStored += (amount * 1e18) / totalStaked;
    }
    
    // ============ Views ============
    
    function earned(address account) public view returns (uint256) {
        return (
            (stakedBalance[account] * (rewardPerTokenStored - userRewardPerTokenPaid[account])) / 1e18
        ) + rewards[account];
    }
    
    function getStakedBalance(address account) external view returns (uint256) {
        return stakedBalance[account];
    }
    
    // ============ Modifiers ============
    
    modifier updateReward(address account) {
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
}
