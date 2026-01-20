import hre from "hardhat";

async function main() {
  // 1. Parse Parameters from Environment Variables
  const imageName = process.env.IMAGE_NAME;
  const expectedHash = process.env.IMAGE_HASH;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // 2. Validation
  if (!imageName || !contractAddress) {
    console.error("❌ Error: Missing required environment variables.");
    console.error("Usage: IMAGE_NAME='...' [IMAGE_HASH='...'] CONTRACT_ADDRESS='...' npx hardhat run scripts/verify-cli.js --network sepolia");
    process.exit(1);
  }

  console.log(`\n🔍 Verifying Image: ${imageName}`);
  if (expectedHash) console.log(`   Expected Hash: ${expectedHash}`);
  console.log(`   Contract: ${contractAddress}\n`);

  // 3. Get Contract
  const imageRegistry = await hre.viem.getContractAt("ImageRegistry", contractAddress);

  // 4. Read from Blockchain
  try {
    const data = await imageRegistry.read.verifyImage([imageName]);
    // data is [hash, owner]
    const onChainHash = data[0];
    const owner = data[1];

    if (!onChainHash) {
      console.error("❌ FAILURE: Image not found on blockchain.");
      process.exit(1);
    }

    console.log(`   Found Hash: ${onChainHash}`);
    console.log(`   Owner: ${owner}`);

    // 5. Compare Hash (if provided)
    if (expectedHash) {
      if (onChainHash === expectedHash) {
        console.log("\n✅ SUCCESS: Hashes Match! Deployment Authorized.");
        process.exit(0);
      } else {
        console.error("\n❌ FAILURE: Hash Mismatch! Possible Tampering Detected.");
        console.error(`   Expected: ${expectedHash}`);
        console.error(`   Actual:   ${onChainHash}`);
        process.exit(1);
      }
    } else {
      console.log("\n✅ SUCCESS: Image exists (No hash comparison requested).");
      process.exit(0);
    }

  } catch (error) {
    console.error("❌ Error querying blockchain:", error.message || error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
