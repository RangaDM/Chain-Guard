import { useEffect, useRef, useState } from "react";
// import './App.css'; // Optional: If you have custom styles, otherwise Tailwind handles it

function App() {
  const [activeTab, setActiveTab] = useState("ci"); // 'ci' | 'cd'

  // --- CI STATE ---
  const [mockJenkinsfile, setMockJenkinsfile] = useState(
    `pipeline {
    agent any
    environment {
        IMAGE_NAME = 'demo-app:v1.0'
        PROJECT_DIR = '.' 
    }
}`
  );
  const [logs, setLogs] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [txHash, setTxHash] = useState(null);

  // --- CD STATE ---
  const [deployImage, setDeployImage] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  const logsEndRef = useRef(null);
  const mainContentRef = useRef(null);

  // Auto-scroll console logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- HANDLERS ---

  // 1. TRIGGER BUILD (Talks to Node.js Backend)
  const startBuild = async () => {
    setIsBuilding(true);
    setLogs(["Initializing Agent...", "Parsing Jenkinsfile..."]);
    setTxHash(null);

    // Simple Regex to parse the Mock Jenkinsfile
    const nameMatch = mockJenkinsfile.match(/IMAGE_NAME = '(.*)'/);
    const dirMatch = mockJenkinsfile.match(/PROJECT_DIR = '(.*)'/);

    const imageName = nameMatch ? nameMatch[1] : "default:latest";
    const projectDir = dirMatch ? dirMatch[1] : ".";

    try {
      // Connect to the stream
      const response = await fetch("http://localhost:3001/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageName, projectDir }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        lines.forEach((line) => {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.replace("data: ", ""));
            setLogs((prev) => [...prev, data.log]);

            // Capture Blockchain Success Flag
            if (data.log.includes("BLOCKCHAIN_CONFIRMATION")) {
              setTxHash(data.log.split(": ")[1]);
            }
          }
        });
      }
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        "❌ Error: Ensure server/server.js is running!",
      ]);
    } finally {
      setIsBuilding(false);
    }
  };

  // 2. TRIGGER DEPLOY (Talks to Node.js Backend)
  const startDeploy = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageName: deployImage }),
      });
      const data = await res.json();
      setVerificationResult(data);
    } catch (err) {
      alert("Server error. Is Node running?");
    }
  };

  // 3. REFRESH CURRENT TAB
  const refreshCurrentTab = () => {
    if (activeTab === "ci") {
      // Clear CI workspace
      setLogs([]);
      setIsBuilding(false);
      setTxHash(null);
    } else if (activeTab === "cd") {
      // Clear CD workspace
      setDeployImage("");
      setVerificationResult(null);
    }
    // Scroll to top of main content
    mainContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex h-screen bg-slate-100 font-mono text-sm text-slate-800">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl">
        <div className="p-5 font-bold text-xl text-white border-b border-slate-700 flex items-center gap-2">
          🛡️ ChainGuard
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab("ci")}
            className={`w-full text-left p-3 rounded-md transition-all ${
              activeTab === "ci"
                ? "bg-indigo-600 text-white shadow-lg"
                : "hover:bg-slate-800"
            }`}
          >
            🚀 CI Pipeline
          </button>
          <button
            onClick={() => setActiveTab("cd")}
            className={`w-full text-left p-3 rounded-md transition-all ${
              activeTab === "cd"
                ? "bg-emerald-600 text-white shadow-lg"
                : "hover:bg-slate-800"
            }`}
          >
            📦 CD Deploy
          </button>
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={refreshCurrentTab}
            disabled={isBuilding}
            className={`w-full p-3 rounded-md transition-all flex items-center justify-center gap-2 font-medium ${
              isBuilding
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            }`}
            title="Refresh current workspace"
          >
            <span className="text-lg">🔄</span>
            <span>Refresh</span>
          </button>
        </div>
        <div className="p-4 text-xs text-slate-500 border-t border-slate-800">
          DevSecOps Demo v1.0
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div ref={mainContentRef} className="flex-1 p-10 overflow-auto bg-slate-50">
        
        {/* === CI TAB === */}
        {activeTab === "ci" && (
          // ADDED: min-h-[80vh] to keep size fixed/large
          <div className="max-w-5xl mx-auto space-y-6 min-h-[80vh]">
            <div className="bg-white p-6 shadow-sm rounded-lg border border-slate-200">
              <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                Pipeline Configuration
              </h2>
              <textarea
                className="w-full h-32 bg-slate-900 text-indigo-300 p-4 rounded font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                value={mockJenkinsfile}
                onChange={(e) => setMockJenkinsfile(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={startBuild}
                  disabled={isBuilding}
                  className={`px-6 py-2 rounded font-bold text-white shadow-md transition-all ${
                    isBuilding
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isBuilding ? "Running Pipeline..." : "▶ Build Now"}
                </button>
              </div>
            </div>

            {/* CONSOLE OUTPUT - Fixed height 500px ensures it doesn't jump */}
            <div className="bg-black text-green-500 p-4 rounded-lg shadow-2xl h-[500px] overflow-y-auto font-mono text-xs border border-slate-800 relative">
              <div className="absolute top-0 left-0 right-0 bg-slate-800 p-2 text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-700 sticky">
                Console Output
              </div>
              <div className="mt-8 space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="break-words">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* SUCCESS BADGE */}
            {txHash && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-lg flex items-center gap-4 animate-fade-in-up">
                <div className="bg-green-100 p-2 rounded-full">✅</div>
                <div>
                  <strong className="font-bold block">
                    Build Verified & Signed!
                  </strong>
                  <span className="text-xs opacity-75 break-all">
                    Immutable Record: {txHash}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === CD TAB === */}
        {activeTab === "cd" && (
          // ADDED: min-h-[80vh] prevents this tab from looking "small" compared to CI tab
          <div className="max-w-3xl mx-auto space-y-6 min-h-[80vh]">
            <div className="bg-white p-8 shadow-sm rounded-lg border-l-4 border-emerald-500">
              <h2 className="text-xl font-bold mb-2 text-slate-900">
                Production Deployment
              </h2>
              <p className="text-slate-500 mb-6 text-sm">
                The Admission Controller will query the blockchain to verify the
                image signature before allowing the pull.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  className="w-full border border-slate-300 p-3 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none text-base"
                  placeholder="Image Name (e.g. demo-app:v1.0)"
                  value={deployImage}
                  onChange={(e) => setDeployImage(e.target.value)}
                />
                <button
                  onClick={startDeploy}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 font-bold shadow-md whitespace-nowrap transition-colors"
                >
                  Secure Deploy
                </button>
              </div>
            </div>

            {/* VERIFICATION RESULT */}
            {/* We keep this container here so it fills the min-height naturally */}
            {verificationResult && (
              <div
                className={`p-8 rounded-lg shadow-md text-center border ${
                  verificationResult.success
                    ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                    : "bg-red-50 border-red-100 text-red-900"
                }`}
              >
                {verificationResult.success ? (
                  <>
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold">Integrity Verified</h3>
                    <p className="mt-2 text-emerald-700">
                      Hash matches the immutable ledger.
                    </p>
                    <div className="mt-6 bg-white p-3 rounded border border-emerald-200 inline-block text-xs font-mono text-emerald-600">
                      {verificationResult.hash}
                    </div>
                    <div className="mt-8">
                      <span className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                        🚀 Deploying Container...
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">❌</div>
                    <h3 className="text-2xl font-bold">Verification Failed</h3>
                    <p className="mt-2 text-red-700">
                      This image hash is NOT in the registry.
                    </p>
                    <div className="mt-6">
                      <span className="bg-red-600 text-white px-6 py-2 rounded font-bold uppercase tracking-wider">
                        Deployment Blocked
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
