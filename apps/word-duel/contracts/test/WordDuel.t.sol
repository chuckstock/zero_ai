// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {WordToken} from "../src/WordToken.sol";
import {FeeVault} from "../src/FeeVault.sol";
import {WordList} from "../src/WordList.sol";
import {WordDuel} from "../src/WordDuel.sol";

contract WordDuelTest is Test {
    WordToken public wordToken;
    FeeVault public feeVault;
    WordList public wordList;
    WordDuel public wordDuel;

    address public owner = address(1);
    address public player1 = address(2);
    address public player2 = address(3);
    address public creator = 0x742d35Cc6634C0532925a3b844Bc9e7595f8fE18;

    // Test words and salts
    bytes5 public constant WORD_CRANE = bytes5("crane");
    bytes5 public constant WORD_SLATE = bytes5("slate");
    bytes5 public constant WORD_AUDIO = bytes5("audio");
    bytes32 public constant SALT1 = keccak256("salt1");
    bytes32 public constant SALT2 = keccak256("salt2");

    // Mock merkle root that accepts any word (for testing)
    bytes32 public constant MOCK_ROOT = bytes32(uint256(1));

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy contracts
        wordToken = new WordToken(owner);
        feeVault = new FeeVault(address(wordToken));
        wordList = new MockWordList(MOCK_ROOT);
        wordDuel = new WordDuel(address(feeVault), address(wordList));
        
        // Configure
        feeVault.setWordDuel(address(wordDuel));
        
        // Fund players
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
        
        // Give some tokens to players for staking tests
        wordToken.transfer(player1, 1000 * 10**18);
        wordToken.transfer(player2, 1000 * 10**18);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            TOKEN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TokenDeployment() public view {
        assertEq(wordToken.name(), "Word Duel");
        assertEq(wordToken.symbol(), "WORD");
        assertEq(wordToken.totalSupply(), 1_000_000_000 * 10**18);
    }

    function test_Staking() public {
        vm.startPrank(player1);
        
        uint256 stakeAmount = 100 * 10**18;
        wordToken.stake(stakeAmount);
        
        assertEq(wordToken.stakedBalanceOf(player1), stakeAmount);
        assertEq(wordToken.totalStaked(), stakeAmount);
        
        vm.stopPrank();
    }

    function test_Unstaking() public {
        vm.startPrank(player1);
        
        uint256 stakeAmount = 100 * 10**18;
        wordToken.stake(stakeAmount);
        wordToken.unstake(stakeAmount);
        
        assertEq(wordToken.stakedBalanceOf(player1), 0);
        assertEq(wordToken.totalStaked(), 0);
        
        vm.stopPrank();
    }

    function test_RevertUnstakeInsufficientBalance() public {
        vm.startPrank(player1);
        
        wordToken.stake(100 * 10**18);
        
        vm.expectRevert(WordToken.InsufficientStakedBalance.selector);
        wordToken.unstake(200 * 10**18);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                          GAME CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreateGame() public {
        vm.prank(player1);
        
        bytes32 targetHash = keccak256(abi.encodePacked(WORD_CRANE, SALT1));
        uint256 gameId = wordDuel.createGame{value: 0.1 ether}(targetHash);
        
        assertEq(gameId, 1);
        assertEq(uint8(wordDuel.getGameState(gameId)), uint8(WordDuel.GameState.WaitingForP2));
    }

    function test_RevertCreateGameInvalidFee() public {
        vm.prank(player1);
        
        bytes32 targetHash = keccak256(abi.encodePacked(WORD_CRANE, SALT1));
        
        vm.expectRevert(WordDuel.InvalidEntryFee.selector);
        wordDuel.createGame{value: 0.0001 ether}(targetHash); // Below minimum
    }

    function test_JoinGame() public {
        // Create game
        vm.prank(player1);
        bytes32 targetHash1 = keccak256(abi.encodePacked(WORD_CRANE, SALT1));
        uint256 gameId = wordDuel.createGame{value: 0.1 ether}(targetHash1);
        
        // Join game
        vm.prank(player2);
        bytes32 targetHash2 = keccak256(abi.encodePacked(WORD_SLATE, SALT2));
        wordDuel.joinGame{value: 0.1 ether}(gameId, targetHash2);
        
        assertEq(uint8(wordDuel.getGameState(gameId)), uint8(WordDuel.GameState.CommitPhase));
    }

    function test_RevertJoinOwnGame() public {
        vm.startPrank(player1);
        
        bytes32 targetHash1 = keccak256(abi.encodePacked(WORD_CRANE, SALT1));
        uint256 gameId = wordDuel.createGame{value: 0.1 ether}(targetHash1);
        
        vm.expectRevert(WordDuel.CannotJoinOwnGame.selector);
        wordDuel.joinGame{value: 0.1 ether}(gameId, targetHash1);
        
        vm.stopPrank();
    }

    function test_CancelGame() public {
        vm.startPrank(player1);
        
        bytes32 targetHash = keccak256(abi.encodePacked(WORD_CRANE, SALT1));
        uint256 gameId = wordDuel.createGame{value: 0.1 ether}(targetHash);
        
        uint256 balanceBefore = player1.balance;
        wordDuel.cancelGame(gameId);
        
        assertEq(uint8(wordDuel.getGameState(gameId)), uint8(WordDuel.GameState.Cancelled));
        assertEq(player1.balance, balanceBefore + 0.1 ether);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        COMMIT-REVEAL TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CommitGuess() public {
        // Setup game
        (uint256 gameId,) = _setupGame();
        
        // Commit guesses
        vm.prank(player1);
        bytes32 guessHash1 = keccak256(abi.encodePacked(WORD_AUDIO, SALT1));
        wordDuel.commitGuess(gameId, guessHash1);
        
        // State should still be CommitPhase until both commit
        assertEq(uint8(wordDuel.getGameState(gameId)), uint8(WordDuel.GameState.CommitPhase));
        
        vm.prank(player2);
        bytes32 guessHash2 = keccak256(abi.encodePacked(WORD_AUDIO, SALT2));
        wordDuel.commitGuess(gameId, guessHash2);
        
        // Now should be RevealPhase
        assertEq(uint8(wordDuel.getGameState(gameId)), uint8(WordDuel.GameState.RevealPhase));
    }

    function test_RevertDoubleCommit() public {
        (uint256 gameId,) = _setupGame();
        
        vm.startPrank(player1);
        bytes32 guessHash = keccak256(abi.encodePacked(WORD_AUDIO, SALT1));
        wordDuel.commitGuess(gameId, guessHash);
        
        vm.expectRevert(WordDuel.AlreadyCommitted.selector);
        wordDuel.commitGuess(gameId, guessHash);
        
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                          FEE VAULT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_FeeDistribution() public {
        // Setup: player1 stakes tokens
        vm.prank(player1);
        wordToken.stake(100 * 10**18);
        
        // Simulate fee deposit (normally from WordDuel)
        vm.prank(address(wordDuel));
        feeVault.depositFees{value: 1 ether}();
        
        // Check distribution (50/50 split)
        assertEq(feeVault.claimable(player1), 0.5 ether);
        assertEq(feeVault.creatorBalance(), 0.5 ether);
    }

    function test_StakerClaim() public {
        // Setup staker
        vm.prank(player1);
        wordToken.stake(100 * 10**18);
        
        // Deposit fees
        vm.deal(address(wordDuel), 1 ether);
        vm.prank(address(wordDuel));
        feeVault.depositFees{value: 1 ether}();
        
        // Claim
        uint256 balanceBefore = player1.balance;
        vm.prank(player1);
        feeVault.claim();
        
        assertEq(player1.balance, balanceBefore + 0.5 ether);
        assertEq(feeVault.claimable(player1), 0);
    }

    function test_CreatorWithdraw() public {
        // Deposit fees
        vm.deal(address(wordDuel), 1 ether);
        vm.prank(address(wordDuel));
        feeVault.depositFees{value: 1 ether}();
        
        // Creator withdraw (no stakers, so gets 100%)
        uint256 balanceBefore = creator.balance;
        vm.prank(creator);
        feeVault.creatorWithdraw();
        
        assertGt(creator.balance, balanceBefore);
    }

    function test_ProportionalDistribution() public {
        // Player1 stakes 75%, Player2 stakes 25%
        vm.prank(player1);
        wordToken.stake(750 * 10**18);
        
        vm.prank(player2);
        wordToken.stake(250 * 10**18);
        
        // Deposit fees
        vm.deal(address(wordDuel), 2 ether);
        vm.prank(address(wordDuel));
        feeVault.depositFees{value: 2 ether}();
        
        // Staker share is 1 ether (50% of 2 ether)
        // Player1 should get 75% = 0.75 ether
        // Player2 should get 25% = 0.25 ether
        assertEq(feeVault.claimable(player1), 0.75 ether);
        assertEq(feeVault.claimable(player2), 0.25 ether);
    }

    /*//////////////////////////////////////////////////////////////
                          TIMEOUT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TimeoutOnNoJoin() public {
        vm.prank(player1);
        bytes32 targetHash = keccak256(abi.encodePacked(WORD_CRANE, SALT1));
        uint256 gameId = wordDuel.createGame{value: 0.1 ether}(targetHash);
        
        // Fast forward past timeout
        vm.warp(block.timestamp + 11 minutes);
        
        uint256 balanceBefore = player1.balance;
        vm.prank(player1);
        wordDuel.claimTimeout(gameId);
        
        assertEq(uint8(wordDuel.getGameState(gameId)), uint8(WordDuel.GameState.Cancelled));
        assertEq(player1.balance, balanceBefore + 0.1 ether);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPERS
    //////////////////////////////////////////////////////////////*/

    function _setupGame() internal returns (uint256 gameId, bytes32[] memory emptyProof) {
        emptyProof = new bytes32[](0);
        
        // Create game
        vm.prank(player1);
        bytes32 targetHash1 = keccak256(abi.encodePacked(WORD_CRANE, SALT1));
        gameId = wordDuel.createGame{value: 0.1 ether}(targetHash1);
        
        // Join game
        vm.prank(player2);
        bytes32 targetHash2 = keccak256(abi.encodePacked(WORD_SLATE, SALT2));
        wordDuel.joinGame{value: 0.1 ether}(gameId, targetHash2);
        
        // Reveal target words
        vm.prank(player1);
        wordDuel.revealTargetWord(gameId, WORD_CRANE, SALT1, emptyProof);
        
        vm.prank(player2);
        wordDuel.revealTargetWord(gameId, WORD_SLATE, SALT2, emptyProof);
    }
}

/**
 * @dev Mock WordList that accepts any word (for testing)
 */
contract MockWordList is WordList {
    constructor(bytes32 _root) WordList(_root) {}
    
    function isValidWord(bytes5, bytes32[] calldata) external pure override returns (bool) {
        return true;
    }
    
    function isValidWordString(string calldata, bytes32[] calldata) external pure override returns (bool) {
        return true;
    }
}
