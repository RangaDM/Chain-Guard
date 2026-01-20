# ChainGuard 🛡️

**Decentralized Docker Image Integrity Registry**

ChainGuard is a DApp designed to secure the software supply chain by registering image hashes on the Ethereum blockchain. It provides an immutable, verifiable record of authenticity for Docker images and other digital artifacts.

## 🌟 Key Features

- **Immutable Registry:** Permanently store image names and SHA256 hashes on-chain.
- **Tamper-Proof Verification:** Instantly verify if a local image matches the registered version.
- **Provenance Tracking:** Identify the exact wallet address that authenticated the image.
- **Simple UI:** Clean React interface for seamless interaction with the blockchain.

## 🏗️ Technical Stack

- **Frontend:** React + Vite + Ethers.js
- **Blockchain:** Solidity + Hardhat
- **Testing:** Hardhat Ignition & Network Simulation

## 🚀 Quick Start

### 1. Start the Local Blockchain
```bash
cd blockchain
npx hardhat node
```

### 2. Deploy Smart Contract
In a separate terminal:
```bash
cd blockchain
# Deploy the ImageRegistry module
npx hardhat ignition deploy ignition/modules/ImageRegistry.ts --network localhost
```
*Note the deployed contract address.*

### 3. Run the Client
Update the `.env` file in `client/` with your new contract address.
```bash
cd client
npm install
npm run dev
```
