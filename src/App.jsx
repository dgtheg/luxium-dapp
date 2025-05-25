import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./index.css";
import LuxiumTokenABI from "./LuxiumToken.json";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ✅ Final Deployed Contract Addresses (RSK Testnet)
const TOKEN_ADDRESS = "0xF7542e060847d5391d47df3061E91dF567FFF94A";
const FIBONACCI_MANAGER_ADDRESS = "0x65c01339F2461C065809CE5A955CB510B214B183";

// ABIs
const TOKEN_ABI = LuxiumTokenABI.abi;
const FIBONACCI_ABI = [
  "function getCurrentPrice() public view returns (uint256)",
  "function getCurrentBracket() public view returns (uint256)",
  "function getNextBracket() public view returns (uint256, uint256)"
];

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [tokenBalance, setTokenBalance] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [luxiumPrice, setLuxiumPrice] = useState(null);
  const [currentBracket, setCurrentBracket] = useState(null);
  const [nextBracket, setNextBracket] = useState({ price: null, threshold: null });

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchLuxiumStats();
    }
  }, [walletAddress]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      setIsConnecting(true);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1f" }],
      });

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const selectedAccount = accounts[0];
      setWalletAddress(selectedAccount);

      await fetchBalance(selectedAccount);
      await fetchLuxiumStats();
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Wallet connection failed. See console.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function fetchBalance(account) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const balance = await contract.balanceOf(account);
      setTokenBalance(ethers.formatUnits(balance, 18));
    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  }

  async function fetchLuxiumStats() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FIBONACCI_MANAGER_ADDRESS, FIBONACCI_ABI, provider);

      const price = await contract.getCurrentPrice();
      const bracket = await contract.getCurrentBracket();
      const [nextPrice, nextThreshold] = await contract.getNextBracket();

      setLuxiumPrice(ethers.formatUnits(price, 18));
      setCurrentBracket(bracket.toString());
      setNextBracket({
        price: ethers.formatUnits(nextPrice, 18),
        threshold: ethers.formatUnits(nextThreshold, 18),
      });

      setChartData((prev) => [
        ...prev.slice(-9),
        {
          name: `B${bracket}`,
          price: parseFloat(ethers.formatUnits(price, 18)),
        },
      ]);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }

  async function transferTokens() {
    if (!recipient || !amount || !ethers.isAddress(recipient)) {
      return alert("Please enter a valid recipient and amount.");
    }
    try {
      setTxStatus("Sending...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
      const tx = await contract.transfer(recipient, ethers.parseUnits(amount, 18));
      await tx.wait();
      setTxStatus("Transfer successful!");
      await fetchBalance(walletAddress);
    } catch (err) {
      console.error("Transfer failed:", err);
      setTxStatus("Transfer failed");
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(walletAddress);
      alert("Address copied!");
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <div className="luxury-spinner mb-4"></div>
        <h1 className="luxury-title text-3xl animate-pulse">Loading Luxium...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <img src="/luxiumlogo.jpg" alt="Luxium Logo" className="mb-8" style={{ width: "300px" }} />

      <h1 className="text-3xl font-bold luxury-title luxury-fade-gold">Welcome to Luxium</h1>
      <p className="text-gray-400 mt-2 mb-6">Your gateway to the Luxium Economy</p>

      <button onClick={connectWallet} className="luxury-button mb-4" disabled={isConnecting}>
        {isConnecting ? "Connecting..." : walletAddress ? "Wallet Connected" : "Connect Wallet"}
      </button>

      {walletAddress && (
        <div className="mt-4 text-center text-gray-300 break-words w-80 flex flex-col items-center">
          <div className="flex items-center space-x-2">
            <p className="text-sm">{walletAddress}</p>
            <button onClick={copyAddress} className="luxury-button px-2 py-1 text-xs">Copy</button>
          </div>

          {tokenBalance !== null && (
            <div className="mt-4">
              <p className="text-lg font-bold">Luxium Balance: {tokenBalance} LUX</p>
              <p className="text-md mt-1">
                Value: ${(parseFloat(tokenBalance) * parseFloat(luxiumPrice || 0)).toFixed(6)} USD
              </p>
            </div>
          )}

          <div className="mt-6 text-sm">
            <p>🟢 Current Bracket: {currentBracket}</p>
            <p>💰 Current Price: {luxiumPrice} RBTC</p>
            <p>🟠 Next Price: {nextBracket.price} RBTC</p>
            <p>🔜 Next Threshold: {nextBracket.threshold} LUX</p>
          </div>
        </div>
      )}

      {walletAddress && (
        <div className="mt-6 flex flex-col items-center space-y-4">
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="luxury-input"
          />
          <input
            type="text"
            placeholder="Amount to Transfer"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="luxury-input"
          />
          <button onClick={transferTokens} className="luxury-button">
            Send Tokens
          </button>
          {txStatus && <p className="mt-2 text-gray-400">{txStatus}</p>}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="w-full max-w-2xl mt-8">
          <h2 className="text-xl mb-2 text-center text-gold-400">Live Price Chart</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis domain={['auto', 'auto']} stroke="#fff" />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#facc15" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;