import hre from "hardhat";
import { createWalletClient, getContract, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

async function main() {
  // 1. Parse Parameters from Environment Variables
  const imageName = process.env.IMAGE_NAME;
  const imageHash = process.env.IMAGE_HASH;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.PRIVATE_KEY;
  const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;

  // 2. Validation
  if (!imageName || !imageHash || !contractAddress) {
    console.error("❌ Error: Missing required environment variables.");
    console.error("Usage: IMAGE_NAME='...' IMAGE_HASH='...' CONTRACT_ADDRESS='...' npx hardhat run scripts/register-cli.ts --network sepolia");
    process.exit(1);
  }

  if (!privateKey || !sepoliaRpcUrl) {
    console.error("❌ Error: Missing required environment variables for client setup (PRIVATE_KEY, SEPOLIA_RPC_URL).");
    process.exit(1);
  }

  console.log(`\n🚀 Starting Registration for: ${imageName}`);
  console.log(`   Hash: ${imageHash}`);
  console.log(`   Contract: ${contractAddress}\n`);

  // 3. Setup Viem Client
  const account = privateKeyToAccount(privateKey as `0x${string}`); 

  const client = createWalletClient({
    account,
    chain: sepolia, 
    transport: http(sepoliaRpcUrl)
  });

  // Get the contract ABI from Hardhat's artifacts
  const ImageRegistryArtifact = await hre.artifacts.readArtifact("ImageRegistry");

  const imageRegistry = getContract({
    address: contractAddress as `0x${string}`,
    abi: ImageRegistryArtifact.abi,
    client,
  });

  // 4. Send Transaction
  try {
    const tx = await imageRegistry.write.registerImage([imageName, imageHash], { account: client.account });
    console.log(`✅ Transaction sent! Hash: ${tx}`);
  } catch (error: any) {
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
