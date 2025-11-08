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
  networks: {
    hardhat: {
      chainId: 1337
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
