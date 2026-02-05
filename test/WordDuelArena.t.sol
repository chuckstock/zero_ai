// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {WordDuelArena} from "../src/WordDuelArena.sol";

contract WordDuelArenaTest is Test {
    WordDuelArena public arena;
    
    address public owner = address(1);
    address public feeVault = address(2);
    address public player1 = address(3);
    address public player2 = address(4);
    address public player3 = address(5);
    
    bytes5 public testWord = bytes5("APPLE");
    bytes32 public testSalt = keccak256("secret_salt");
    bytes32 public testWordHash;
    
    function setUp() public {
        vm.startPrank(owner);
        
        testWordHash = keccak256(abi.encodePacked(testWord, testSalt));
        
        // Deploy with empty merkle root (disables word verification for testing)
        arena = new WordDuelArena(feeVault, bytes32(0));
        
        vm.stopPrank();
        
        // Fund players
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
    }
    
    function test_CreateRound() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        assertEq(roundId, 1);
        
        WordDuelArena.Round memory round = arena.getRound(roundId);
        assertEq(round.id, 1);
        assertEq(round.wordHash, testWordHash);
        assertEq(uint8(round.phase), uint8(WordDuelArena.Phase.Registration));
        assertEq(uint8(round.tier), uint8(WordDuelArena.Tier.Standard));
    }
    
    function test_RegisterForRound() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        WordDuelArena.PlayerState memory state = arena.getPlayerState(roundId, player1);
        assertTrue(state.registered);
        
        WordDuelArena.Round memory round = arena.getRound(roundId);
        assertEq(round.playerCount, 1);
        assertEq(round.pot, 0.01 ether);
    }
    
    function test_MultiplePlayersRegister() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(player3);
        arena.register{value: 0.01 ether}(roundId);
        
        WordDuelArena.Round memory round = arena.getRound(roundId);
        assertEq(round.playerCount, 3);
        assertEq(round.pot, 0.03 ether);
    }
    
    function test_FullGameFlow_SingleWinner() public {
        // Create round
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        // Players register
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        // Start round
        vm.prank(owner);
        arena.startRound(roundId);
        
        // === GUESS 1 ===
        
        // Both players commit
        bytes5 guess1_p1 = bytes5("APPLE"); // Correct!
        bytes5 guess1_p2 = bytes5("TRAIN"); // Wrong
        bytes32 salt1_p1 = keccak256("p1_salt_1");
        bytes32 salt1_p2 = keccak256("p2_salt_1");
        
        vm.prank(player1);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(guess1_p1, salt1_p1)));
        
        vm.prank(player2);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(guess1_p2, salt1_p2)));
        
        // Advance to reveal phase
        vm.warp(block.timestamp + 46 seconds);
        arena.advancePhase(roundId);
        
        // Both players reveal
        vm.prank(player1);
        arena.revealGuess(roundId, guess1_p1, salt1_p1, new bytes32[](0));
        
        vm.prank(player2);
        arena.revealGuess(roundId, guess1_p2, salt1_p2, new bytes32[](0));
        
        // Advance to evaluation
        vm.warp(block.timestamp + 46 seconds);
        arena.advancePhase(roundId);
        
        // Evaluate
        vm.prank(owner);
        arena.evaluateRound(roundId, testWord, testSalt);
        
        // Check player1 won
        WordDuelArena.PlayerState memory p1State = arena.getPlayerState(roundId, player1);
        assertTrue(p1State.solved);
        assertEq(p1State.solvedAtGuess, 1);
        
        WordDuelArena.PlayerState memory p2State = arena.getPlayerState(roundId, player2);
        assertFalse(p2State.solved);
        
        // Advance to complete
        arena.advancePhase(roundId);
        
        WordDuelArena.Round memory round = arena.getRound(roundId);
        assertEq(uint8(round.phase), uint8(WordDuelArena.Phase.Complete));
        assertEq(round.winnerCount, 1);
        
        // Finalize and check prize distribution
        uint256 p1BalanceBefore = player1.balance;
        arena.finalizeRound(roundId);
        uint256 p1BalanceAfter = player1.balance;
        
        // Prize should be 95% of 0.02 ETH = 0.019 ETH
        assertEq(p1BalanceAfter - p1BalanceBefore, 0.019 ether);
        
        // Fee vault should have 5%
        assertEq(feeVault.balance, 0.001 ether);
    }
    
    function test_TiedWinners_SplitPot() public {
        // Create round
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        // Players register
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        // Start round
        vm.prank(owner);
        arena.startRound(roundId);
        
        // === GUESS 1 - Both guess correct! ===
        bytes5 correctGuess = bytes5("APPLE");
        bytes32 salt_p1 = keccak256("p1_salt");
        bytes32 salt_p2 = keccak256("p2_salt");
        
        vm.prank(player1);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(correctGuess, salt_p1)));
        
        vm.prank(player2);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(correctGuess, salt_p2)));
        
        // Advance to reveal
        vm.warp(block.timestamp + 46 seconds);
        arena.advancePhase(roundId);
        
        // Both reveal
        vm.prank(player1);
        arena.revealGuess(roundId, correctGuess, salt_p1, new bytes32[](0));
        
        vm.prank(player2);
        arena.revealGuess(roundId, correctGuess, salt_p2, new bytes32[](0));
        
        // Advance to evaluation
        vm.warp(block.timestamp + 46 seconds);
        arena.advancePhase(roundId);
        
        // Evaluate
        vm.prank(owner);
        arena.evaluateRound(roundId, testWord, testSalt);
        
        // Both should have won
        WordDuelArena.PlayerState memory p1State = arena.getPlayerState(roundId, player1);
        WordDuelArena.PlayerState memory p2State = arena.getPlayerState(roundId, player2);
        assertTrue(p1State.solved);
        assertTrue(p2State.solved);
        
        // Advance to complete
        arena.advancePhase(roundId);
        
        WordDuelArena.Round memory round = arena.getRound(roundId);
        assertEq(round.winnerCount, 2);
        
        // Finalize
        uint256 p1BalanceBefore = player1.balance;
        uint256 p2BalanceBefore = player2.balance;
        arena.finalizeRound(roundId);
        
        // Each should get half of 95% = 0.0095 ETH
        assertEq(player1.balance - p1BalanceBefore, 0.0095 ether);
        assertEq(player2.balance - p2BalanceBefore, 0.0095 ether);
    }
    
    function test_NoWinner_PotRollover() public {
        // Create round
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        // Player registers
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        // Start round
        vm.prank(owner);
        arena.startRound(roundId);
        
        // Simulate 6 wrong guesses
        bytes5[6] memory wrongGuesses = [
            bytes5("TRAIN"),
            bytes5("GHOST"),
            bytes5("BRAIN"),
            bytes5("CRANE"),
            bytes5("FLAME"),
            bytes5("PLANE")
        ];
        
        for (uint8 i = 0; i < 6; i++) {
            bytes32 salt = keccak256(abi.encodePacked("salt", i));
            
            // Commit
            vm.prank(player1);
            arena.commitGuess(roundId, keccak256(abi.encodePacked(wrongGuesses[i], salt)));
            
            // Advance to reveal
            vm.warp(block.timestamp + 46 seconds);
            arena.advancePhase(roundId);
            
            // Reveal
            vm.prank(player1);
            arena.revealGuess(roundId, wrongGuesses[i], salt, new bytes32[](0));
            
            // Advance to evaluation
            vm.warp(block.timestamp + 46 seconds);
            arena.advancePhase(roundId);
            
            // Evaluate
            vm.prank(owner);
            arena.evaluateRound(roundId, testWord, testSalt);
            
            // Advance (either to next commit or complete)
            arena.advancePhase(roundId);
        }
        
        // Should be complete now
        WordDuelArena.Round memory round = arena.getRound(roundId);
        assertEq(uint8(round.phase), uint8(WordDuelArena.Phase.Complete));
        assertEq(round.winnerCount, 0);
        
        // Finalize
        arena.finalizeRound(roundId);
        
        // Rollover pot should have 95% of entry
        assertEq(arena.rolloverPots(WordDuelArena.Tier.Standard), 0.0095 ether);
    }
    
    function test_CannotRegisterTwice() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        vm.startPrank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.expectRevert(WordDuelArena.AlreadyRegistered.selector);
        arena.register{value: 0.01 ether}(roundId);
        vm.stopPrank();
    }
    
    function test_CannotCommitAfterDeadline() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(owner);
        arena.startRound(roundId);
        
        // Warp past commit window
        vm.warp(block.timestamp + 1 hours);
        
        vm.prank(player1);
        vm.expectRevert(WordDuelArena.CommitWindowClosed.selector);
        arena.commitGuess(roundId, keccak256("test"));
    }
    
    function test_InvalidRevealFails() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(WordDuelArena.Tier.Standard, testWordHash);
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(owner);
        arena.startRound(roundId);
        
        // Commit with one guess
        bytes5 guess = bytes5("APPLE");
        bytes32 salt = keccak256("real_salt");
        
        vm.prank(player1);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(guess, salt)));
        
        // Advance to reveal
        vm.warp(block.timestamp + 46 seconds);
        arena.advancePhase(roundId);
        
        // Try to reveal with wrong salt
        vm.prank(player1);
        vm.expectRevert(WordDuelArena.InvalidReveal.selector);
        arena.revealGuess(roundId, guess, keccak256("wrong_salt"), new bytes32[](0));
    }
}
