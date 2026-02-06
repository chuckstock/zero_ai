// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {WordDuelArenaV2} from "../src/WordDuelArenaV2.sol";

contract DeployV2Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Fee vault = deployer for now
        address feeVault = deployer;
        
        // Oracle = deployer for now (backend will sign)
        address oracle = deployer;
        
        // Use empty merkle root for testing
        bytes32 merkleRoot = bytes32(0);
        
        vm.startBroadcast(deployerPrivateKey);
        
        WordDuelArenaV2 arena = new WordDuelArenaV2(feeVault, oracle, merkleRoot);
        
        console2.log("WordDuelArenaV2 deployed at:", address(arena));
        console2.log("Fee vault:", feeVault);
        console2.log("Oracle:", oracle);
        console2.log("Merkle root:", vm.toString(merkleRoot));
        
        vm.stopBroadcast();
    }
}
