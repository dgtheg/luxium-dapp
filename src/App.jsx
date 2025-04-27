// src/App.jsx
import { useState } from "react";
import { ethers } from "ethers";
import "./index.css";

// Replace with your real deployed Luxium token contract address
const TOKEN_ADDRESS = "0xYourTokenContractAddress";
const TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [tokenBalance, setTokenBalance] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");

  async function connectWallet() {
    if (!window.ethereum) {
      return alert("MetaMask is not installed!");
    }
    try {
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(account);
      await fetchBalance(account);
    } catch (err) {
      console.error("Connection error", err);
    }
  }

  async function fetchBalance(account) {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
      const raw = await contract.balanceOf(account);
      setTokenBalance(ethers.utils.formatUnits(raw, 18));
    } catch (err) {
      console.error("Balance fetch error", err);
    }
  }

  async function transferTokens() {
    if (!recipient || !amount) {
      return alert("Enter recipient and amount");
    }
    try {
      setTxStatus("Sending…");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);

      const tx = await contract.transfer(recipient, ethers.utils.parseUnits(amount, 18));
      await tx.wait();
      setTxStatus("Transfer successful!");
      fetchBalance(walletAddress);
    } catch (err) {
      console.error("Transfer failed", err);
      setTxStatus("Transfer failed");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <img
        src="/luxiumlogo.jpg"
        alt="Luxium Logo"
        className="mb-8"
        style={{ width: "300px", height: "auto" }}
      />

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-800 luxury-title luxury-fade-gold">
        Welcome to Luxium
      </h1>

      <p className="text-gray-500 mt-2 mb-6">Your gateway to the Luxium Economy</p>

      {/* Connect Wallet Button */}
      <button
        onClick={connectWallet}
        className="luxury-button"
      >
        {walletAddress ? "Wallet Connected" : "Connect Wallet"}
      </button>

      {/* Wallet Address */}
      {walletAddress && (
        <p className="mt-4 text-gray-600 break-words w-80 text-center">
          Connected Address:<br /> {walletAddress}
        </p>
      )}

      {/* Token Balance */}
      {tokenBalance !== null && (
        <p className="mt-2 text-gray-700">
          Your Luxium Token Balance: <strong>{tokenBalance}</strong>
        </p>
      )}

      {/* Transfer Form */}
      {walletAddress && (
        <div className="mt-6 flex flex-col items-center space-y-4">
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="luxury-input"
            style={{ width: "85%" }}
          />
          <input
            type="text"
            placeholder="Amount to Transfer"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="luxury-input"
            style={{ width: "85%" }}
          />
          <button
            onClick={transferTokens}
            className="luxury-button"
            style={{ width: "85%" }}
          >
            Send Tokens
          </button>
          {txStatus && <p className="mt-2 text-gray-600">{txStatus}</p>}
        </div>
      )}
    </div>
  );
}

export default App;