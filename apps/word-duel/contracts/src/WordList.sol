// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title WordList
 * @author Bankrcade
 * @notice Validates words against the official 2,309 Wordle answer list using Merkle proofs
 * @dev Uses Merkle tree for gas-efficient word validation without storing all words on-chain
 */
contract WordList {
    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error InvalidWord();
    error InvalidWordLength();

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event MerkleRootUpdated(bytes32 newRoot);

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Merkle root of the valid word list
    bytes32 public merkleRoot;
    
    /// @notice Owner who can update the merkle root
    address public owner;
    
    /// @notice Word length requirement (5 letters)
    uint256 public constant WORD_LENGTH = 5;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Deploys WordList with initial Merkle root
     * @param _merkleRoot The Merkle root of valid 5-letter words
     */
    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Updates the Merkle root (for word list updates)
     * @param _merkleRoot The new Merkle root
     * @dev Only callable by owner
     */
    function setMerkleRoot(bytes32 _merkleRoot) external {
        require(msg.sender == owner, "Not owner");
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }
    
    /**
     * @notice Transfers ownership
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Not owner");
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    /*//////////////////////////////////////////////////////////////
                        VALIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Validates a word against the Merkle tree
     * @param word The 5-letter word (lowercase, packed as bytes5)
     * @param proof The Merkle proof for the word
     * @return valid True if the word is in the valid list
     */
    function isValidWord(bytes5 word, bytes32[] calldata proof) external view returns (bool valid) {
        bytes32 leaf = keccak256(abi.encodePacked(word));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
    
    /**
     * @notice Validates a word provided as a string
     * @param word The word as a string (must be exactly 5 lowercase letters)
     * @param proof The Merkle proof for the word
     * @return valid True if the word is in the valid list
     */
    function isValidWordString(string calldata word, bytes32[] calldata proof) external view returns (bool valid) {
        bytes memory wordBytes = bytes(word);
        if (wordBytes.length != WORD_LENGTH) revert InvalidWordLength();
        
        // Convert to bytes5 and validate
        bytes5 word5;
        assembly {
            word5 := mload(add(wordBytes, 32))
        }
        
        bytes32 leaf = keccak256(abi.encodePacked(word5));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
    
    /**
     * @notice Converts a string to bytes5
     * @param word The word string
     * @return The word as bytes5
     */
    function stringToBytes5(string calldata word) external pure returns (bytes5) {
        bytes memory wordBytes = bytes(word);
        if (wordBytes.length != WORD_LENGTH) revert InvalidWordLength();
        
        bytes5 result;
        assembly {
            result := mload(add(wordBytes, 32))
        }
        return result;
    }
    
    /**
     * @notice Converts bytes5 to string
     * @param word The word as bytes5
     * @return The word as string
     */
    function bytes5ToString(bytes5 word) external pure returns (string memory) {
        bytes memory result = new bytes(5);
        for (uint256 i = 0; i < 5; i++) {
            result[i] = word[i];
        }
        return string(result);
    }
}
