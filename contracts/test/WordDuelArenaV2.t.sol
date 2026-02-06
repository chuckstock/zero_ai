// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {WordDuelArenaV2} from "../src/WordDuelArenaV2.sol";

contract WordDuelArenaV2Test is Test {
    WordDuelArenaV2 public arena;
    
    address public owner = address(1);
    address public feeVault = address(2);
    address public oracleSigner;
    uint256 public oraclePrivateKey = 0xA11CE;
    
    address public player1 = address(3);
    address public player2 = address(4);
    address public player3 = address(5);
    
    bytes5 public testWord = bytes5("APPLE");
    bytes32 public testSalt = keccak256("secret_salt");
    bytes32 public testWordHash;
    
    uint256 constant START_TIME = 1000; // Start from a known time
    
    function setUp() public {
        vm.warp(START_TIME);
        
        oracleSigner = vm.addr(oraclePrivateKey);
        
        vm.startPrank(owner);
        testWordHash = keccak256(abi.encodePacked(testWord, testSalt));
        
        arena = new WordDuelArenaV2(feeVault, oracleSigner, bytes32(0));
        
        vm.stopPrank();
        
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
    }
    
    // ============ Helper Functions ============
    
    function _createAndStartRound() internal returns (uint256) {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(owner);
        arena.startRound(roundId);
        
        return roundId;
    }
    
    function _signFeedback(
        uint256 roundId,
        address player,
        uint8 guessNum,
        uint40 feedback
    ) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(roundId, player, guessNum, feedback));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(oraclePrivateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }
    
    function _packFeedback(uint8[5] memory results) internal pure returns (uint40) {
        uint40 packed = 0;
        for (uint8 i = 0; i < 5; i++) {
            packed |= uint40(results[i]) << (i * 8);
        }
        return packed;
    }
    
    function _skipCommitPhase() internal {
        skip(50); // Skip past 45 second commit window
    }
    
    function _skipRevealPhase() internal {
        skip(50); // Skip past 45 second reveal window
    }
    
    function _skipFeedbackPhase() internal {
        skip(65); // Skip past 60 second feedback window
    }
    
    // ============ Basic Tests ============
    
    function test_CreateRound() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        assertEq(roundId, 1);
        
        WordDuelArenaV2.Round memory round = arena.getRound(roundId);
        assertEq(round.id, 1);
        assertEq(round.wordHash, testWordHash);
        assertEq(uint8(round.phase), uint8(WordDuelArenaV2.Phase.Registration));
    }
    
    function test_RegisterForRound() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        WordDuelArenaV2.PlayerState memory state = arena.getPlayerState(roundId, player1);
        assertTrue(state.registered);
        
        WordDuelArenaV2.Round memory round = arena.getRound(roundId);
        assertEq(round.playerCount, 1);
    }
    
    function test_CannotStartWithoutMinPlayers() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(owner);
        vm.expectRevert(WordDuelArenaV2.MinPlayersNotMet.selector);
        arena.startRound(roundId);
    }
    
    // ============ Oracle Feedback Tests ============
    
    function test_OracleFeedback() public {
        uint256 roundId = _createAndStartRound();
        
        // Player1 commits
        bytes5 guess = bytes5("CRANE");
        bytes32 salt = keccak256("player1_salt");
        bytes32 commitment = keccak256(abi.encodePacked(guess, salt));
        
        vm.prank(player1);
        arena.commitGuess(roundId, commitment);
        
        // Advance to reveal
        _skipCommitPhase();
        arena.advancePhase(roundId);
        
        // Player1 reveals
        vm.prank(player1);
        arena.revealGuess(roundId, guess, salt, new bytes32[](0));
        
        // Advance to awaiting feedback
        _skipRevealPhase();
        arena.advancePhase(roundId);
        
        // Oracle provides feedback
        uint8[5] memory results = [uint8(0), 0, 1, 0, 2];
        uint40 feedback = _packFeedback(results);
        
        bytes memory sig = _signFeedback(roundId, player1, 1, feedback);
        arena.submitFeedback(roundId, player1, 1, feedback, sig);
        
        WordDuelArenaV2.Commitment memory c = arena.getCommitment(roundId, player1, 1);
        assertTrue(c.feedbackReceived);
        assertEq(c.feedback, feedback);
    }
    
    function test_InvalidOracleSignatureFails() public {
        uint256 roundId = _createAndStartRound();
        
        bytes5 guess = bytes5("CRANE");
        bytes32 salt = keccak256("player1_salt");
        
        vm.prank(player1);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(guess, salt)));
        
        _skipCommitPhase();
        arena.advancePhase(roundId);
        
        vm.prank(player1);
        arena.revealGuess(roundId, guess, salt, new bytes32[](0));
        
        _skipRevealPhase();
        arena.advancePhase(roundId);
        
        uint40 feedback = 0;
        
        // Sign with wrong key
        uint256 wrongKey = 0xBAD;
        bytes32 messageHash = keccak256(abi.encodePacked(roundId, player1, uint8(1), feedback));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethSignedHash);
        bytes memory badSig = abi.encodePacked(r, s, v);
        
        vm.expectRevert(WordDuelArenaV2.InvalidOracleSignature.selector);
        arena.submitFeedback(roundId, player1, 1, feedback, badSig);
    }
    
    // ============ Win & Prize Tests ============
    
    function test_FullGameWithOracleFeedback() public {
        uint256 roundId = _createAndStartRound();
        
        // Both players commit
        bytes5 correctGuess = bytes5("APPLE");
        bytes32 salt1 = keccak256("p1_salt");
        
        vm.prank(player1);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(correctGuess, salt1)));
        
        bytes5 wrongGuess = bytes5("CRANE");
        bytes32 salt2 = keccak256("p2_salt");
        
        vm.prank(player2);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(wrongGuess, salt2)));
        
        // Advance to reveal
        _skipCommitPhase();
        arena.advancePhase(roundId);
        
        // Both reveal
        vm.prank(player1);
        arena.revealGuess(roundId, correctGuess, salt1, new bytes32[](0));
        
        vm.prank(player2);
        arena.revealGuess(roundId, wrongGuess, salt2, new bytes32[](0));
        
        // Advance to feedback
        _skipRevealPhase();
        arena.advancePhase(roundId);
        
        // Oracle: Player1 solved
        uint8[5] memory solved = [uint8(2), 2, 2, 2, 2];
        uint40 solvedFeedback = _packFeedback(solved);
        arena.submitFeedback(roundId, player1, 1, solvedFeedback, _signFeedback(roundId, player1, 1, solvedFeedback));
        
        // Oracle: Player2 partial
        uint8[5] memory partialResult = [uint8(0), 0, 1, 0, 2];
        uint40 partialFeedback = _packFeedback(partialResult);
        arena.submitFeedback(roundId, player2, 1, partialFeedback, _signFeedback(roundId, player2, 1, partialFeedback));
        
        // Check states
        WordDuelArenaV2.PlayerState memory p1 = arena.getPlayerState(roundId, player1);
        assertTrue(p1.solved);
        assertEq(p1.solvedAtGuess, 1);
        
        // Advance to complete
        _skipFeedbackPhase();
        arena.advancePhase(roundId);
        
        WordDuelArenaV2.Round memory round = arena.getRound(roundId);
        assertEq(uint8(round.phase), uint8(WordDuelArenaV2.Phase.Complete));
        assertEq(round.winnerCount, 1);
        
        // Finalize
        arena.finalizeRound(roundId);
        
        // Check claimable prize
        p1 = arena.getPlayerState(roundId, player1);
        assertEq(p1.claimablePrize, 0.019 ether);
        
        // Claim
        uint256 balanceBefore = player1.balance;
        vm.prank(player1);
        arena.claimPrize(roundId);
        
        assertEq(player1.balance - balanceBefore, 0.019 ether);
    }
    
    // ============ Security Tests ============
    
    function test_CannotDoubleFinalize() public {
        uint256 roundId = _createAndStartRound();
        
        // Run through all 6 guess rounds with no winners
        for (uint8 i = 0; i < 6; i++) {
            _skipCommitPhase();
            arena.advancePhase(roundId); // -> Reveal
            _skipRevealPhase();
            arena.advancePhase(roundId); // -> AwaitingFeedback
            _skipFeedbackPhase();
            arena.advancePhase(roundId); // -> Commit (or Complete if i==5)
        }
        
        // Now should be Complete
        WordDuelArenaV2.Round memory round = arena.getRound(roundId);
        assertEq(uint8(round.phase), uint8(WordDuelArenaV2.Phase.Complete));
        
        arena.finalizeRound(roundId);
        
        vm.expectRevert(WordDuelArenaV2.AlreadyFinalized.selector);
        arena.finalizeRound(roundId);
    }
    
    function test_CannotDoubleClaim() public {
        uint256 roundId = _createAndStartRound();
        
        // Player1 wins
        bytes5 guess = bytes5("APPLE");
        bytes32 salt = keccak256("salt");
        
        vm.prank(player1);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(guess, salt)));
        
        _skipCommitPhase();
        arena.advancePhase(roundId);
        
        vm.prank(player1);
        arena.revealGuess(roundId, guess, salt, new bytes32[](0));
        
        _skipRevealPhase();
        arena.advancePhase(roundId);
        
        uint8[5] memory solved = [uint8(2), 2, 2, 2, 2];
        uint40 feedback = _packFeedback(solved);
        arena.submitFeedback(roundId, player1, 1, feedback, _signFeedback(roundId, player1, 1, feedback));
        
        _skipFeedbackPhase();
        arena.advancePhase(roundId);
        
        arena.finalizeRound(roundId);
        
        vm.prank(player1);
        arena.claimPrize(roundId);
        
        vm.prank(player1);
        vm.expectRevert(WordDuelArenaV2.NoPrizeToClaim.selector);
        arena.claimPrize(roundId);
    }
    
    function test_EmergencyRefundAfterTimeout() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        // Don't start round, let it timeout
        skip(25 hours);
        
        uint256 balanceBefore = player1.balance;
        vm.prank(player1);
        arena.emergencyRefund(roundId);
        
        assertEq(player1.balance - balanceBefore, 0.01 ether);
    }
    
    function test_CannotEmergencyRefundBeforeTimeout() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(player1);
        vm.expectRevert(WordDuelArenaV2.EmergencyTimeoutNotReached.selector);
        arena.emergencyRefund(roundId);
    }
    
    function test_OnlyOwnerCanStartRound() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(player1);
        vm.expectRevert();
        arena.startRound(roundId);
    }
    
    function test_RescueAccidentalETH() public {
        vm.deal(address(arena), 1 ether);
        
        assertEq(arena.totalActivePots(), 0);
        
        uint256 ownerBalanceBefore = owner.balance;
        vm.prank(owner);
        arena.rescueETH();
        
        assertEq(owner.balance - ownerBalanceBefore, 1 ether);
    }
    
    function test_CannotRescueActivePots() public {
        vm.prank(owner);
        uint256 roundId = arena.createRound(
            WordDuelArenaV2.Tier.Standard,
            testWordHash,
            new bytes32[](0)
        );
        
        vm.prank(player1);
        arena.register{value: 0.01 ether}(roundId);
        vm.prank(player2);
        arena.register{value: 0.01 ether}(roundId);
        
        vm.prank(owner);
        vm.expectRevert(WordDuelArenaV2.NothingToRescue.selector);
        arena.rescueETH();
    }
    
    function test_TiedWinnersSplitPot() public {
        uint256 roundId = _createAndStartRound();
        
        // Both commit correct answer
        bytes5 correctGuess = bytes5("APPLE");
        bytes32 salt1 = keccak256("p1_salt");
        bytes32 salt2 = keccak256("p2_salt");
        
        vm.prank(player1);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(correctGuess, salt1)));
        vm.prank(player2);
        arena.commitGuess(roundId, keccak256(abi.encodePacked(correctGuess, salt2)));
        
        _skipCommitPhase();
        arena.advancePhase(roundId);
        
        vm.prank(player1);
        arena.revealGuess(roundId, correctGuess, salt1, new bytes32[](0));
        vm.prank(player2);
        arena.revealGuess(roundId, correctGuess, salt2, new bytes32[](0));
        
        _skipRevealPhase();
        arena.advancePhase(roundId);
        
        // Both solved
        uint8[5] memory solved = [uint8(2), 2, 2, 2, 2];
        uint40 solvedFeedback = _packFeedback(solved);
        arena.submitFeedback(roundId, player1, 1, solvedFeedback, _signFeedback(roundId, player1, 1, solvedFeedback));
        arena.submitFeedback(roundId, player2, 1, solvedFeedback, _signFeedback(roundId, player2, 1, solvedFeedback));
        
        _skipFeedbackPhase();
        arena.advancePhase(roundId);
        
        WordDuelArenaV2.Round memory round = arena.getRound(roundId);
        assertEq(round.winnerCount, 2);
        
        arena.finalizeRound(roundId);
        
        // Each gets half
        WordDuelArenaV2.PlayerState memory p1 = arena.getPlayerState(roundId, player1);
        WordDuelArenaV2.PlayerState memory p2 = arena.getPlayerState(roundId, player2);
        
        // 0.02 ETH pot, 5% fee = 0.019 ETH prize pool, split = 0.0095 each
        assertEq(p1.claimablePrize, 0.0095 ether);
        assertEq(p2.claimablePrize, 0.0095 ether);
    }
}
