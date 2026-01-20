import hre from "hardhat";

async function main() {
  // 1. Parse Parameters from Environment Variables
  const imageName = process.env.IMAGE_NAME;
  const imageHash = process.env.IMAGE_HASH;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  // 2. Validation
  if (!imageName || !imageHash || !contractAddress) {
    console.error("❌ Error: Missing required environment variables.");
    console.error("Usage: IMAGE_NAME='...' IMAGE_HASH='...' CONTRACT_ADDRESS='...' npx hardhat run scripts/register-cli.js --network sepolia");
    process.exit(1);
  }

  console.log(`\n🚀 Starting Registration for: ${imageName}`);
  console.log(`   Hash: ${imageHash}`);
  console.log(`   Contract: ${contractAddress}\n`);

  // 3. Get Contract
  // We need a wallet client to write to the blockchain
  const [walletClient] = await hre.viem.getWalletClients();
  const imageRegistry = await hre.viem.getContractAt("ImageRegistry", contractAddress, { client: { wallet: walletClient } });


  // 4. Send Transaction
  try {
    const tx = await imageRegistry.write.registerImage([imageName, imageHash]);
    console.log(`✅ Transaction sent! Hash: ${tx}`);
    
    // In a real CI, you might want to wait for receipts, but usually calculating the hash is enough to move on
    // await publicClient.waitForTransactionReceipt({ hash: tx }); 
    // console.log("   Transaction confirmed.");
  } catch (error) {
    console.error("❌ Transaction Failed:", error.message || error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
