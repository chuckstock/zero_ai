// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {WordDuelArena} from "../src/WordDuelArena.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address feeVault = vm.envOr("FEE_VAULT", address(0));
        
        // Use empty merkle root for testing (disables word verification)
        bytes32 merkleRoot = bytes32(0);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // If no fee vault specified, use deployer
        if (feeVault == address(0)) {
            feeVault = vm.addr(deployerPrivateKey);
        }
        
        WordDuelArena arena = new WordDuelArena(feeVault, merkleRoot);
        
        console2.log("WordDuelArena deployed at:", address(arena));
        console2.log("Fee vault:", feeVault);
        console2.log("Merkle root:", vm.toString(merkleRoot));
        
        vm.stopBroadcast();
    }
}

contract CreateRoundScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address arenaAddress = vm.envAddress("ARENA_ADDRESS");
        
        // Word for this round
        bytes5 word = bytes5("CRANE"); // Good starting word
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, "round_salt"));
        bytes32 wordHash = keccak256(abi.encodePacked(word, salt));
        
        vm.startBroadcast(deployerPrivateKey);
        
        WordDuelArena arena = WordDuelArena(payable(arenaAddress));
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, wordHash);
        
        console2.log("Round created:", roundId);
        console2.log("Word hash:", vm.toString(wordHash));
        console2.log("Word:", string(abi.encodePacked(word)));
        console2.log("Salt:", vm.toString(salt));
        console2.log("IMPORTANT: Save word and salt for evaluation!");
        
        vm.stopBroadcast();
    }
}
