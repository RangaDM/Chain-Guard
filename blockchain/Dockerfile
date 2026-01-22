# Blockchain Dockerfile - Hardhat Development Environment
FROM node:20-alpine

# Install git (required for some Hardhat dependencies like forge-std)
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy contract source files and configuration
COPY contracts/ ./contracts/
COPY ignition/ ./ignition/
COPY scripts/ ./scripts/
COPY hardhat.config.ts ./

# Build contracts (optional - can be done at runtime)
RUN npx hardhat compile || true

# Default command - can be overridden
# Examples:
#   docker run blockchain npx hardhat node
#   docker run blockchain npx hardhat compile
#   docker run blockchain npx hardhat run scripts/register-cli.ts --network sepolia
CMD ["npx", "hardhat", "--help"]

