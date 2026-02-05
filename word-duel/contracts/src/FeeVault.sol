// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IFeeVault} from "./interfaces/IFeeVault.sol";
import {IWordToken} from "./interfaces/IWordToken.sol";

/**
 * @title FeeVault
 * @author Bankrcade
 * @notice Accumulates and distributes fees from Word Duel games
 * @dev 50% to $WORD stakers (proportional), 50% to creator
 */
contract FeeVault is ReentrancyGuard, IFeeVault {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error NotCreator();
    error NotAuthorized();
    error NothingToClaim();
    error TransferFailed();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event FeesDeposited(uint256 totalAmount, uint256 stakerShare, uint256 creatorShare);
    event StakerClaimed(address indexed staker, uint256 amount);
    event CreatorWithdrew(uint256 amount);
    event WordDuelUpdated(address indexed newWordDuel);

    /*//////////////////////////////////////////////////////////////
                              CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Hardcoded creator address for fee collection
    address public constant CREATOR = 0x742d35Cc6634C0532925a3b844Bc9e7595f8fE18;
    
    /// @notice Fee split percentage (50% each, scaled by 100)
    uint256 public constant STAKER_SHARE_BPS = 5000;
    uint256 public constant CREATOR_SHARE_BPS = 5000;
    uint256 public constant BPS_DENOMINATOR = 10000;

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @notice The $WORD token contract
    IWordToken public immutable wordToken;
    
    /// @notice The WordDuel game contract (authorized to deposit)
    address public wordDuel;
    
    /// @notice Owner who can update wordDuel address
    address public owner;
    
    /// @notice Accumulated creator fees ready for withdrawal
    uint256 public creatorAccumulated;
    
    /// @notice Mapping of claimable balances per staker
    mapping(address => uint256) public stakerClaimable;
    
    /// @notice Running total of distributed staker fees (for accounting)
    uint256 public totalDistributedToStakers;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Deploys FeeVault linked to WordToken
     * @param _wordToken Address of the $WORD token contract
     */
    constructor(address _wordToken) {
        if (_wordToken == address(0)) revert ZeroAddress();
        wordToken = IWordToken(_wordToken);
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/
    
    modifier onlyWordDuel() {
        if (msg.sender != wordDuel) revert NotAuthorized();
        _;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }
    
    modifier onlyCreator() {
        if (msg.sender != CREATOR) revert NotCreator();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Sets the WordDuel contract address
     * @param _wordDuel The WordDuel contract address
     * @dev Only callable by owner, typically called once after deployment
     */
    function setWordDuel(address _wordDuel) external onlyOwner {
        if (_wordDuel == address(0)) revert ZeroAddress();
        wordDuel = _wordDuel;
        emit WordDuelUpdated(_wordDuel);
    }
    
    /**
     * @notice Transfers ownership
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    /*//////////////////////////////////////////////////////////////
                          FEE FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Deposits fees from completed games
     * @dev Splits 50/50 between stakers and creator
     *      Staker portion is distributed proportionally based on stake
     */
    function depositFees() external payable onlyWordDuel {
        if (msg.value == 0) return;
        
        uint256 stakerShare = (msg.value * STAKER_SHARE_BPS) / BPS_DENOMINATOR;
        uint256 creatorShare = msg.value - stakerShare;
        
        // Add to creator's balance
        creatorAccumulated += creatorShare;
        
        // Distribute to stakers proportionally
        _distributeToStakers(stakerShare);
        
        emit FeesDeposited(msg.value, stakerShare, creatorShare);
    }
    
    /**
     * @notice Internal function to distribute fees to stakers
     * @param amount Total amount to distribute
     */
    function _distributeToStakers(uint256 amount) internal {
        uint256 totalStaked = wordToken.totalStaked();
        
        // If no stakers, send to creator instead
        if (totalStaked == 0) {
            creatorAccumulated += amount;
            return;
        }
        
        (address[] memory stakers, uint256[] memory amounts) = wordToken.getStakers();
        
        uint256 distributed = 0;
        uint256 length = stakers.length;
        
        for (uint256 i = 0; i < length;) {
            if (amounts[i] > 0) {
                // Calculate proportional share
                uint256 share = (amount * amounts[i]) / totalStaked;
                stakerClaimable[stakers[i]] += share;
                distributed += share;
            }
            unchecked { ++i; }
        }
        
        // Handle any dust (rounding errors) by sending to creator
        if (distributed < amount) {
            creatorAccumulated += (amount - distributed);
        }
        
        totalDistributedToStakers += distributed;
    }

    /*//////////////////////////////////////////////////////////////
                          CLAIM FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Returns the amount claimable by a staker
     * @param account The staker's address
     * @return The claimable amount in ETH
     */
    function claimable(address account) external view returns (uint256) {
        return stakerClaimable[account];
    }
    
    /**
     * @notice Claims accumulated fees for the caller
     */
    function claim() external nonReentrant {
        uint256 amount = stakerClaimable[msg.sender];
        if (amount == 0) revert NothingToClaim();
        
        stakerClaimable[msg.sender] = 0;
        
        (bool success,) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit StakerClaimed(msg.sender, amount);
    }
    
    /**
     * @notice Returns the creator's accumulated fees
     * @return The amount claimable by creator
     */
    function creatorBalance() external view returns (uint256) {
        return creatorAccumulated;
    }
    
    /**
     * @notice Withdraws creator's accumulated fees
     * @dev Only callable by the hardcoded creator address
     */
    function creatorWithdraw() external nonReentrant onlyCreator {
        uint256 amount = creatorAccumulated;
        if (amount == 0) revert NothingToClaim();
        
        creatorAccumulated = 0;
        
        (bool success,) = CREATOR.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit CreatorWithdrew(amount);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Returns total ETH held in the vault
     * @return The contract's ETH balance
     */
    function totalBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Emergency receive for direct ETH (treated as creator fee)
     */
    receive() external payable {
        creatorAccumulated += msg.value;
    }
}
