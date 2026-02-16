// Import Hardhat plugins
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });

// Load environment variables if available (add them to .env.local)
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ETHEREUM_API_KEY = process.env.ETHEREUM_API_KEY || "";
const POLYGON_API_KEY = process.env.POLYGON_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  // Default network set to Polygon Amoy testnet
  defaultNetwork: "amoy",
  // Exclude Playwright tests from Hardhat test runner
  test: {
    exclude: ["test/playwright/**"],
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: [
        // Hardhat built-in test accounts (for local development only)
        { privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", balance: "10000000000000000000000" },
        { privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", balance: "10000000000000000000000" },
        { privateKey: "0x5de4111afa1a4b9eab820bd8afeb98b28d950a0a3d96f37a0b7f8f6ff70f2a5d", balance: "10000000000000000000000" },
        { privateKey: "0x7c852118294e51e653712a8e804c9b3f42f5f26f74c889aa9d1a6a3cd8c2dd5e", balance: "10000000000000000000000" },
        { privateKey: "0xd5e9a21f4000f582d50034b8a3f4c28c68f9d521601d8c9c8e16c5c5c6c89f0e", balance: "10000000000000000000000" },
      ]
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      accounts: [PRIVATE_KEY]
    },
    // Polygon testnet (Amoy - replaces deprecated Mumbai)
    amoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${POLYGON_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: 35000000000 // 35 gwei
    },
    // Polygon mainnet
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${POLYGON_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 137,
      gasPrice: 35000000000 // 35 gwei
    },
    // Ethereum networks (fallback support)
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ETHEREUM_API_KEY}`,
      accounts: [PRIVATE_KEY]
    },
    ethereum: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ETHEREUM_API_KEY}`,
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  // Generate TypeScript bindings for the contracts
  typechain: {
    outDir: "./types/contracts",
    target: "ethers-v6"
  }
};
