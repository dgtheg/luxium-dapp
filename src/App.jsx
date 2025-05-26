// src/App.jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./index.css";
import LuxiumTokenABI from "./LuxiumToken.json";

const TOKEN_ADDRESS = "0xF7542e060847d5391d47df3061E91dF567FFF94A";
const FIBONACCI_MANAGER_ADDRESS = "0x65c01339F2461C065809CE5A955CB510B214B183";

const TOKEN_ABI = LuxiumTokenABI.abi;
const FIBONACCI_ABI = [
  "function getCurrentPrice() view returns (uint256)",
  "function getCurrentBracket() view returns (uint256)",
  "function getNextBracket() view returns (uint256,uint256)"
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
  const [nextBracketInfo, setNextBracketInfo] = useState({ price: null, threshold: null });
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      const interval = setInterval(fetchLuxiumPrice, 10000);
      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  async function connectWallet() {
    if (!window.ethereum) return alert("MetaMask is not installed!");

    try {
      setIsConnecting(true);
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1f" }],
      });
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const selectedAccount = accounts[0];
      setWalletAddress(selectedAccount);
      await fetchAll(selectedAccount);
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Wallet connection failed. See console.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function fetchAll(account) {
    await fetchBalance(account);
    await fetchLuxiumPrice();
    await fetchCurrentBracket();
    await fetchNextBracket();
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

  async function fetchLuxiumPrice() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FIBONACCI_MANAGER_ADDRESS, FIBONACCI_ABI, provider);
      const price = await contract.getCurrentPrice();
      const formattedPrice = parseFloat(ethers.formatUnits(price, 18));
      setLuxiumPrice(formattedPrice);
      setPriceHistory(prev => [...prev.slice(-19), {
        time: new Date().toLocaleTimeString(),
        price: formattedPrice
      }]);
    } catch (err) {
      console.warn("Price fetch failed:", err);
      setLuxiumPrice("0.0001");
    }
  }

  async function fetchCurrentBracket() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FIBONACCI_MANAGER_ADDRESS, FIBONACCI_ABI, provider);
      const bracket = await contract.getCurrentBracket();
      setCurrentBracket(bracket.toString());
    } catch (err) {
      console.error("Bracket fetch error:", err);
    }
  }

  async function fetchNextBracket() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FIBONACCI_MANAGER_ADDRESS, FIBONACCI_ABI, provider);
      const [nextPrice, nextThreshold] = await contract.getNextBracket();
      setNextBracketInfo({
        price: ethers.formatUnits(nextPrice, 18),
        threshold: ethers.formatUnits(nextThreshold, 18),
      });
    } catch (err) {
      console.warn("Next bracket fetch failed:", err);
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
      await fetchAll(walletAddress);
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
                Value: ${(parseFloat(tokenBalance) * parseFloat(luxiumPrice || "0")).toFixed(6)} USD
              </p>
            </div>
          )}
        </div>
      )}

      {walletAddress && (
        <div className="mt-6 text-center text-sm">
          <p>🟢 <strong>Current Bracket:</strong> {currentBracket}</p>
          <p>💰 <strong>Current Price:</strong> {luxiumPrice} RBTC</p>
          <p>🟠 <strong>Next Price:</strong> {nextBracketInfo.price} RBTC</p>
          <p>🧱 <strong>Next Threshold:</strong> {nextBracketInfo.threshold} LUX</p>
        </div>
      )}

      {walletAddress && (
        <div className="mt-6 w-full max-w-lg">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fill: 'white' }} />
              <YAxis tick={{ fill: 'white' }} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#FFD700" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
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
    </div>
  );
}

export default App;