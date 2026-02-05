// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {WordDuel} from "../src/WordDuel.sol";
import {WordToken} from "../src/WordToken.sol";
import {FeeVault} from "../src/FeeVault.sol";

contract DeployScript is Script {
    // Zer0's address for creator fees
    address constant CREATOR = 0x0000000000000000000000000000000000000000; // TODO: Set Zer0's address
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy $WORD token
        WordToken wordToken = new WordToken();
        console2.log("WordToken deployed:", address(wordToken));
        
        // 2. Deploy Fee Vault
        FeeVault feeVault = new FeeVault(address(wordToken));
        console2.log("FeeVault deployed:", address(feeVault));
        
        // 3. Deploy Word Duel game
        WordDuel wordDuel = new WordDuel(address(feeVault), CREATOR);
        console2.log("WordDuel deployed:", address(wordDuel));
        
        // 4. Configure
        wordToken.setFeeVault(address(feeVault));
        
        vm.stopBroadcast();
        
        console2.log("\n=== Deployment Complete ===");
        console2.log("WordToken:", address(wordToken));
        console2.log("FeeVault:", address(feeVault));
        console2.log("WordDuel:", address(wordDuel));
    }
}
