<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# EHR Wallet

[![CI Status](https://github.com/openwallet-foundation-labs/ehr-wallet/actions/workflows/ci.yml/badge.svg)](https://github.com/openwallet-foundation-labs/ehr-wallet/actions/workflows/ci.yml)
[![Smart Contract Tests](https://github.com/openwallet-foundation-labs/ehr-wallet/actions/workflows/smart-contract.yml/badge.svg)](https://github.com/openwallet-foundation-labs/ehr-wallet/actions/workflows/smart-contract.yml)
[![Dependency Security](https://github.com/openwallet-foundation-labs/ehr-wallet/actions/workflows/dependency-security.yml/badge.svg)](https://github.com/openwallet-foundation-labs/ehr-wallet/actions/workflows/dependency-security.yml)

## Project Overview

EHR Wallet is an innovative blockchain-powered healthcare information solution designed to empower patients with full control over their medical data while streamlining healthcare provider workflows. The platform enables secure sharing of medical records, imaging data, and patient information using decentralized web3 technologies.

## Project Roadmap

Track our development progress and upcoming features in our roadmap document:

[View EHR Wallet Roadmap](./docs/PRD.md)

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

The only requirement is having Node.js & [pnpm](https://pnpm.io/) installed - [install Node.js with nvm](https://github.com/nvm-sh/nvm#installing-and-updating), then enable pnpm via Corepack:

```bash
corepack enable pnpm
```

Then install dependencies and start the development server:

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

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

- **Next.js 16**: React framework providing hybrid static & server rendering
- **React 18 + TypeScript**: For type safety and improved developer experience
- **Polygon**: Primary network for secure, verifiable patient record tracking with low transaction costs, with Ethereum (Sepolia/mainnet) as fallback support
- **IPFS (Helia)**: Decentralized storage of medical data via the Helia IPFS client, with optional Pinata pinning
- **Ethers.js v6**: JavaScript library for blockchain interactions
- **MetaMask**: Wallet integration for secure patient authentication
- **Hardhat**: Ethereum development environment for smart contract deployment and testing
- **Prisma + SQLite (better-sqlite3)**: ORM and local database for application data
- **NextAuth.js**: Authentication solution for traditional login methods
- **Mantine + shadcn/ui (Radix)**: Modern component libraries for the user interface
- **Tailwind CSS**: Utility-first CSS framework
- **Dexie (IndexedDB)**: Offline-first patient data storage with background sync
- **next-pwa**: Progressive Web App support for offline access
- **Jest + Playwright**: Unit and end-to-end testing

## Project Structure

- `/pages`: Next.js pages and API routes
- `/components`: Reusable React components including patient data sharing interfaces
- `/contracts`: Smart contracts (`AccessControl.sol`, `FHIRAccessControl.sol`) for patient data access management
- `/hooks`: Custom React hooks (appointments, PWA, media queries)
- `/lib`: Utility functions, blockchain integrations, FHIR helpers, and IPFS clients
- `/prisma`: Database schema, migrations, and seed scripts
- `/services`: Patient business logic services
- `/test`: Smart contract tests (Hardhat) and Playwright end-to-end tests
- `/__tests__`: Jest unit and API tests
- `/scripts`: Deployment, seeding, and utility scripts
- `/public`: Static assets
- `/styles`: Global CSS and Tailwind configuration
- `/docs`: Product, API, and architecture documentation

## Data Models

The application manages several key models related to patient data:
- **User**: Role-based accounts (Admin, Doctor, Staff, Patient) with optional Web3 address for blockchain identity
- **Patient**: Core demographic and medical information with visits and appointments
- **Visit**: Patient visit records linked to a patient
- **Provider**: Healthcare providers with specialties, availability time slots, and appointments
- **AppointmentType**: Configurable appointment types (duration, calendar color)
- **TimeSlot**: Provider availability windows
- **Appointment**: Scheduled medical imaging appointments with status tracking
- **SharedMedicalData**: Records shared via IPFS content identifiers, with access expiry, password protection, access counting, and activation state

## Smart Contract Deployment

The EHR Wallet uses smart contracts (`AccessControl.sol` and `FHIRAccessControl.sol`) deployed on the Polygon network for secure access control.

### Prerequisites

1. **Set up environment variables**: Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```

2. **Required environment variables**:
   - `POLYGON_API_KEY`: Get from [Alchemy](https://www.alchemy.com/)
   - `WALLET_PRIVATE_KEY`: Your wallet's private key (NEVER commit this!)
   - `POLYGONSCAN_API_KEY`: Get from [PolygonScan](https://polygonscan.com/apis)
   - Ethereum fallback (optional): `ETHEREUM_API_KEY` and `ETHERSCAN_API_KEY`
   - App configuration: `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
   - Optional IPFS pinning: `PINATA_API_KEY` and `PINATA_SECRET_KEY`

3. **Fund your wallet**: Ensure your wallet has MATIC tokens
   - For testnet: Get free MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
   - For mainnet: Purchase MATIC from an exchange

### Deploy to a Local Network

```bash
pnpm deploy:localhost
```

### Deploy to Polygon Amoy Testnet

```bash
# Option 1: Using the deployment script
./scripts/deploy-testnet.sh

# Option 2: Using pnpm
pnpm deploy:testnet

# Option 3: Using hardhat directly
npx hardhat run scripts/deploy.js --network amoy
```

### Deploy to Polygon Mainnet

```bash
# Option 1: Using the deployment script (includes confirmation prompt)
./scripts/deploy-mainnet.sh

# Option 2: Using pnpm
pnpm deploy:mainnet

# Option 3: Using hardhat directly
npx hardhat run scripts/deploy.js --network polygon
```

### Verify Contract on PolygonScan

After deployment, verify your contract to make the source code publicly available:

```bash
# For Amoy testnet
pnpm verify:testnet -- <CONTRACT_ADDRESS>

# For Polygon mainnet
pnpm verify:mainnet -- <CONTRACT_ADDRESS>
```

### Deployment Artifacts

After successful deployment:
- Contract address is saved to `deployments/<network>.json`
- `.env.local` is automatically updated with `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS`
- View your deployment on PolygonScan:
  - Testnet: `https://amoy.polygonscan.com/address/<CONTRACT_ADDRESS>`
  - Mainnet: `https://polygonscan.com/address/<CONTRACT_ADDRESS>`

## Testing

The project includes unit, API, smart contract, and end-to-end tests:

```bash
# Jest unit and API tests
pnpm test

# Test coverage report
pnpm test:coverage

# Smart contract tests (Hardhat)
pnpm test:hardhat

# End-to-end tests (Playwright)
pnpm test:e2e

# Reset and reseed the local database
pnpm db:reset && pnpm db:seed
```

## Documentation

For detailed documentation, see the `/docs` folder:

- [Product Roadmap](./docs/PRD.md) - Feature roadmap and milestones
- [OSS Roadmap](./docs/OSS_ROADMAP.md) - Open-source project roadmap
- [FHIR Implementation](./docs/FHIR_IMPLEMENTATION.md) - Healthcare data standards
- [API Documentation](./docs/API.md) - API endpoints reference
- [Cost Optimization](./docs/COST_OPTIMIZATION_ARCHITECTURE.md) - Infrastructure cost analysis
- [Walkthrough](./docs/WALKTHROUGH.md) - Guided tour of the application
- [Testing Guide](./docs/testing-guide.md) - How to run and write tests
- [Community Meetings](./docs/COMMUNITY_MEETINGS.md) - Meeting notes and schedule
- [TSC Procedures](./docs/TSC_PROCEDURES.md) - Technical Steering Committee procedures

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## Maintainers

This project is maintained by:

- [@sbhavani](https://github.com/sbhavani)
- [@rstellar](https://github.com/rstellar)

## Documentation License

This documentation is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

## Governance

The Project Charter for EHR Wallet can be found here: [https://github.com/openwallet-foundation/technical-project-charters/blob/main/EHR%20Wallet%20Technical%20Charter%20(FINAL%2009.09.25).pdf](https://github.com/openwallet-foundation/technical-project-charters/blob/main/EHR%20Wallet%20Technical%20Charter%20(FINAL%2009.09.25).pdf)
