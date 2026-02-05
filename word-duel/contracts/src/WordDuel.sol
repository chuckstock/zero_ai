// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {WordList} from "./WordList.sol";

/// @title WordDuel
/// @notice PvP Wordle game with commit-reveal pattern
/// @author Zer0
contract WordDuel is ReentrancyGuard, Ownable {
    
    // ============ Constants ============
    
    uint256 public constant FEE_BPS = 1000; // 10% total fee
    uint256 public constant HOLDER_FEE_BPS = 500; // 5% to holders
    uint256 public constant CREATOR_FEE_BPS = 500; // 5% to creator
    uint256 public constant TURN_TIMEOUT = 30 seconds;
    uint256 public constant MAX_TURNS = 6;
    
    // ============ State ============
    
    address public immutable feeVault;
    address public immutable creator;
    
    uint256 public gameCounter;
    
    enum GameState { Open, Active, Finished, Cancelled }
    enum TurnPhase { Commit, Reveal }
    
    struct Game {
        uint256 id;
        address player1;
        address player2;
        uint256 entryFee;
        uint256 pot;
        bytes32 wordHash;       // Hash of the secret word
        GameState state;
        TurnPhase phase;
        uint8 currentTurn;
        uint256 turnDeadline;
        address winner;
    }
    
    struct PlayerState {
        bytes32 commitHash;     // hash(guess + salt)
        bytes5 revealedGuess;
        bytes5 feedback;        // Color results
        uint8 guessCount;
        bool solved;
        uint256 solveTime;
    }
    
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => PlayerState)) public playerStates;
    
    // ============ Events ============
    
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 entryFee);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event GuessCommitted(uint256 indexed gameId, address indexed player);
    event GuessRevealed(uint256 indexed gameId, address indexed player, bytes5 guess, bytes5 feedback);
    event GameFinished(uint256 indexed gameId, address indexed winner, uint256 prize);
    event GameCancelled(uint256 indexed gameId);
    
    // ============ Constructor ============
    
    constructor(address _feeVault, address _creator) Ownable(msg.sender) {
        feeVault = _feeVault;
        creator = _creator;
    }
    
    // ============ Game Creation ============
    
    /// @notice Create a new game
    /// @param wordHash Hash of the secret word (committed by server/oracle)
    function createGame(bytes32 wordHash) external payable returns (uint256 gameId) {
        require(msg.value >= 0.001 ether, "Min entry 0.001 ETH");
        require(msg.value <= 1 ether, "Max entry 1 ETH");
        
        gameId = ++gameCounter;
        
        games[gameId] = Game({
            id: gameId,
            player1: msg.sender,
            player2: address(0),
            entryFee: msg.value,
            pot: msg.value,
            wordHash: wordHash,
            state: GameState.Open,
            phase: TurnPhase.Commit,
            currentTurn: 1,
            turnDeadline: 0,
            winner: address(0)
        });
        
        emit GameCreated(gameId, msg.sender, msg.value);
    }
    
    /// @notice Join an existing game
    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        
        require(game.state == GameState.Open, "Game not open");
        require(msg.value == game.entryFee, "Wrong entry fee");
        require(msg.sender != game.player1, "Can't play yourself");
        
        game.player2 = msg.sender;
        game.pot += msg.value;
        game.state = GameState.Active;
        game.turnDeadline = block.timestamp + TURN_TIMEOUT;
        
        emit GameJoined(gameId, msg.sender);
    }
    
    // ============ Gameplay ============
    
    /// @notice Commit a guess (hash of guess + salt)
    function commitGuess(uint256 gameId, bytes32 commitHash) external {
        Game storage game = games[gameId];
        PlayerState storage ps = playerStates[gameId][msg.sender];
        
        require(game.state == GameState.Active, "Game not active");
        require(game.phase == TurnPhase.Commit, "Not commit phase");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        require(ps.commitHash == bytes32(0), "Already committed");
        require(!ps.solved, "Already solved");
        
        ps.commitHash = commitHash;
        
        // Check if both committed
        PlayerState storage p1 = playerStates[gameId][game.player1];
        PlayerState storage p2 = playerStates[gameId][game.player2];
        
        if (p1.commitHash != bytes32(0) && p2.commitHash != bytes32(0)) {
            game.phase = TurnPhase.Reveal;
            game.turnDeadline = block.timestamp + TURN_TIMEOUT;
        }
        
        emit GuessCommitted(gameId, msg.sender);
    }
    
    /// @notice Reveal a guess with salt
    /// @param guess The 5-letter word guessed
    /// @param salt Random salt used in commit
    /// @param answer The actual answer (revealed by oracle after both commit)
    function revealGuess(
        uint256 gameId,
        bytes5 guess,
        bytes32 salt,
        bytes5 answer
    ) external {
        Game storage game = games[gameId];
        PlayerState storage ps = playerStates[gameId][msg.sender];
        
        require(game.state == GameState.Active, "Game not active");
        require(game.phase == TurnPhase.Reveal, "Not reveal phase");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        require(ps.revealedGuess == bytes5(0), "Already revealed");
        
        // Verify commit
        bytes32 expectedHash = keccak256(abi.encodePacked(guess, salt));
        require(expectedHash == ps.commitHash, "Invalid reveal");
        
        // Verify answer matches word hash
        require(keccak256(abi.encodePacked(answer)) == game.wordHash, "Invalid answer");
        
        // Score the guess
        bytes5 feedback = WordList.scoreGuess(guess, answer);
        
        ps.revealedGuess = guess;
        ps.feedback = feedback;
        ps.guessCount++;
        
        // Check if solved (all green = 0x0202020202)
        if (feedback == bytes5(0x0202020202)) {
            ps.solved = true;
            ps.solveTime = block.timestamp;
        }
        
        emit GuessRevealed(gameId, msg.sender, guess, feedback);
        
        // Check if both revealed
        PlayerState storage p1 = playerStates[gameId][game.player1];
        PlayerState storage p2 = playerStates[gameId][game.player2];
        
        if (p1.revealedGuess != bytes5(0) && p2.revealedGuess != bytes5(0)) {
            _processTurnEnd(gameId);
        }
    }
    
    // ============ Internal ============
    
    function _processTurnEnd(uint256 gameId) internal {
        Game storage game = games[gameId];
        PlayerState storage p1 = playerStates[gameId][game.player1];
        PlayerState storage p2 = playerStates[gameId][game.player2];
        
        // Check for winner
        if (p1.solved && p2.solved) {
            // Both solved - fewer guesses wins, then earlier time
            if (p1.guessCount < p2.guessCount) {
                _finishGame(gameId, game.player1);
            } else if (p2.guessCount < p1.guessCount) {
                _finishGame(gameId, game.player2);
            } else if (p1.solveTime < p2.solveTime) {
                _finishGame(gameId, game.player1);
            } else {
                _finishGame(gameId, game.player2);
            }
        } else if (p1.solved) {
            _finishGame(gameId, game.player1);
        } else if (p2.solved) {
            _finishGame(gameId, game.player2);
        } else if (game.currentTurn >= MAX_TURNS) {
            // Both failed - split pot (minus fees)
            _finishGameDraw(gameId);
        } else {
            // Next turn
            game.currentTurn++;
            game.phase = TurnPhase.Commit;
            game.turnDeadline = block.timestamp + TURN_TIMEOUT;
            
            // Reset commits for next turn
            p1.commitHash = bytes32(0);
            p1.revealedGuess = bytes5(0);
            p2.commitHash = bytes32(0);
            p2.revealedGuess = bytes5(0);
        }
    }
    
    function _finishGame(uint256 gameId, address winner) internal {
        Game storage game = games[gameId];
        
        uint256 totalFee = (game.pot * FEE_BPS) / 10000;
        uint256 holderFee = (game.pot * HOLDER_FEE_BPS) / 10000;
        uint256 creatorFee = (game.pot * CREATOR_FEE_BPS) / 10000;
        uint256 prize = game.pot - totalFee;
        
        game.state = GameState.Finished;
        game.winner = winner;
        
        // Transfer fees
        payable(feeVault).transfer(holderFee);
        payable(creator).transfer(creatorFee);
        
        // Transfer prize
        payable(winner).transfer(prize);
        
        emit GameFinished(gameId, winner, prize);
    }
    
    function _finishGameDraw(uint256 gameId) internal {
        Game storage game = games[gameId];
        
        uint256 totalFee = (game.pot * FEE_BPS) / 10000;
        uint256 holderFee = (game.pot * HOLDER_FEE_BPS) / 10000;
        uint256 creatorFee = (game.pot * CREATOR_FEE_BPS) / 10000;
        uint256 splitPrize = (game.pot - totalFee) / 2;
        
        game.state = GameState.Finished;
        
        // Transfer fees
        payable(feeVault).transfer(holderFee);
        payable(creator).transfer(creatorFee);
        
        // Split prize
        payable(game.player1).transfer(splitPrize);
        payable(game.player2).transfer(splitPrize);
        
        emit GameFinished(gameId, address(0), splitPrize);
    }
    
    // ============ Timeout Handling ============
    
    /// @notice Claim win if opponent times out
    function claimTimeout(uint256 gameId) external {
        Game storage game = games[gameId];
        
        require(game.state == GameState.Active, "Game not active");
        require(block.timestamp > game.turnDeadline, "Not timed out");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        
        address opponent = msg.sender == game.player1 ? game.player2 : game.player1;
        PlayerState storage myState = playerStates[gameId][msg.sender];
        PlayerState storage oppState = playerStates[gameId][opponent];
        
        // Check who timed out
        if (game.phase == TurnPhase.Commit) {
            // Opponent didn't commit in time
            require(oppState.commitHash == bytes32(0), "Opponent committed");
            require(myState.commitHash != bytes32(0), "You didn't commit either");
        } else {
            // Opponent didn't reveal in time
            require(oppState.revealedGuess == bytes5(0), "Opponent revealed");
            require(myState.revealedGuess != bytes5(0), "You didn't reveal either");
        }
        
        _finishGame(gameId, msg.sender);
    }
    
    // ============ Cancel ============
    
    /// @notice Cancel an open game (only creator)
    function cancelGame(uint256 gameId) external {
        Game storage game = games[gameId];
        
        require(game.state == GameState.Open, "Game not open");
        require(msg.sender == game.player1, "Not game creator");
        
        game.state = GameState.Cancelled;
        payable(game.player1).transfer(game.pot);
        
        emit GameCancelled(gameId);
    }
    
    // ============ Views ============
    
    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }
    
    function getPlayerState(uint256 gameId, address player) external view returns (PlayerState memory) {
        return playerStates[gameId][player];
    }
}
