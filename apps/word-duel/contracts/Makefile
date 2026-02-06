# Word Duel Makefile

.PHONY: all build test clean deploy-testnet deploy-mainnet

# Default target
all: build

# Install dependencies
install:
	forge install OpenZeppelin/openzeppelin-contracts --no-commit
	forge install foundry-rs/forge-std --no-commit
	npm install

# Build contracts
build:
	forge build

# Run tests
test:
	forge test -vvv

# Run tests with gas report
test-gas:
	forge test --gas-report

# Coverage report
coverage:
	forge coverage

# Format code
fmt:
	forge fmt

# Generate Merkle tree
merkle:
	node script/GenerateMerkleTree.js

# Deploy to Base Sepolia testnet
deploy-testnet:
	forge script script/Deploy.s.sol:DeployTestnetScript \
		--rpc-url base_sepolia \
		--broadcast \
		-vvvv

# Deploy to Base mainnet
deploy-mainnet:
	forge script script/Deploy.s.sol:DeployScript \
		--rpc-url base \
		--broadcast \
		--verify \
		-vvvv

# Clean build artifacts
clean:
	forge clean
	rm -rf out cache

# Verify contracts on Basescan
verify:
	@echo "Verify contracts manually using:"
	@echo "forge verify-contract <address> <contract> --chain base"
