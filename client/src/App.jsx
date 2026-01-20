import { ethers } from 'ethers';
import { useState } from 'react';
import abi from './abi.json';

// Ensure this matches your deployed contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;



function App() {
  // Register State
  const [registerName, setRegisterName] = useState("");
  const [registerHash, setRegisterHash] = useState("");
  
  // Verify State
  const [verifyName, setVerifyName] = useState("");

  const [status, setStatus] = useState({ message: "", type: "" }); // { message, type: 'success' | 'error' | 'loading' }

  // Helper to update status
  const updateStatus = (message, type = "") => setStatus({ message, type });

  // 1. Connect Wallet
  async function requestAccount() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  }

  // 2. Register Image (Write)
  async function register() {
    if (!registerName || !registerHash) {
      updateStatus("Please fill in both fields.", "error");
      return;
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        await requestAccount();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);

        updateStatus("Transaction sending... confirm in wallet.", "loading");
        const tx = await contract.registerImage(registerName, registerHash);
        
        updateStatus("Mining transaction...", "loading");
        await tx.wait(); // Wait for block confirmation
        
        updateStatus("Success! Image Registered on Blockchain.", "success");
        setRegisterName("");
        setRegisterHash("");
      } catch (err) {
        console.error(err);
        updateStatus("Error: " + (err.reason || err.message), "error");
      }
    } else {
      updateStatus("MetaMask not found. Please install it.", "error");
    }
  }

  // 3. Verify Image (Read)
  async function verify() {
    if (!verifyName) {
      updateStatus("Please enter an image name to verify.", "error");
      return;
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);

        updateStatus("Checking blockchain...", "loading");
        const data = await contract.verifyImage(verifyName);
        
        // data[0] is hash, data[1] is owner
        if (data[0]) {
           updateStatus(`✅ Verified! \nHash: ${data[0]}\nOwner: ${data[1]}`, "success");
        } else {
           updateStatus("Image not found on blockchain.", "error");
        }
      } catch (err) {
        console.error(err);
        updateStatus("Error looking up image.", "error");
      }
    }
  }

  return (
    <div className="app-container">
      <h1>ChainGuard <span style={{color: 'var(--text-secondary)', fontSize: '0.5em'}}>Registry</span></h1>

      <div className="grid">
        {/* Register Card */}
        <div className="card">
          <h3>🚀 Register Image</h3>
          <div className="input-group">
            <input 
              placeholder="Image Name (e.g. nginx:latest)" 
              value={registerName}
              onChange={e => setRegisterName(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <input 
              placeholder="Image Hash (SHA256)" 
              value={registerHash}
              onChange={e => setRegisterHash(e.target.value)} 
            />
          </div>
          <button onClick={register} disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Processing...' : 'Register on Chain'}
          </button>
        </div>

        {/* Verify Card */}
        <div className="card">
          <h3>🔍 Verify Integrity</h3>
          <div className="input-group">
            <input 
              placeholder="Search Image Name..." 
              value={verifyName}
              onChange={e => setVerifyName(e.target.value)} 
            />
          </div>
          <button onClick={verify} style={{backgroundColor: 'var(--bg-card)', border: '1px solid var(--accent-primary)'}}>
            Check Status
          </button>
        </div>
      </div>

      {/* Status Output */}
      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default App;