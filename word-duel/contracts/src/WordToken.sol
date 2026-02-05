// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title WordToken
/// @notice $WORD token for Word Duel fee sharing
/// @author Zer0
contract WordToken is ERC20, Ownable {
    
    address public feeVault;
    
    constructor() ERC20("Word Duel", "WORD") Ownable(msg.sender) {
        // Initial supply for liquidity and distribution
        // 80% bonding curve, 10% LP, 5% creator, 5% treasury
        _mint(msg.sender, 1_000_000_000 * 1e18); // 1 billion
    }
    
    function setFeeVault(address _feeVault) external onlyOwner {
        feeVault = _feeVault;
    }
}
