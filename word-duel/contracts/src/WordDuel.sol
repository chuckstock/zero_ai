// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IFeeVault} from "./interfaces/IFeeVault.sol";
import {WordList} from "./WordList.sol";

/**
 * @title WordDuel
 * @author Bankrcade
 * @notice PvP word guessing game with commit-reveal pattern for fairness
 * @dev Factory pattern: each game is tracked in this contract (not separate deployments)
 *      Game flow: create → join → (commit → reveal)×6 → claim
 */
contract WordDuel is ReentrancyGuard, Pausable {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error GameNotFound();
    error GameAlreadyStarted();
    error GameNotStarted();
    error GameAlreadyComplete();
    error GameNotComplete();
    error NotPlayer();
    error NotYourTurn();
    error InvalidEntryFee();
    error InvalidCommitment();
    error InvalidReveal();
    error AlreadyCommitted();
    error NotCommitted();
    error AlreadyRevealed();
    error RoundNotComplete();
    error TooManyGuesses();
    error InvalidWord();
    error TransferFailed();
    error CannotJoinOwnGame();
    error WrongEntryFee();
    error TimeoutNotReached();
    error GameNotTimedOut();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 entryFee);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event GuessCommitted(uint256 indexed gameId, address indexed player, uint256 round);
    event GuessRevealed(uint256 indexed gameId, address indexed player, uint256 round, bytes5 guess, uint8 score);
    event RoundComplete(uint256 indexed gameId, uint256 round, uint8 score1, uint8 score2);
    event GameComplete(uint256 indexed gameId, address indexed winner, uint256 prize);
    event GameCancelled(uint256 indexed gameId);
    event GameTimedOut(uint256 indexed gameId, address indexed winner);

    /*//////////////////////////////////////////////////////////////
                              CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Maximum rounds per game (like Wordle's 6 guesses)
    uint256 public constant MAX_ROUNDS = 6;
    
    /// @notice Minimum entry fee (0.001 ETH)
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    
    /// @notice Maximum entry fee (10 ETH)
    uint256 public constant MAX_ENTRY_FEE = 10 ether;
    
    /// @notice Platform fee (5%)
    uint256 public constant FEE_BPS = 500;
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    /// @notice Timeout for commits/reveals (10 minutes)
    uint256 public constant ACTION_TIMEOUT = 10 minutes;
    
    /// @notice Timeout for joining a game (1 hour)
    uint256 public constant JOIN_TIMEOUT = 1 hours;

    /*//////////////////////////////////////////////////////////////
                                ENUMS
    //////////////////////////////////////////////////////////////*/
    
    enum GameState {
        None,           // Game doesn't exist
        WaitingForP2,   // Waiting for player 2 to join
        CommitPhase,    // Both players commit their guesses
        RevealPhase,    // Both players reveal their guesses
        Complete,       // Game finished
        Cancelled       // Game cancelled (refunded)
    }

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/
    
    struct Game {
        address player1;
        address player2;
        uint256 entryFee;
        uint256 pot;
        bytes5 targetWord1;         // P1's secret word (P2 guesses this)
        bytes5 targetWord2;         // P2's secret word (P1 guesses this)
        bytes32 targetHash1;        // Hash of P1's target word
        bytes32 targetHash2;        // Hash of P2's target word
        uint8 currentRound;
        uint8 score1;               // P1's cumulative score
        uint8 score2;               // P2's cumulative score
        GameState state;
        uint256 lastActionTime;     // For timeout handling
        bytes32 commitP1;           // P1's current round commitment
        bytes32 commitP2;           // P2's current round commitment
        bytes5 revealP1;            // P1's revealed guess
        bytes5 revealP2;            // P2's revealed guess
        bool p1Committed;
        bool p2Committed;
        bool p1Revealed;
        bool p2Revealed;
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Fee vault for distributing platform fees
    IFeeVault public immutable feeVault;
    
    /// @notice Word list validator
    WordList public immutable wordList;
    
    /// @notice Owner address
    address public owner;
    
    /// @notice Game counter
    uint256 public gameCount;
    
    /// @notice Mapping of game ID to game data
    mapping(uint256 => Game) public games;
    
    /// @notice Active games per player (for UI queries)
    mapping(address => uint256[]) public playerGames;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Deploys WordDuel with fee vault and word list
     * @param _feeVault Address of the FeeVault contract
     * @param _wordList Address of the WordList contract
     */
    constructor(address _feeVault, address _wordList) {
        feeVault = IFeeVault(_feeVault);
        wordList = WordList(_wordList);
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier gameExists(uint256 gameId) {
        if (games[gameId].state == GameState.None) revert GameNotFound();
        _;
    }
    
    modifier onlyPlayer(uint256 gameId) {
        Game storage game = games[gameId];
        if (msg.sender != game.player1 && msg.sender != game.player2) revert NotPlayer();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                          GAME LIFECYCLE
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Creates a new game with specified entry fee
     * @param targetWordHash Hash of the creator's secret word (keccak256(word, salt))
     * @return gameId The unique identifier for the game
     * @dev Entry fee is sent with the transaction
     */
    function createGame(bytes32 targetWordHash) external payable whenNotPaused nonReentrant returns (uint256 gameId) {
        if (msg.value < MIN_ENTRY_FEE || msg.value > MAX_ENTRY_FEE) revert InvalidEntryFee();
        if (targetWordHash == bytes32(0)) revert InvalidCommitment();
        
        gameId = ++gameCount;
        
        Game storage game = games[gameId];
        game.player1 = msg.sender;
        game.entryFee = msg.value;
        game.pot = msg.value;
        game.targetHash1 = targetWordHash;
        game.state = GameState.WaitingForP2;
        game.lastActionTime = block.timestamp;
        
        playerGames[msg.sender].push(gameId);
        
        emit GameCreated(gameId, msg.sender, msg.value);
    }
    
    /**
     * @notice Joins an existing game
     * @param gameId The game to join
     * @param targetWordHash Hash of the joiner's secret word
     * @dev Must send exact entry fee
     */
    function joinGame(uint256 gameId, bytes32 targetWordHash) 
        external 
        payable 
        gameExists(gameId) 
        whenNotPaused 
        nonReentrant 
    {
        Game storage game = games[gameId];
        
        if (game.state != GameState.WaitingForP2) revert GameAlreadyStarted();
        if (msg.sender == game.player1) revert CannotJoinOwnGame();
        if (msg.value != game.entryFee) revert WrongEntryFee();
        if (targetWordHash == bytes32(0)) revert InvalidCommitment();
        
        game.player2 = msg.sender;
        game.pot += msg.value;
        game.targetHash2 = targetWordHash;
        game.state = GameState.CommitPhase;
        game.currentRound = 1;
        game.lastActionTime = block.timestamp;
        
        playerGames[msg.sender].push(gameId);
        
        emit GameJoined(gameId, msg.sender);
    }
    
    /**
     * @notice Cancels a game that hasn't been joined
     * @param gameId The game to cancel
     * @dev Only callable by creator, refunds entry fee
     */
    function cancelGame(uint256 gameId) external gameExists(gameId) nonReentrant {
        Game storage game = games[gameId];
        
        if (game.state != GameState.WaitingForP2) revert GameAlreadyStarted();
        if (msg.sender != game.player1) revert NotPlayer();
        
        game.state = GameState.Cancelled;
        uint256 refund = game.pot;
        game.pot = 0;
        
        (bool success,) = game.player1.call{value: refund}("");
        if (!success) revert TransferFailed();
        
        emit GameCancelled(gameId);
    }

    /*//////////////////////////////////////////////////////////////
                         COMMIT-REVEAL PATTERN
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Commits a guess for the current round
     * @param gameId The game ID
     * @param guessHash Hash of (guess + salt)
     * @dev Both players must commit before reveals
     */
    function commitGuess(uint256 gameId, bytes32 guessHash) 
        external 
        gameExists(gameId) 
        onlyPlayer(gameId)
        whenNotPaused 
    {
        Game storage game = games[gameId];
        
        if (game.state != GameState.CommitPhase) revert NotYourTurn();
        if (guessHash == bytes32(0)) revert InvalidCommitment();
        
        bool isP1 = msg.sender == game.player1;
        
        if (isP1) {
            if (game.p1Committed) revert AlreadyCommitted();
            game.commitP1 = guessHash;
            game.p1Committed = true;
        } else {
            if (game.p2Committed) revert AlreadyCommitted();
            game.commitP2 = guessHash;
            game.p2Committed = true;
        }
        
        // If both committed, move to reveal phase
        if (game.p1Committed && game.p2Committed) {
            game.state = GameState.RevealPhase;
            game.lastActionTime = block.timestamp;
        }
        
        emit GuessCommitted(gameId, msg.sender, game.currentRound);
    }
    
    /**
     * @notice Reveals a committed guess
     * @param gameId The game ID
     * @param guess The actual guess word (bytes5)
     * @param salt The salt used in commitment
     * @param wordProof Merkle proof that guess is valid word
     * @dev Validates commitment hash and word validity
     */
    function revealGuess(
        uint256 gameId, 
        bytes5 guess, 
        bytes32 salt,
        bytes32[] calldata wordProof
    ) 
        external 
        gameExists(gameId) 
        onlyPlayer(gameId)
        nonReentrant 
    {
        Game storage game = games[gameId];
        
        if (game.state != GameState.RevealPhase) revert NotYourTurn();
        
        // Validate word is in list
        if (!wordList.isValidWord(guess, wordProof)) revert InvalidWord();
        
        bool isP1 = msg.sender == game.player1;
        bytes32 expectedHash = keccak256(abi.encodePacked(guess, salt));
        
        if (isP1) {
            if (!game.p1Committed) revert NotCommitted();
            if (game.p1Revealed) revert AlreadyRevealed();
            if (game.commitP1 != expectedHash) revert InvalidReveal();
            
            game.revealP1 = guess;
            game.p1Revealed = true;
            
            // Score P1's guess against P2's target word
            // (P1 is guessing P2's word)
            uint8 score = _scoreGuess(guess, game.targetWord2);
            
            emit GuessRevealed(gameId, msg.sender, game.currentRound, guess, score);
        } else {
            if (!game.p2Committed) revert NotCommitted();
            if (game.p2Revealed) revert AlreadyRevealed();
            if (game.commitP2 != expectedHash) revert InvalidReveal();
            
            game.revealP2 = guess;
            game.p2Revealed = true;
            
            // Score P2's guess against P1's target word
            uint8 score = _scoreGuess(guess, game.targetWord1);
            
            emit GuessRevealed(gameId, msg.sender, game.currentRound, guess, score);
        }
        
        // If both revealed, process round
        if (game.p1Revealed && game.p2Revealed) {
            _processRound(gameId);
        }
    }
    
    /**
     * @notice Sets the target word at game start (after join)
     * @param gameId The game ID
     * @param targetWord The secret word
     * @param salt Salt used in original hash
     * @param wordProof Merkle proof for word validity
     */
    function revealTargetWord(
        uint256 gameId,
        bytes5 targetWord,
        bytes32 salt,
        bytes32[] calldata wordProof
    )
        external
        gameExists(gameId)
        onlyPlayer(gameId)
    {
        Game storage game = games[gameId];
        
        // Can only reveal target after game starts but before any commits
        if (game.state != GameState.CommitPhase || game.currentRound != 1) revert NotYourTurn();
        
        // Validate word
        if (!wordList.isValidWord(targetWord, wordProof)) revert InvalidWord();
        
        bytes32 expectedHash = keccak256(abi.encodePacked(targetWord, salt));
        bool isP1 = msg.sender == game.player1;
        
        if (isP1) {
            if (game.targetHash1 != expectedHash) revert InvalidReveal();
            if (game.targetWord1 != bytes5(0)) revert AlreadyRevealed();
            game.targetWord1 = targetWord;
        } else {
            if (game.targetHash2 != expectedHash) revert InvalidReveal();
            if (game.targetWord2 != bytes5(0)) revert AlreadyRevealed();
            game.targetWord2 = targetWord;
        }
    }

    /*//////////////////////////////////////////////////////////////
                          ROUND PROCESSING
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Process completed round and check for game end
     * @param gameId The game ID
     */
    function _processRound(uint256 gameId) internal {
        Game storage game = games[gameId];
        
        // Calculate scores for this round
        uint8 roundScore1 = _scoreGuess(game.revealP1, game.targetWord2);
        uint8 roundScore2 = _scoreGuess(game.revealP2, game.targetWord1);
        
        game.score1 += roundScore1;
        game.score2 += roundScore2;
        
        emit RoundComplete(gameId, game.currentRound, roundScore1, roundScore2);
        
        // Check for perfect guess (5 = all green)
        bool p1Perfect = (roundScore1 == 25); // 5 letters × 5 points each for exact match
        bool p2Perfect = (roundScore2 == 25);
        
        // Check for game end conditions
        bool gameEnded = false;
        
        if (p1Perfect && p2Perfect) {
            // Both got perfect - it's a tie (rare!)
            gameEnded = true;
        } else if (p1Perfect) {
            // P1 wins
            gameEnded = true;
        } else if (p2Perfect) {
            // P2 wins
            gameEnded = true;
        } else if (game.currentRound >= MAX_ROUNDS) {
            // Max rounds reached - highest score wins
            gameEnded = true;
        }
        
        if (gameEnded) {
            _endGame(gameId);
        } else {
            // Setup next round
            game.currentRound++;
            game.state = GameState.CommitPhase;
            game.p1Committed = false;
            game.p2Committed = false;
            game.p1Revealed = false;
            game.p2Revealed = false;
            game.commitP1 = bytes32(0);
            game.commitP2 = bytes32(0);
            game.revealP1 = bytes5(0);
            game.revealP2 = bytes5(0);
            game.lastActionTime = block.timestamp;
        }
    }
    
    /**
     * @notice End game and distribute pot
     * @param gameId The game ID
     */
    function _endGame(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.state = GameState.Complete;
        
        address winner;
        uint256 prize = game.pot;
        
        // Calculate fee
        uint256 fee = (prize * FEE_BPS) / BPS_DENOMINATOR;
        uint256 winnerPrize = prize - fee;
        
        // Determine winner
        if (game.score1 > game.score2) {
            winner = game.player1;
        } else if (game.score2 > game.score1) {
            winner = game.player2;
        } else {
            // Tie - split pot (minus fees)
            winner = address(0); // indicates tie
            uint256 splitPrize = winnerPrize / 2;
            
            game.pot = 0;
            
            // Send fees to vault
            feeVault.depositFees{value: fee}();
            
            // Split between players
            (bool s1,) = game.player1.call{value: splitPrize}("");
            (bool s2,) = game.player2.call{value: splitPrize}("");
            if (!s1 || !s2) revert TransferFailed();
            
            emit GameComplete(gameId, address(0), splitPrize);
            return;
        }
        
        game.pot = 0;
        
        // Send fees to vault
        feeVault.depositFees{value: fee}();
        
        // Send prize to winner
        (bool success,) = winner.call{value: winnerPrize}("");
        if (!success) revert TransferFailed();
        
        emit GameComplete(gameId, winner, winnerPrize);
    }

    /*//////////////////////////////////////////////////////////////
                            SCORING
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Scores a guess against a target word
     * @param guess The guessed word
     * @param target The target word
     * @return score Total score (5 per exact match, 1 per partial)
     * @dev Wordle-style: green = exact position (5pts), yellow = wrong position (1pt)
     */
    function _scoreGuess(bytes5 guess, bytes5 target) internal pure returns (uint8 score) {
        if (target == bytes5(0)) return 0; // Target not yet revealed
        
        // Track which letters have been matched
        bool[5] memory targetUsed;
        bool[5] memory guessMatched;
        
        // First pass: exact matches (green)
        for (uint256 i = 0; i < 5;) {
            if (guess[i] == target[i]) {
                score += 5; // Exact match
                targetUsed[i] = true;
                guessMatched[i] = true;
            }
            unchecked { ++i; }
        }
        
        // Second pass: partial matches (yellow)
        for (uint256 i = 0; i < 5;) {
            if (!guessMatched[i]) {
                for (uint256 j = 0; j < 5;) {
                    if (!targetUsed[j] && guess[i] == target[j]) {
                        score += 1; // Partial match
                        targetUsed[j] = true;
                        break;
                    }
                    unchecked { ++j; }
                }
            }
            unchecked { ++i; }
        }
    }

    /*//////////////////////////////////////////////////////////////
                          TIMEOUT HANDLING
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Claims win via timeout if opponent hasn't acted
     * @param gameId The game ID
     * @dev Can be called if ACTION_TIMEOUT has passed since last action
     */
    function claimTimeout(uint256 gameId) external gameExists(gameId) onlyPlayer(gameId) nonReentrant {
        Game storage game = games[gameId];
        
        if (game.state == GameState.Complete || game.state == GameState.Cancelled) {
            revert GameAlreadyComplete();
        }
        
        if (block.timestamp < game.lastActionTime + ACTION_TIMEOUT) {
            revert TimeoutNotReached();
        }
        
        address winner;
        
        if (game.state == GameState.WaitingForP2) {
            // No one joined - creator can reclaim
            if (msg.sender != game.player1) revert NotPlayer();
            game.state = GameState.Cancelled;
            uint256 refund = game.pot;
            game.pot = 0;
            (bool success,) = game.player1.call{value: refund}("");
            if (!success) revert TransferFailed();
            emit GameCancelled(gameId);
            return;
        }
        
        if (game.state == GameState.CommitPhase) {
            // Someone didn't commit
            if (game.p1Committed && !game.p2Committed) {
                winner = game.player1;
            } else if (game.p2Committed && !game.p1Committed) {
                winner = game.player2;
            } else if (!game.p1Committed && !game.p2Committed) {
                // Neither committed - refund both
                game.state = GameState.Cancelled;
                uint256 half = game.pot / 2;
                game.pot = 0;
                (bool s1,) = game.player1.call{value: half}("");
                (bool s2,) = game.player2.call{value: half}("");
                if (!s1 || !s2) revert TransferFailed();
                emit GameCancelled(gameId);
                return;
            }
        } else if (game.state == GameState.RevealPhase) {
            // Someone didn't reveal
            if (game.p1Revealed && !game.p2Revealed) {
                winner = game.player1;
            } else if (game.p2Revealed && !game.p1Revealed) {
                winner = game.player2;
            }
        }
        
        if (winner == address(0)) revert GameNotTimedOut();
        
        game.state = GameState.Complete;
        uint256 prize = game.pot;
        uint256 fee = (prize * FEE_BPS) / BPS_DENOMINATOR;
        uint256 winnerPrize = prize - fee;
        game.pot = 0;
        
        feeVault.depositFees{value: fee}();
        (bool success,) = winner.call{value: winnerPrize}("");
        if (!success) revert TransferFailed();
        
        emit GameTimedOut(gameId, winner);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Gets full game state
     * @param gameId The game ID
     * @return Game struct with all data
     */
    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }
    
    /**
     * @notice Gets a player's active games
     * @param player The player address
     * @return Array of game IDs
     */
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    /**
     * @notice Gets current game state
     * @param gameId The game ID
     * @return state The current GameState
     */
    function getGameState(uint256 gameId) external view returns (GameState) {
        return games[gameId].state;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Pauses the contract
     * @dev Only affects new game creation and joins
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Transfers ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}
