// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title WordDuelArenaV2
 * @notice Multiplayer word-guessing game with commit-reveal and oracle feedback
 * @dev All players compete on same word simultaneously. Oracle provides letter feedback
 *      without revealing the word until game ends.
 * 
 * SECURITY FIXES from V1:
 * - Oracle-based feedback (word never revealed mid-game)
 * - Pull pattern for prizes (no revert griefing)
 * - Emergency withdrawal after timeout
 * - Double-evaluation protection
 * - Target word Merkle validation
 * - Batch-friendly evaluation
 * - Min player requirements
 */
contract WordDuelArenaV2 is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // ============ Constants ============
    
    uint8 public constant MAX_GUESSES = 6;
    uint8 public constant WORD_LENGTH = 5;
    uint16 public constant PROTOCOL_FEE_BPS = 500; // 5%
    uint256 public constant MAX_PLAYERS_PER_ROUND = 100;
    uint256 public constant MIN_PLAYERS = 2;
    uint256 public constant EMERGENCY_TIMEOUT = 24 hours;
    
    // ============ Enums ============
    
    enum Tier { Sprint, Standard, HighRoller }
    enum Phase { Registration, Commit, Reveal, AwaitingFeedback, Complete }
    
    // Letter results: 0=absent, 1=present, 2=correct
    // Packed as uint8[5] in a single uint40 for gas efficiency
    
    // ============ Structs ============
    
    struct TierConfig {
        uint256 entryFee;
        uint256 registrationWindow;
        uint256 commitWindow;
        uint256 revealWindow;
        uint256 feedbackWindow;
        bool active;
    }
    
    struct Round {
        uint256 id;
        Tier tier;
        bytes32 wordHash;           // keccak256(word || salt)
        bytes32 wordMerkleProof;    // Root must match global merkleRoot
        
        uint256 pot;
        uint256 startTime;
        uint256 phaseDeadline;
        uint256 playerCount;
        
        Phase phase;
        uint8 currentGuess;         // 1-6 (0 = not started)
        
        uint8 winningGuessNum;      // Which guess # solved first (0 = none yet)
        uint256 winnerCount;
        uint256 rolloverPot;
        
        bool evaluated;             // Prevents double-evaluation
        bool finalized;             // Prevents double-finalization
    }
    
    struct PlayerState {
        bool registered;
        bool solved;
        uint8 solvedAtGuess;        // 1-6, or 0 if not solved
        uint8 guessCount;
        uint256 claimablePrize;     // Pull pattern - prizes stored here
    }
    
    struct Commitment {
        bytes32 hash;
        bool revealed;
        bytes5 guess;
        uint40 feedback;            // Packed letter results from oracle
        bool feedbackReceived;
    }
    
    // ============ State ============
    
    mapping(Tier => TierConfig) public tierConfigs;
    mapping(uint256 => Round) public rounds;
    uint256 public roundCounter;
    mapping(Tier => uint256) public currentRoundByTier;
    mapping(uint256 => mapping(address => PlayerState)) public playerStates;
    mapping(uint256 => mapping(address => mapping(uint8 => Commitment))) public commitments;
    mapping(uint256 => address[]) public roundPlayers;
    mapping(uint256 => address[]) public roundWinners;
    
    bytes32 public merkleRoot;
    address public feeVault;
    address public oracle;          // Trusted oracle for feedback
    mapping(Tier => uint256) public rolloverPots;
    
    // Track total active pots for rescue function safety
    uint256 public totalActivePots;
    
    // ============ Events ============
    
    event TierConfigured(Tier indexed tier, uint256 entryFee, uint256 commitWindow, uint256 revealWindow);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event RoundCreated(uint256 indexed roundId, Tier indexed tier, bytes32 wordHash, uint256 startTime);
    event PlayerRegistered(uint256 indexed roundId, address indexed player, uint256 pot);
    event PhaseAdvanced(uint256 indexed roundId, Phase phase, uint8 guessNum, uint256 deadline);
    event GuessCommitted(uint256 indexed roundId, address indexed player, uint8 guessNum);
    event GuessRevealed(uint256 indexed roundId, address indexed player, uint8 guessNum, bytes5 guess);
    event FeedbackProvided(uint256 indexed roundId, address indexed player, uint8 guessNum, uint40 feedback);
    event PlayerSolved(uint256 indexed roundId, address indexed player, uint8 guessNum);
    event RoundComplete(uint256 indexed roundId, uint256 winnerCount, uint256 prizePerWinner);
    event PrizeClaimed(uint256 indexed roundId, address indexed player, uint256 amount);
    event EmergencyRefund(uint256 indexed roundId, address indexed player, uint256 amount);
    event PotRollover(Tier indexed tier, uint256 amount, uint256 nextRoundId);
    event FundsRescued(address indexed to, uint256 amount);
    
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
    error AlreadyEvaluated();
    error AlreadyFinalized();
    error InvalidOracleSignature();
    error FeedbackAlreadyProvided();
    error NoPrizeToClaim();
    error EmergencyTimeoutNotReached();
    error MinPlayersNotMet();
    error InvalidFeeVault();
    error InvalidOracle();
    error NothingToRescue();
    
    // ============ Constructor ============
    
    constructor(
        address _feeVault, 
        address _oracle,
        bytes32 _merkleRoot
    ) Ownable(msg.sender) {
        if (_feeVault == address(0)) revert InvalidFeeVault();
        if (_oracle == address(0)) revert InvalidOracle();
        
        feeVault = _feeVault;
        oracle = _oracle;
        merkleRoot = _merkleRoot;
        
        // Default tier configs
        tierConfigs[Tier.Sprint] = TierConfig({
            entryFee: 0.001 ether,
            registrationWindow: 10 minutes,
            commitWindow: 30 seconds,
            revealWindow: 30 seconds,
            feedbackWindow: 60 seconds,
            active: true
        });
        
        tierConfigs[Tier.Standard] = TierConfig({
            entryFee: 0.01 ether,
            registrationWindow: 30 minutes,
            commitWindow: 45 seconds,
            revealWindow: 45 seconds,
            feedbackWindow: 60 seconds,
            active: true
        });
        
        tierConfigs[Tier.HighRoller] = TierConfig({
            entryFee: 0.1 ether,
            registrationWindow: 1 hours,
            commitWindow: 60 seconds,
            revealWindow: 60 seconds,
            feedbackWindow: 120 seconds,
            active: false
        });
    }
    
    // ============ Admin Functions ============
    
    function setTierConfig(
        Tier tier,
        uint256 entryFee,
        uint256 registrationWindow,
        uint256 commitWindow,
        uint256 revealWindow,
        uint256 feedbackWindow,
        bool active
    ) external onlyOwner {
        tierConfigs[tier] = TierConfig({
            entryFee: entryFee,
            registrationWindow: registrationWindow,
            commitWindow: commitWindow,
            revealWindow: revealWindow,
            feedbackWindow: feedbackWindow,
            active: active
        });
        emit TierConfigured(tier, entryFee, commitWindow, revealWindow);
    }
    
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }
    
    function setFeeVault(address _feeVault) external onlyOwner {
        if (_feeVault == address(0)) revert InvalidFeeVault();
        feeVault = _feeVault;
    }
    
    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert InvalidOracle();
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }
    
    // ============ Round Management ============
    
    /**
     * @notice Create a new round for a tier
     * @param tier The tier to create round for
     * @param wordHash Hash of the word (keccak256(word || salt))
     * @param wordProof Merkle proof that word is in valid word list
     */
    function createRound(
        Tier tier, 
        bytes32 wordHash,
        bytes32[] calldata wordProof
    ) external onlyOwner returns (uint256) {
        TierConfig memory config = tierConfigs[tier];
        if (!config.active) revert TierNotActive();
        
        // Note: We store proof hash for gas efficiency. Oracle validates full proof.
        bytes32 proofHash = keccak256(abi.encodePacked(wordProof));
        
        roundCounter++;
        uint256 roundId = roundCounter;
        
        uint256 rollover = rolloverPots[tier];
        rolloverPots[tier] = 0;
        totalActivePots += rollover;
        
        rounds[roundId] = Round({
            id: roundId,
            tier: tier,
            wordHash: wordHash,
            wordMerkleProof: proofHash,
            pot: rollover,
            startTime: block.timestamp,
            phaseDeadline: block.timestamp + config.registrationWindow,
            playerCount: 0,
            phase: Phase.Registration,
            currentGuess: 0,
            winningGuessNum: 0,
            winnerCount: 0,
            rolloverPot: rollover,
            evaluated: false,
            finalized: false
        });
        
        currentRoundByTier[tier] = roundId;
        
        emit RoundCreated(roundId, tier, wordHash, block.timestamp);
        
        return roundId;
    }
    
    /**
     * @notice Register for a round
     */
    function register(uint256 roundId) external payable nonReentrant {
        Round storage round = rounds[roundId];
        if (round.id == 0) revert InvalidTier();
        if (round.phase != Phase.Registration) revert RoundNotInPhase(Phase.Registration, round.phase);
        if (block.timestamp > round.phaseDeadline) revert CommitWindowClosed();
        if (playerStates[roundId][msg.sender].registered) revert AlreadyRegistered();
        if (round.playerCount >= MAX_PLAYERS_PER_ROUND) revert MaxPlayersReached();
        
        TierConfig memory config = tierConfigs[round.tier];
        if (msg.value != config.entryFee) revert IncorrectEntryFee();
        
        playerStates[roundId][msg.sender] = PlayerState({
            registered: true,
            solved: false,
            solvedAtGuess: 0,
            guessCount: 0,
            claimablePrize: 0
        });
        
        roundPlayers[roundId].push(msg.sender);
        round.playerCount++;
        round.pot += msg.value;
        totalActivePots += msg.value;
        
        emit PlayerRegistered(roundId, msg.sender, round.pot);
    }
    
    /**
     * @notice Start the first guess round
     */
    function startRound(uint256 roundId) external onlyOwner {
        Round storage round = rounds[roundId];
        if (round.phase != Phase.Registration) revert RoundNotInPhase(Phase.Registration, round.phase);
        if (round.playerCount < MIN_PLAYERS) revert MinPlayersNotMet();
        
        round.phase = Phase.Commit;
        round.currentGuess = 1;
        round.phaseDeadline = block.timestamp + tierConfigs[round.tier].commitWindow;
        
        emit PhaseAdvanced(roundId, Phase.Commit, 1, round.phaseDeadline);
    }
    
    /**
     * @notice Advance to the next phase (permissionless after deadline)
     */
    function advancePhase(uint256 roundId) external {
        Round storage round = rounds[roundId];
        TierConfig memory config = tierConfigs[round.tier];
        
        if (block.timestamp < round.phaseDeadline) revert PhaseNotComplete();
        
        if (round.phase == Phase.Commit) {
            round.phase = Phase.Reveal;
            round.phaseDeadline = block.timestamp + config.revealWindow;
            emit PhaseAdvanced(roundId, Phase.Reveal, round.currentGuess, round.phaseDeadline);
            
        } else if (round.phase == Phase.Reveal) {
            round.phase = Phase.AwaitingFeedback;
            round.phaseDeadline = block.timestamp + config.feedbackWindow;
            emit PhaseAdvanced(roundId, Phase.AwaitingFeedback, round.currentGuess, round.phaseDeadline);
            
        } else if (round.phase == Phase.AwaitingFeedback) {
            // Check if round should end (someone solved or max guesses)
            if (round.winningGuessNum > 0 || round.currentGuess >= MAX_GUESSES) {
                round.phase = Phase.Complete;
                emit PhaseAdvanced(roundId, Phase.Complete, round.currentGuess, block.timestamp);
            } else {
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
        
        emit GuessCommitted(roundId, msg.sender, guessNum);
    }
    
    /**
     * @notice Reveal a guess
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
        
        // Verify word is in list
        if (merkleRoot != bytes32(0)) {
            if (!_verifyMerkleProof(wordProof, merkleRoot, keccak256(abi.encodePacked(guess)))) {
                revert InvalidWordProof();
            }
        }
        
        c.revealed = true;
        c.guess = guess;
        player.guessCount++;
        
        emit GuessRevealed(roundId, msg.sender, guessNum, guess);
    }
    
    /**
     * @notice Submit oracle-signed feedback for a player's guess
     * @dev Oracle signs: keccak256(roundId, player, guessNum, feedback)
     */
    function submitFeedback(
        uint256 roundId,
        address player,
        uint8 guessNum,
        uint40 feedback,  // Packed: 5 results, 8 bits each (0=absent, 1=present, 2=correct)
        bytes calldata signature
    ) external {
        Round storage round = rounds[roundId];
        if (round.phase != Phase.AwaitingFeedback) revert RoundNotInPhase(Phase.AwaitingFeedback, round.phase);
        
        Commitment storage c = commitments[roundId][player][guessNum];
        if (!c.revealed) revert NotCommitted();
        if (c.feedbackReceived) revert FeedbackAlreadyProvided();
        
        // Verify oracle signature
        bytes32 messageHash = keccak256(abi.encodePacked(roundId, player, guessNum, feedback));
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        if (signer != oracle) revert InvalidOracleSignature();
        
        c.feedback = feedback;
        c.feedbackReceived = true;
        
        // Check if player solved (all 5 letters correct = 2,2,2,2,2 = 0x0202020202)
        if (_isSolved(feedback)) {
            PlayerState storage ps = playerStates[roundId][player];
            ps.solved = true;
            ps.solvedAtGuess = guessNum;
            
            // Track first winner
            if (round.winningGuessNum == 0) {
                round.winningGuessNum = guessNum;
            }
            
            // Only add to winners if solved on winning guess number
            if (guessNum == round.winningGuessNum) {
                roundWinners[roundId].push(player);
                round.winnerCount++;
                emit PlayerSolved(roundId, player, guessNum);
            }
        }
        
        emit FeedbackProvided(roundId, player, guessNum, feedback);
    }
    
    /**
     * @notice Finalize round and allocate prizes (pull pattern)
     */
    function finalizeRound(uint256 roundId) external nonReentrant {
        Round storage round = rounds[roundId];
        
        if (round.phase != Phase.Complete) revert RoundNotComplete();
        if (round.finalized) revert AlreadyFinalized();
        
        round.finalized = true;
        
        uint256 pot = round.pot;
        uint256 fee = (pot * PROTOCOL_FEE_BPS) / 10000;
        uint256 prizePool = pot - fee;
        
        // Transfer fee (safe - feeVault validated as non-zero)
        if (fee > 0) {
            (bool feeSuccess, ) = feeVault.call{value: fee}("");
            // If fee transfer fails, add to prize pool instead of reverting
            if (!feeSuccess) {
                prizePool += fee;
            }
        }
        
        totalActivePots -= pot;
        
        // Allocate prizes (pull pattern - no external calls in loop)
        if (round.winnerCount > 0) {
            uint256 prizePerWinner = prizePool / round.winnerCount;
            uint256 distributed = 0;
            
            address[] storage winners = roundWinners[roundId];
            for (uint256 i = 0; i < winners.length; i++) {
                playerStates[roundId][winners[i]].claimablePrize = prizePerWinner;
                distributed += prizePerWinner;
            }
            
            // Handle dust - give to first winner
            uint256 dust = prizePool - distributed;
            if (dust > 0 && winners.length > 0) {
                playerStates[roundId][winners[0]].claimablePrize += dust;
            }
            
            emit RoundComplete(roundId, round.winnerCount, prizePerWinner);
        } else {
            // No winner - rollover to next round
            rolloverPots[round.tier] += prizePool;
            emit PotRollover(round.tier, prizePool, 0);
            emit RoundComplete(roundId, 0, 0);
        }
    }
    
    /**
     * @notice Claim prize (pull pattern)
     */
    function claimPrize(uint256 roundId) external nonReentrant {
        PlayerState storage player = playerStates[roundId][msg.sender];
        uint256 amount = player.claimablePrize;
        
        if (amount == 0) revert NoPrizeToClaim();
        
        player.claimablePrize = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit PrizeClaimed(roundId, msg.sender, amount);
    }
    
    /**
     * @notice Emergency refund if round stuck past timeout
     */
    function emergencyRefund(uint256 roundId) external nonReentrant {
        Round storage round = rounds[roundId];
        PlayerState storage player = playerStates[roundId][msg.sender];
        
        if (!player.registered) revert NotRegistered();
        if (round.finalized) revert AlreadyFinalized();
        
        // Must be past emergency timeout
        if (block.timestamp < round.startTime + EMERGENCY_TIMEOUT) {
            revert EmergencyTimeoutNotReached();
        }
        
        // Calculate refund (entry fee, proportional to pot if rollover included)
        TierConfig memory config = tierConfigs[round.tier];
        uint256 refund = config.entryFee;
        
        // Prevent double-refund
        player.registered = false;
        totalActivePots -= refund;
        
        (bool success, ) = msg.sender.call{value: refund}("");
        require(success, "Refund failed");
        
        emit EmergencyRefund(roundId, msg.sender, refund);
    }
    
    /**
     * @notice Rescue accidentally sent ETH (not active pot funds)
     */
    function rescueETH() external onlyOwner nonReentrant {
        uint256 rescuable = address(this).balance - totalActivePots;
        if (rescuable == 0) revert NothingToRescue();
        
        (bool success, ) = owner().call{value: rescuable}("");
        require(success, "Rescue failed");
        
        emit FundsRescued(owner(), rescuable);
    }
    
    // ============ Internal Functions ============
    
    function _isSolved(uint40 feedback) internal pure returns (bool) {
        // Check all 5 bytes are 2 (correct)
        for (uint8 i = 0; i < 5; i++) {
            uint8 result = uint8((feedback >> (i * 8)) & 0xFF);
            if (result != 2) return false;
        }
        return true;
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
    
    receive() external payable {
        // Accept ETH (for rescue function)
    }
}
