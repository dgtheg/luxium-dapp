import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./index.css";
import LuxiumTokenABI from "./LuxiumToken.json";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// ✅ Contract addresses
const TOKEN_ADDRESS = "0x2b460Ec66AD7F427370b17A951e0135cc17eD7B3";
const FIBONACCI_MANAGER_ADDRESS = "0x6cbaD1f82fd9F454a1508B7cF31B386C7E1072f9";

// ✅ ABIs
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
  const [chartData, setChartData] = useState([]);
  const [currentBracket, setCurrentBracket] = useState(null);
  const [nextBracketInfo, setNextBracketInfo] = useState({ price: null, threshold: null });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      const interval = setInterval(() => {
        fetchLuxiumPrice();
      }, 15000);
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
      const account = accounts[0];
      setWalletAddress(account);

      await fetchBalance(account);
      await fetchLuxiumPrice();
    } catch (err) {
      console.error("Wallet connection failed:", err);
      alert("Wallet connection failed.");
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

  async function fetchLuxiumPrice() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FIBONACCI_MANAGER_ADDRESS, FIBONACCI_ABI, provider);

      const [price, bracket, next] = await Promise.all([
        contract.getCurrentPrice(),
        contract.getCurrentBracket(),
        contract.getNextBracket(),
      ]);

      const priceFormatted = parseFloat(ethers.formatUnits(price, 18));
      setLuxiumPrice(priceFormatted.toFixed(6));
      setCurrentBracket(bracket.toString());

      setNextBracketInfo({
        price: parseFloat(ethers.formatUnits(next[0], 18)).toFixed(6),
        threshold: ethers.formatUnits(next[1], 18),
      });

      setChartData((prev) => [
        ...prev.slice(-19),
        { time: new Date().toLocaleTimeString(), price: priceFormatted },
      ]);
    } catch (err) {
      console.error("Price fetch error:", err);
    }
  }

  async function transferTokens() {
    if (!recipient || !amount || !ethers.isAddress(recipient)) {
      return alert("Enter a valid recipient and amount.");
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
      <img src="/luxiumlogo.jpg" alt="Luxium Logo" className="mb-6" style={{ width: "300px" }} />
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

          {tokenBalance && (
            <div className="mt-4">
              <p className="text-lg font-bold">Balance: {tokenBalance} LUX</p>
              <p>Price: ${luxiumPrice} / LUX</p>
              <p className="text-sm mt-1">Bracket: #{currentBracket}</p>
              <p className="text-sm">Next: ${nextBracketInfo.price} @ {nextBracketInfo.threshold} LUX</p>
            </div>
          )}
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
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-xl mb-2 font-bold text-center">LUX Price Chart</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="time" stroke="#aaa" />
              <YAxis stroke="#aaa" domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="price" stroke="#FFD700" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default App;