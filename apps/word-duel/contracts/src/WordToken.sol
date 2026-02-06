// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IWordToken} from "./interfaces/IWordToken.sol";

/**
 * @title WordToken
 * @author Bankrcade
 * @notice $WORD ERC-20 token with staking for fee distribution eligibility
 * @dev Staked tokens are tracked separately and make holders eligible for game fees
 */
contract WordToken is ERC20, ERC20Permit, Ownable, ReentrancyGuard, IWordToken {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error InsufficientBalance();
    error InsufficientStakedBalance();
    error ZeroAmount();
    error MaxStakersReached();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event Staked(address indexed account, uint256 amount);
    event Unstaked(address indexed account, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Maximum number of unique stakers (gas limit protection)
    uint256 public constant MAX_STAKERS = 1000;
    
    /// @notice Total supply: 1 billion tokens
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18;
    
    /// @notice Mapping of staked balances
    mapping(address => uint256) private _stakedBalances;
    
    /// @notice Total amount of staked tokens
    uint256 private _totalStaked;
    
    /// @notice Array of staker addresses for iteration
    address[] private _stakers;
    
    /// @notice Index tracking for stakers array
    mapping(address => uint256) private _stakerIndex;
    
    /// @notice Whether an address is currently staking
    mapping(address => bool) private _isStaker;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Deploys WordToken with full supply minted to deployer
     * @param initialOwner The address that receives initial supply and ownership
     */
    constructor(address initialOwner) 
        ERC20("Word Duel", "WORD") 
        ERC20Permit("Word Duel")
        Ownable(initialOwner) 
    {
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    /*//////////////////////////////////////////////////////////////
                            STAKING FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Stakes tokens to become eligible for fee distribution
     * @param amount The amount of tokens to stake
     * @dev Tokens remain in user's wallet but are locked
     */
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        // Add to stakers list if new staker
        if (!_isStaker[msg.sender]) {
            if (_stakers.length >= MAX_STAKERS) revert MaxStakersReached();
            _stakerIndex[msg.sender] = _stakers.length;
            _stakers.push(msg.sender);
            _isStaker[msg.sender] = true;
        }
        
        // Transfer tokens to this contract (locked)
        _transfer(msg.sender, address(this), amount);
        
        _stakedBalances[msg.sender] += amount;
        _totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Unstakes tokens
     * @param amount The amount of tokens to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (_stakedBalances[msg.sender] < amount) revert InsufficientStakedBalance();
        
        _stakedBalances[msg.sender] -= amount;
        _totalStaked -= amount;
        
        // Remove from stakers list if fully unstaked
        if (_stakedBalances[msg.sender] == 0) {
            _removeStaker(msg.sender);
        }
        
        // Return tokens to user
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Returns the staked balance of an account
     * @param account The address to query
     * @return The staked token balance
     */
    function stakedBalanceOf(address account) external view returns (uint256) {
        return _stakedBalances[account];
    }
    
    /**
     * @notice Returns the total amount of staked tokens
     * @return The total staked supply
     */
    function totalStaked() external view returns (uint256) {
        return _totalStaked;
    }
    
    /**
     * @notice Returns all stakers and their staked amounts
     * @return stakers Array of staker addresses
     * @return amounts Array of staked amounts
     * @dev Used by FeeVault for proportional distribution
     */
    function getStakers() external view returns (address[] memory stakers, uint256[] memory amounts) {
        uint256 length = _stakers.length;
        stakers = new address[](length);
        amounts = new uint256[](length);
        
        for (uint256 i = 0; i < length;) {
            stakers[i] = _stakers[i];
            amounts[i] = _stakedBalances[_stakers[i]];
            unchecked { ++i; }
        }
    }
    
    /**
     * @notice Returns the number of unique stakers
     * @return The count of stakers
     */
    function stakerCount() external view returns (uint256) {
        return _stakers.length;
    }

    /*//////////////////////////////////////////////////////////////
                          INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Removes a staker from the stakers array
     * @param staker The address to remove
     */
    function _removeStaker(address staker) internal {
        uint256 index = _stakerIndex[staker];
        uint256 lastIndex = _stakers.length - 1;
        
        if (index != lastIndex) {
            address lastStaker = _stakers[lastIndex];
            _stakers[index] = lastStaker;
            _stakerIndex[lastStaker] = index;
        }
        
        _stakers.pop();
        delete _stakerIndex[staker];
        _isStaker[staker] = false;
    }
}
