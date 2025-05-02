const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://public-node.testnet.rsk.co");

  const tokenAddress = "0x1c6292d9D640EA906268C58c2B599181adac425D"; // LuxiumToken (proxy)
  const walletAddress = "0x594122816b11942F1e77715f1D8D6289d5CcF1c2";

  const abi = [
    "function balanceOf(address) view returns (uint256)"
  ];

  const token = new ethers.Contract(tokenAddress, abi, provider);

  try {
    const balance = await token.balanceOf(walletAddress);
    console.log("✅ Balance:", ethers.formatUnits(balance, 18), "LUX");
  } catch (err) {
    console.error("❌ balanceOf() failed:", err);
  }
}

main();