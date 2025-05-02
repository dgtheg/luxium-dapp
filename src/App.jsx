import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./index.css";
import LuxiumTokenABI from "./LuxiumToken.json";

// ✅ Deployed Contract Addresses (RSK Testnet)
const TOKEN_ADDRESS = "0x1c6292d9D640EA906268C58c2B599181adac425D";
const FIBONACCI_MANAGER_ADDRESS = "0x3DA33F11b25BC619DbC1956f43BA655FD3d6Ce2C";

// ABIs
const TOKEN_ABI = LuxiumTokenABI.abi;
const FIBONACCI_ABI = [
  "function getCurrentPrice() public view returns (uint256)"
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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask is not installed!");
      return;
    }

    try {
      setIsConnecting(true);

      // ✅ ONLY switch to RSK Testnet (no add!)
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1f" }], // 31 in decimal
      });

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const selectedAccount = accounts[0];
      setWalletAddress(selectedAccount);

      await fetchBalance(selectedAccount);
      await fetchLuxiumPrice();
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

  async function fetchLuxiumPrice() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(FIBONACCI_MANAGER_ADDRESS, FIBONACCI_ABI, provider);
      const price = await contract.getCurrentPrice();
      setLuxiumPrice(ethers.formatUnits(price, 18));
    } catch (err) {
      console.warn("Price fetch failed, using fallback value.");
      setLuxiumPrice("1.25");
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
                Value: $
                {(parseFloat(tokenBalance) * parseFloat(luxiumPrice)).toFixed(2)} USD
              </p>
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
    </div>
  );
}

export default App;