// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title WordDuelArena
 * @notice Multiplayer word-guessing game with commit-reveal mechanics
 * @dev All players compete on the same word simultaneously. Fairness enforced via commit-reveal.
 */
contract WordDuelArena is Ownable, ReentrancyGuard {
    
    // ============ Constants ============
    
    uint8 public constant MAX_GUESSES = 6;
    uint8 public constant WORD_LENGTH = 5;
    uint16 public constant PROTOCOL_FEE_BPS = 500; // 5%
    uint256 public constant MAX_PLAYERS_PER_ROUND = 100;
    
    // ============ Enums ============
    
    enum Tier { Sprint, Standard, HighRoller }
    enum Phase { Registration, Commit, Reveal, Evaluation, Complete }
    enum LetterResult { Absent, Present, Correct }
    
    // ============ Structs ============
    
    struct TierConfig {
        uint256 entryFee;
        uint256 roundDuration;      // Total round time
        uint256 commitWindow;       // Time to commit each guess
        uint256 revealWindow;       // Time to reveal each guess
        bool active;
    }
    
    struct Round {
        uint256 id;
        Tier tier;
        bytes32 wordHash;           // keccak256(word || salt) - published at start
        bytes32 wordSalt;           // Revealed at end
        bytes5 word;                // Revealed at end
        
        uint256 pot;
        uint256 startTime;
        uint256 phaseDeadline;
        uint256 playerCount;
        
        Phase phase;
        uint8 currentGuess;         // 1-6 (0 = not started)
        
        uint8 winningGuessNum;      // Which guess # solved first (0 = none yet)
        uint256 winnerCount;
        uint256 rolloverPot;        // Pot from previous round(s) with no winner
    }
    
    struct PlayerState {
        bool registered;
        bool solved;
        uint8 solvedAtGuess;        // 1-6, or 0 if not solved
        uint8 guessCount;           // How many guesses submitted
    }
    
    struct Commitment {
        bytes32 hash;
        uint256 timestamp;
        bool revealed;
        bytes5 guess;
    }
    
    // ============ State ============
    
    // Tier configurations
    mapping(Tier => TierConfig) public tierConfigs;
    
    // Round data
    mapping(uint256 => Round) public rounds;
    uint256 public roundCounter;
    
    // Current active round per tier
    mapping(Tier => uint256) public currentRoundByTier;
    
    // Player state per round
    mapping(uint256 => mapping(address => PlayerState)) public playerStates;
    
    // Player commitments: roundId => player => guessNum => Commitment
    mapping(uint256 => mapping(address => mapping(uint8 => Commitment))) public commitments;
    
    // Player list per round
    mapping(uint256 => address[]) public roundPlayers;
    
    // Winners per round
    mapping(uint256 => address[]) public roundWinners;
    
    // Word list Merkle root
    bytes32 public merkleRoot;
    
    // Fee vault
    address public feeVault;
    
    // Rollover pots per tier
    mapping(Tier => uint256) public rolloverPots;
    
    // ============ Events ============
    
    event TierConfigured(Tier indexed tier, uint256 entryFee, uint256 commitWindow, uint256 revealWindow);
    event RoundCreated(uint256 indexed roundId, Tier indexed tier, bytes32 wordHash, uint256 startTime);
    event PlayerRegistered(uint256 indexed roundId, address indexed player, uint256 pot);
    event PhaseAdvanced(uint256 indexed roundId, Phase phase, uint8 guessNum, uint256 deadline);
    event GuessCommitted(uint256 indexed roundId, address indexed player, uint8 guessNum);
    event GuessRevealed(uint256 indexed roundId, address indexed player, uint8 guessNum, bytes5 guess, uint8 correctCount);
    event PlayerSolved(uint256 indexed roundId, address indexed player, uint8 guessNum);
    event RoundComplete(uint256 indexed roundId, bytes5 word, uint256 winnerCount, uint256 prizePerWinner);
    event PotRollover(Tier indexed tier, uint256 amount, uint256 nextRoundId);
    
    // ============ Errors ============
    
    error InvalidTier();
    error TierNotActive();
    error RoundNotInPhase(Phase expected, Phase actual);
    error AlreadyRegistered();
    error IncorrectEntryFee();
    error MaxPlayersReached();
    error NotRegistered();
    error AlreadyCommitted();
    error CommitWindowClosed();
    error NotCommitted();
    error AlreadyRevealed();
    error RevealWindowClosed();
    error InvalidReveal();
    error PlayerAlreadySolved();
    error PhaseNotComplete();
    error InvalidWordProof();
    error RoundNotComplete();
    
    // ============ Constructor ============
    
    constructor(address _feeVault, bytes32 _merkleRoot) Ownable(msg.sender) {
        feeVault = _feeVault;
        merkleRoot = _merkleRoot;
        
        // Default tier configs
        tierConfigs[Tier.Sprint] = TierConfig({
            entryFee: 0.001 ether,
            roundDuration: 15 minutes,
            commitWindow: 30 seconds,
            revealWindow: 30 seconds,
            active: true
        });
        
        tierConfigs[Tier.Standard] = TierConfig({
            entryFee: 0.01 ether,
            roundDuration: 1 hours,
            commitWindow: 45 seconds,
            revealWindow: 45 seconds,
            active: true
        });
        
        tierConfigs[Tier.HighRoller] = TierConfig({
            entryFee: 0.1 ether,
            roundDuration: 6 hours,
            commitWindow: 60 seconds,
            revealWindow: 60 seconds,
            active: false  // Disabled initially
        });
    }
    
    // ============ Admin Functions ============
    
    function setTierConfig(
        Tier tier,
        uint256 entryFee,
        uint256 roundDuration,
        uint256 commitWindow,
        uint256 revealWindow,
        bool active
    ) external onlyOwner {
        tierConfigs[tier] = TierConfig({
            entryFee: entryFee,
            roundDuration: roundDuration,
            commitWindow: commitWindow,
            revealWindow: revealWindow,
            active: active
        });
        emit TierConfigured(tier, entryFee, commitWindow, revealWindow);
    }
    
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }
    
    function setFeeVault(address _feeVault) external onlyOwner {
        feeVault = _feeVault;
    }
    
    // ============ Round Management ============
    
    /**
     * @notice Create a new round for a tier
     * @param tier The tier to create round for
     * @param wordHash Hash of the word (keccak256(word || salt))
     */
    function createRound(Tier tier, bytes32 wordHash) external onlyOwner returns (uint256) {
        TierConfig memory config = tierConfigs[tier];
        if (!config.active) revert TierNotActive();
        
        roundCounter++;
        uint256 roundId = roundCounter;
        
        rounds[roundId] = Round({
            id: roundId,
            tier: tier,
            wordHash: wordHash,
            wordSalt: bytes32(0),
            word: bytes5(0),
            pot: rolloverPots[tier],
            startTime: block.timestamp,
            phaseDeadline: block.timestamp + config.roundDuration, // Registration ends when round duration starts
            playerCount: 0,
            phase: Phase.Registration,
            currentGuess: 0,
            winningGuessNum: 0,
            winnerCount: 0,
            rolloverPot: rolloverPots[tier]
        });
        
        // Clear rollover pot (it's now in this round)
        rolloverPots[tier] = 0;
        
        // Set as current round for this tier
        currentRoundByTier[tier] = roundId;
        
        emit RoundCreated(roundId, tier, wordHash, block.timestamp);
        
        return roundId;
    }
    
    /**
     * @notice Register for a round
     * @param roundId The round to join
     */
    function register(uint256 roundId) external payable nonReentrant {
        Round storage round = rounds[roundId];
        if (round.id == 0) revert InvalidTier();
        if (round.phase != Phase.Registration) revert RoundNotInPhase(Phase.Registration, round.phase);
        if (playerStates[roundId][msg.sender].registered) revert AlreadyRegistered();
        if (round.playerCount >= MAX_PLAYERS_PER_ROUND) revert MaxPlayersReached();
        
        TierConfig memory config = tierConfigs[round.tier];
        if (msg.value != config.entryFee) revert IncorrectEntryFee();
        
        // Register player
        playerStates[roundId][msg.sender] = PlayerState({
            registered: true,
            solved: false,
            solvedAtGuess: 0,
            guessCount: 0
        });
        
        roundPlayers[roundId].push(msg.sender);
        round.playerCount++;
        round.pot += msg.value;
        
        emit PlayerRegistered(roundId, msg.sender, round.pot);
    }
    
    /**
     * @notice Start the first guess round (move from Registration to Commit)
     * @param roundId The round to start
     */
    function startRound(uint256 roundId) external {
        Round storage round = rounds[roundId];
        if (round.phase != Phase.Registration) revert RoundNotInPhase(Phase.Registration, round.phase);
        
        // Move to first commit phase
        round.phase = Phase.Commit;
        round.currentGuess = 1;
        round.phaseDeadline = block.timestamp + tierConfigs[round.tier].commitWindow;
        
        emit PhaseAdvanced(roundId, Phase.Commit, 1, round.phaseDeadline);
    }
    
    /**
     * @notice Advance to the next phase
     * @param roundId The round to advance
     */
    function advancePhase(uint256 roundId) external {
        Round storage round = rounds[roundId];
        TierConfig memory config = tierConfigs[round.tier];
        
        // Must be past deadline to advance
        if (block.timestamp < round.phaseDeadline) revert PhaseNotComplete();
        
        if (round.phase == Phase.Commit) {
            // Move to reveal
            round.phase = Phase.Reveal;
            round.phaseDeadline = block.timestamp + config.revealWindow;
            emit PhaseAdvanced(roundId, Phase.Reveal, round.currentGuess, round.phaseDeadline);
            
        } else if (round.phase == Phase.Reveal) {
            // Move to evaluation (instant, then either next commit or complete)
            round.phase = Phase.Evaluation;
            emit PhaseAdvanced(roundId, Phase.Evaluation, round.currentGuess, block.timestamp);
            
        } else if (round.phase == Phase.Evaluation) {
            // Check if round should end
            if (round.winningGuessNum > 0 || round.currentGuess >= MAX_GUESSES) {
                // Round complete
                round.phase = Phase.Complete;
                emit PhaseAdvanced(roundId, Phase.Complete, round.currentGuess, block.timestamp);
            } else {
                // Next guess round
                round.currentGuess++;
                round.phase = Phase.Commit;
                round.phaseDeadline = block.timestamp + config.commitWindow;
                emit PhaseAdvanced(roundId, Phase.Commit, round.currentGuess, round.phaseDeadline);
            }
        }
    }
    
    // ============ Player Actions ============
    
    /**
     * @notice Commit a guess hash
     * @param roundId The round
     * @param commitment keccak256(abi.encodePacked(guess, salt))
     */
    function commitGuess(uint256 roundId, bytes32 commitment) external {
        Round storage round = rounds[roundId];
        PlayerState storage player = playerStates[roundId][msg.sender];
        
        if (!player.registered) revert NotRegistered();
        if (round.phase != Phase.Commit) revert RoundNotInPhase(Phase.Commit, round.phase);
        if (block.timestamp > round.phaseDeadline) revert CommitWindowClosed();
        if (player.solved) revert PlayerAlreadySolved();
        
        uint8 guessNum = round.currentGuess;
        Commitment storage c = commitments[roundId][msg.sender][guessNum];
        if (c.hash != bytes32(0)) revert AlreadyCommitted();
        
        c.hash = commitment;
        c.timestamp = block.timestamp;
        
        emit GuessCommitted(roundId, msg.sender, guessNum);
    }
    
    /**
     * @notice Reveal a guess
     * @param roundId The round
     * @param guess The 5-letter guess
     * @param salt The salt used in commitment
     * @param wordProof Merkle proof that guess is valid word
     */
    function revealGuess(
        uint256 roundId, 
        bytes5 guess, 
        bytes32 salt,
        bytes32[] calldata wordProof
    ) external {
        Round storage round = rounds[roundId];
        PlayerState storage player = playerStates[roundId][msg.sender];
        
        if (!player.registered) revert NotRegistered();
        if (round.phase != Phase.Reveal) revert RoundNotInPhase(Phase.Reveal, round.phase);
        if (block.timestamp > round.phaseDeadline) revert RevealWindowClosed();
        if (player.solved) revert PlayerAlreadySolved();
        
        uint8 guessNum = round.currentGuess;
        Commitment storage c = commitments[roundId][msg.sender][guessNum];
        
        if (c.hash == bytes32(0)) revert NotCommitted();
        if (c.revealed) revert AlreadyRevealed();
        
        // Verify commitment
        bytes32 expectedHash = keccak256(abi.encodePacked(guess, salt));
        if (expectedHash != c.hash) revert InvalidReveal();
        
        // Verify word is in list (optional - can disable for testing)
        if (merkleRoot != bytes32(0)) {
            if (!_verifyMerkleProof(wordProof, merkleRoot, keccak256(abi.encodePacked(guess)))) {
                revert InvalidWordProof();
            }
        }
        
        // Store reveal
        c.revealed = true;
        c.guess = guess;
        player.guessCount++;
        
        emit GuessRevealed(roundId, msg.sender, guessNum, guess, 0); // Score calculated in evaluation
    }
    
    // ============ Evaluation ============
    
    /**
     * @notice Evaluate all revealed guesses for current round
     * @param roundId The round to evaluate
     * @param word The actual word (will be verified against wordHash)
     * @param wordSalt The salt used in wordHash
     */
    function evaluateRound(
        uint256 roundId,
        bytes5 word,
        bytes32 wordSalt
    ) external {
        Round storage round = rounds[roundId];
        
        if (round.phase != Phase.Evaluation) revert RoundNotInPhase(Phase.Evaluation, round.phase);
        
        // Verify word matches hash (only owner should call this, but verify anyway)
        bytes32 expectedHash = keccak256(abi.encodePacked(word, wordSalt));
        if (expectedHash != round.wordHash) revert InvalidWordProof();
        
        // Store word (for display purposes)
        round.word = word;
        round.wordSalt = wordSalt;
        
        uint8 guessNum = round.currentGuess;
        address[] storage players = roundPlayers[roundId];
        
        // Evaluate each player's guess
        for (uint256 i = 0; i < players.length; i++) {
            address playerAddr = players[i];
            PlayerState storage player = playerStates[roundId][playerAddr];
            
            if (player.solved) continue; // Already solved
            
            Commitment storage c = commitments[roundId][playerAddr][guessNum];
            if (!c.revealed) continue; // Didn't reveal
            
            // Evaluate guess
            uint8 correctCount = _evaluateGuess(c.guess, word);
            
            // Check if solved
            if (correctCount == WORD_LENGTH) {
                player.solved = true;
                player.solvedAtGuess = guessNum;
                
                // Track winner
                if (round.winningGuessNum == 0) {
                    round.winningGuessNum = guessNum;
                }
                
                if (player.solvedAtGuess == round.winningGuessNum) {
                    roundWinners[roundId].push(playerAddr);
                    round.winnerCount++;
                }
                
                emit PlayerSolved(roundId, playerAddr, guessNum);
            }
        }
    }
    
    /**
     * @notice Finalize round and distribute prizes
     * @param roundId The round to finalize
     */
    function finalizeRound(uint256 roundId) external nonReentrant {
        Round storage round = rounds[roundId];
        
        if (round.phase != Phase.Complete) revert RoundNotComplete();
        
        uint256 pot = round.pot;
        uint256 fee = (pot * PROTOCOL_FEE_BPS) / 10000;
        uint256 prizePool = pot - fee;
        
        // Transfer fee
        if (fee > 0 && feeVault != address(0)) {
            (bool feeSuccess, ) = feeVault.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Distribute prizes
        if (round.winnerCount > 0) {
            uint256 prizePerWinner = prizePool / round.winnerCount;
            address[] storage winners = roundWinners[roundId];
            
            for (uint256 i = 0; i < winners.length; i++) {
                (bool success, ) = winners[i].call{value: prizePerWinner}("");
                require(success, "Prize transfer failed");
            }
            
            emit RoundComplete(roundId, round.word, round.winnerCount, prizePerWinner);
        } else {
            // No winner - rollover to next round
            rolloverPots[round.tier] += prizePool;
            emit PotRollover(round.tier, prizePool, 0);
            emit RoundComplete(roundId, round.word, 0, 0);
        }
        
        // Clear pot to prevent double-finalize
        round.pot = 0;
    }
    
    // ============ Internal Functions ============
    
    function _evaluateGuess(bytes5 guess, bytes5 target) internal pure returns (uint8 correctCount) {
        correctCount = 0;
        for (uint8 i = 0; i < WORD_LENGTH; i++) {
            if (guess[i] == target[i]) {
                correctCount++;
            }
        }
    }
    
    function _verifyMerkleProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == root;
    }
    
    // ============ View Functions ============
    
    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }
    
    function getPlayerState(uint256 roundId, address player) external view returns (PlayerState memory) {
        return playerStates[roundId][player];
    }
    
    function getCommitment(uint256 roundId, address player, uint8 guessNum) external view returns (Commitment memory) {
        return commitments[roundId][player][guessNum];
    }
    
    function getRoundPlayers(uint256 roundId) external view returns (address[] memory) {
        return roundPlayers[roundId];
    }
    
    function getRoundWinners(uint256 roundId) external view returns (address[] memory) {
        return roundWinners[roundId];
    }
    
    function getTierConfig(Tier tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }
    
    // ============ Receive ============
    
    receive() external payable {}
}
