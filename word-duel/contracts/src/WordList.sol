// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title WordList
/// @notice Manages the valid word list for Word Duel
/// @dev Words stored as bytes5 for gas efficiency
library WordList {
    // Word list hash for verification
    bytes32 constant WORD_LIST_HASH = 0x0; // TODO: Set after finalizing list
    
    /// @notice Check if a word is valid (exists in word list)
    /// @dev Off-chain verification recommended, on-chain for disputes
    function isValidWord(bytes5 word, bytes32[] calldata proof) internal pure returns (bool) {
        // Merkle proof verification
        bytes32 leaf = keccak256(abi.encodePacked(word));
        return verifyProof(proof, WORD_LIST_HASH, leaf);
    }
    
    function verifyProof(
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
    
    /// @notice Score a guess against the answer
    /// @return result 5 bytes: 2=green, 1=yellow, 0=gray for each position
    function scoreGuess(bytes5 guess, bytes5 answer) internal pure returns (bytes5) {
        bytes memory result = new bytes(5);
        bool[5] memory answerUsed;
        bool[5] memory guessMatched;
        
        // First pass: find exact matches (green)
        for (uint i = 0; i < 5; i++) {
            if (guess[i] == answer[i]) {
                result[i] = 0x02; // Green
                answerUsed[i] = true;
                guessMatched[i] = true;
            }
        }
        
        // Second pass: find wrong position matches (yellow)
        for (uint i = 0; i < 5; i++) {
            if (!guessMatched[i]) {
                for (uint j = 0; j < 5; j++) {
                    if (!answerUsed[j] && guess[i] == answer[j]) {
                        result[i] = 0x01; // Yellow
                        answerUsed[j] = true;
                        break;
                    }
                }
                // If not matched, result[i] stays 0x00 (Gray)
            }
        }
        
        return bytes5(bytes(result));
    }
}
