<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# EHR Wallet

[![CI Status](https://github.com/sbhavani/health-wallet/actions/workflows/ci.yml/badge.svg)](https://github.com/sbhavani/health-wallet/actions/workflows/ci.yml) [![Smart Contract Tests](https://github.com/sbhavani/health-wallet/actions/workflows/smart-contract.yml/badge.svg)](https://github.com/sbhavani/health-wallet/actions/workflows/smart-contract.yml)

## Project Overview

EHR Wallet is an innovative blockchain-powered healthcare information solution designed to empower patients with full control over their medical data while streamlining healthcare provider workflows. The platform enables secure sharing of medical records, imaging data, and patient information using decentralized web3 technologies.

## Project Roadmap

Track our development progress and upcoming features on our public GitHub Project board:

[View EHR Wallet Roadmap](https://github.com/users/sbhavani/projects/2/views/1)

## Product Screenshot

![EHR Wallet Dashboard](/public/healthwallet-dashboard.png)

## Key Patient-Centric Features

- **Blockchain-Based Health Records**: Secure, immutable patient records stored on blockchain with IPFS technologies
- **Patient Data Ownership**: Complete control over personal health information with granular access permissions
- **MetaMask Integration**: Connect securely with your Web3 wallet for identity verification and data access
- **Selective Data Sharing**: Share specific medical records with authorized providers via smart contracts
- **Advanced Patient Portal**: View, manage, and track all personal health information through an intuitive interface
- **Smart Filtering Options**: Filter personal medical history by Last Visit date or Date of Birth with user-friendly calendar interface
- **Appointment Management**: Schedule and track medical imaging appointments with ease
- **Responsive Design**: Modern UI that works seamlessly across all devices

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## Access the Application

After starting the development server, you can access the application at:

```
http://localhost:3000
```

## Web3 Patient Features

### Setting Up Your EHR Wallet

1. **Connect Your Wallet**: Use MetaMask or another Web3 wallet to connect to the platform
2. **Grant Initial Access**: Approve the connection to establish your EHR Wallet identity
3. **Verify Your Identity**: Complete the secure verification process to ensure data sovereignty

### Managing Your Health Data

1. **Data Access Control**: Manage which healthcare providers can access your records
2. **View Shared Records**: See a complete history of which providers have accessed your data
3. **Revoke Access**: Remove access permissions at any time with a simple interface

### Patient Record Sharing

1. **Selective Sharing**: Share only specific medical records or imaging results
2. **Time-Based Access**: Grant temporary access to providers for limited periods
3. **Emergency Access**: Special protocols for emergency situations that require immediate data access

## Tech Stack

This project leverages modern web and blockchain technologies:

- **Next.js**: React framework providing hybrid static & server rendering
- **TypeScript**: For type safety and improved developer experience
- **Blockchain**: Polygon network for secure, verifiable patient record tracking with low transaction costs
- **IPFS**: InterPlanetary File System for decentralized storage of medical data
- **Ethers.js**: JavaScript library for blockchain interactions
- **MetaMask**: Wallet integration for secure patient authentication
- **Hardhat**: Ethereum development environment for smart contract deployment
- **Prisma**: ORM for traditional database access
- **shadcn/ui**: Modern component library for the user interface
- **Tailwind CSS**: Utility-first CSS framework
- **NextAuth.js**: Authentication solution for traditional login methods

## Project Structure

- `/pages`: Next.js pages and API routes
- `/components`: Reusable React components including patient data sharing interfaces
- `/contracts`: Smart contracts for patient data access management
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/styles`: Global CSS and Tailwind configuration
- `/lib`: Utility functions, blockchain integrations, and IPFS clients

## Data Models

The application manages several key models related to patient data:
- **User**: Extended with Web3 address for blockchain identity
- **Patient**: Core medical information with blockchain references
- **HealthRecord**: Individual health record entries with IPFS content identifiers
- **AccessGrant**: Smart contract-based permissions for record access
- **Appointment**: Scheduled medical imaging appointments
- **Provider**: Healthcare providers with verified blockchain identities

## Smart Contract Deployment

The EHR Wallet uses smart contracts deployed on Polygon network for secure access control.

### Prerequisites

1. **Set up environment variables**: Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```

2. **Required environment variables**:
   - `POLYGON_API_KEY`: Get from [Alchemy](https://www.alchemy.com/)
   - `WALLET_PRIVATE_KEY`: Your wallet's private key (NEVER commit this!)
   - `POLYGONSCAN_API_KEY`: Get from [PolygonScan](https://polygonscan.com/apis)

3. **Fund your wallet**: Ensure your wallet has MATIC tokens
   - For testnet: Get free MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
   - For mainnet: Purchase MATIC from an exchange

### Deploy to Polygon Amoy Testnet

```bash
# Option 1: Using the deployment script
./scripts/deploy-testnet.sh

# Option 2: Using npm
npm run deploy:testnet

# Option 3: Using hardhat directly
npx hardhat run scripts/deploy.js --network amoy
```

### Deploy to Polygon Mainnet

```bash
# Option 1: Using the deployment script (includes confirmation prompt)
./scripts/deploy-mainnet.sh

# Option 2: Using npm
npm run deploy:mainnet

# Option 3: Using hardhat directly
npx hardhat run scripts/deploy.js --network polygon
```

### Verify Contract on PolygonScan

After deployment, verify your contract to make the source code publicly available:

```bash
# For Amoy testnet
npx hardhat verify --network amoy <CONTRACT_ADDRESS>

# For Polygon mainnet
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

### Deployment Artifacts

After successful deployment:
- Contract address is saved to `deployments/<network>.json`
- `.env.local` is automatically updated with `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS`
- View your deployment on PolygonScan:
  - Testnet: `https://amoy.polygonscan.com/address/<CONTRACT_ADDRESS>`
  - Mainnet: `https://polygonscan.com/address/<CONTRACT_ADDRESS>`

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## Maintainers

This project is maintained by:

- [@sbhavani](https://github.com/sbhavani)
- [@rstellar](https://github.com/rstellar)

## Documentation License

This documentation is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).
