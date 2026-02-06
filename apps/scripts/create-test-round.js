// Create a test round on WordDuelArenaV2
// Usage: PRIVATE_KEY=0x... node scripts/create-test-round.js

const { ethers } = require('ethers');

const ARENA_ADDRESS = '0xD4Ffd32309dbB45F4F5cC153B6bAae5Cbb6d7443';
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

const ARENA_ABI = [
  'function createRound(uint8 tier, bytes32 wordHash, bytes32[] wordProof) returns (uint256)',
  'function startRound(uint256 roundId)',
  'function getRound(uint256 roundId) view returns (tuple(uint256 id, uint8 tier, bytes32 wordHash, bytes32 wordMerkleProof, uint256 pot, uint256 startTime, uint256 phaseDeadline, uint256 playerCount, uint8 phase, uint8 currentGuess, uint8 winningGuessNum, uint256 winnerCount, uint256 rolloverPot, bool evaluated, bool finalized))',
  'event RoundCreated(uint256 indexed roundId, uint8 indexed tier, bytes32 wordHash, uint256 startTime)',
];

// Test words for rounds
const TEST_WORDS = ['CRANE', 'APPLE', 'HOUSE', 'BRAIN', 'PLANT'];

async function main() {
  const privateKey = process.env.PRIVATE_KEY || '0x6eb278b33743de394bfc4c0a1db65dc498fd159f9118cad11af5e885995be213';
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const arena = new ethers.Contract(ARENA_ADDRESS, ARENA_ABI, wallet);
  
  console.log('Creating test round...');
  console.log('Wallet:', wallet.address);
  
  // Pick a random word
  const word = TEST_WORDS[Math.floor(Math.random() * TEST_WORDS.length)];
  const wordBytes = ethers.encodeBytes32String(word).slice(0, 12); // bytes5
  const salt = ethers.keccak256(ethers.toUtf8Bytes(`salt_${Date.now()}`));
  const wordHash = ethers.keccak256(ethers.solidityPacked(['bytes5', 'bytes32'], [wordBytes, salt]));
  
  console.log('Word:', word);
  console.log('Word (bytes5):', wordBytes);
  console.log('Salt:', salt);
  console.log('Word Hash:', wordHash);
  
  // Save word info for oracle
  const wordInfo = {
    word,
    wordBytes,
    salt,
    wordHash,
    createdAt: new Date().toISOString(),
  };
  
  const fs = require('fs');
  const roundsDir = './oracle/rounds';
  if (!fs.existsSync(roundsDir)) {
    fs.mkdirSync(roundsDir, { recursive: true });
  }
  
  // Create round (tier 1 = Standard)
  const tx = await arena.createRound(1, wordHash, []);
  console.log('TX:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('Confirmed in block:', receipt.blockNumber);
  
  // Get round ID from event
  const event = receipt.logs.find(log => {
    try {
      return arena.interface.parseLog(log)?.name === 'RoundCreated';
    } catch { return false; }
  });
  
  const roundId = arena.interface.parseLog(event).args.roundId;
  console.log('Round ID:', roundId.toString());
  
  // Save round info
  wordInfo.roundId = roundId.toString();
  fs.writeFileSync(`${roundsDir}/round-${roundId}.json`, JSON.stringify(wordInfo, null, 2));
  console.log(`Saved round info to ${roundsDir}/round-${roundId}.json`);
  
  // Get round details
  const round = await arena.getRound(roundId);
  console.log('\\nRound Details:');
  console.log('  Phase:', ['Registration', 'Commit', 'Reveal', 'AwaitingFeedback', 'Complete'][round.phase]);
  console.log('  Pot:', ethers.formatEther(round.pot), 'ETH');
  console.log('  Players:', round.playerCount.toString());
  
  console.log('\\n✅ Round created! Players can now register.');
  console.log('\\nTo start the round after players register:');
  console.log(`  cast send ${ARENA_ADDRESS} "startRound(uint256)" ${roundId} --rpc-url ${RPC_URL} --private-key $PRIVATE_KEY`);
}

main().catch(console.error);
