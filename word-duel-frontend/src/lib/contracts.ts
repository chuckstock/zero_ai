// Word Duel Contract Addresses - Sepolia Testnet

export const CONTRACTS = {
  wordToken: import.meta.env.VITE_WORD_TOKEN_ADDRESS || '0x0B80D534Cd84BF68B6e2e7Fce01C974381f04b8F',
  feeVault: import.meta.env.VITE_FEE_VAULT_ADDRESS || '0xf770775F1290637b3473C15f3f3Aa8d4C85F44FC',
  wordList: import.meta.env.VITE_WORD_LIST_ADDRESS || '0x2d7Ed21f28eF213a08869D874CdEDEaAFCeDB705',
  wordDuel: import.meta.env.VITE_WORD_DUEL_ADDRESS || '0x490084F34EebD9c6E6CB635844C7186d021faDc3',
} as const;

export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111'); // Sepolia

export const CHAIN_CONFIG = {
  id: CHAIN_ID,
  name: 'Sepolia',
  network: 'sepolia',
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  blockExplorer: 'https://sepolia.etherscan.io',
};

// Contract ABIs (minimal for frontend)
export const WORD_DUEL_ABI = [
  'function createGame(bytes32 targetWordHash) external payable returns (uint256 gameId)',
  'function joinGame(uint256 gameId, bytes32 targetWordHash) external payable',
  'function commitGuess(uint256 gameId, bytes32 guessHash) external',
  'function revealGuess(uint256 gameId, bytes5 guess, bytes32 salt, bytes32[] calldata wordProof) external',
  'function revealTargetWord(uint256 gameId, bytes5 targetWord, bytes32 salt, bytes32[] calldata wordProof) external',
  'function cancelGame(uint256 gameId) external',
  'function claimTimeout(uint256 gameId) external',
  'function getGame(uint256 gameId) external view returns (tuple(address player1, address player2, uint256 entryFee, uint256 pot, bytes5 targetWord1, bytes5 targetWord2, bytes32 targetHash1, bytes32 targetHash2, uint8 currentRound, uint8 score1, uint8 score2, uint8 state, uint256 lastActionTime, bytes32 commitP1, bytes32 commitP2, bytes5 revealP1, bytes5 revealP2, bool p1Committed, bool p2Committed, bool p1Revealed, bool p2Revealed))',
  'function gameCount() external view returns (uint256)',
  'event GameCreated(uint256 indexed gameId, address indexed creator, uint256 entryFee)',
  'event GameJoined(uint256 indexed gameId, address indexed player2)',
  'event GuessCommitted(uint256 indexed gameId, address indexed player, uint256 round)',
  'event GuessRevealed(uint256 indexed gameId, address indexed player, uint256 round, bytes5 guess, uint8 score)',
  'event GameComplete(uint256 indexed gameId, address indexed winner, uint256 prize)',
] as const;

export const WORD_TOKEN_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function stake(uint256 amount) external',
  'function unstake(uint256 amount) external',
  'function stakedBalanceOf(address account) external view returns (uint256)',
  'function totalStaked() external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
] as const;
