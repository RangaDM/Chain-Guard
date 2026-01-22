// server/server.js
require('dotenv').config({ path: '.env' }); // Adjusted to look for .env in root
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const SEPOLIA_URL = process.env.SEPOLIA_URL; 
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Validation Helper
function requireEnv(name, value) {
  if (!value) {
    console.error(`❌ Missing required env var: ${name}`);
    return false;
  }
  return true;
}

const ok =
  requireEnv("PRIVATE_KEY", PRIVATE_KEY) &&
  requireEnv("SEPOLIA_URL", SEPOLIA_URL) &&
  requireEnv("CONTRACT_ADDRESS", CONTRACT_ADDRESS);

if (!ok) {
  console.error("❌ Check your root .env file. Missing variables.");
  process.exit(1);
}

if (!ethers.isAddress(CONTRACT_ADDRESS)) {
  console.error(`❌ Invalid CONTRACT_ADDRESS: ${CONTRACT_ADDRESS}`);
  process.exit(1);
}

// Load ABI
const artifactPath = path.resolve(__dirname, '../blockchain/artifacts/contracts/ImageRegistry.sol/ImageRegistry.json');
const ARTIFACT = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Setup Provider
const provider = new ethers.JsonRpcProvider(SEPOLIA_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ARTIFACT.abi, wallet);

// --- ROUTES ---

app.post('/api/build', async (req, res) => {
    const { imageName, projectDir } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendLog = (msg) => res.write(`data: ${JSON.stringify({ log: msg })}\n\n`);

    sendLog(`🚀 CI Agent started for: ${imageName}`);

    // Resolve Path
    const absolutePath = path.resolve(__dirname, '..', projectDir);
    sendLog(`📂 Working Directory: ${absolutePath}`);

    // --- FIX IS HERE: Added quotes around absolutePath ---
    const buildCmd = `docker build -t ${imageName} "${absolutePath}"`;
    sendLog(`> ${buildCmd}`);

    const child = exec(buildCmd);

    child.stdout.on('data', (d) => sendLog(d.trim()));
    child.stderr.on('data', (d) => sendLog(`[STDERR] ${d.trim()}`));

    child.on('close', (code) => {
        if (code !== 0) {
            sendLog(`❌ Build Failed (Exit Code: ${code})`);
            res.end(); 
            return;
        }

        sendLog(`✅ Docker Build Success! Generating Hash...`);

        exec(`docker inspect --format="{{.Id}}" ${imageName}`, async (err, stdout) => {
            if (err) { sendLog(`❌ Hash Error: ${err.message}`); res.end(); return; }

            const imageHash = stdout.trim().replace(/"/g, "");
            sendLog(`🔒 SHA256: ${imageHash}`);
            sendLog(`⛓️ Sending transaction to Sepolia...`);

            try {
                const tx = await contract.registerImage(imageName, imageHash);
                sendLog(`⏳ Transaction Pending: ${tx.hash}`);

                await tx.wait(); 

                sendLog(`🎉 IMMUTABLE RECORD CREATED!`);
                sendLog(`BLOCKCHAIN_CONFIRMATION: ${tx.hash}`);
                res.end();
            } catch (txErr) {
                sendLog(`❌ Blockchain Error: ${txErr.message}`);
                res.end();
            }
        });
    });
});

app.post('/api/verify', async (req, res) => {
    try {
        const { imageName } = req.body;
        const result = await contract.verifyImage(imageName);
        if (result[0]) {
            res.json({ success: true, hash: result[0], owner: result[1] });
        } else {
            res.json({ success: false });
        }
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.listen(3001, () => console.log("✅ CI Server running on Port 3001"));