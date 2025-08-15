<!-- SPDX-License-Identifier: CC-BY-4.0 -->

# EHR Wallet

[![CI Status](https://github.com/sbhavani/health-wallet/actions/workflows/ci.yml/badge.svg)](https://github.com/sbhavani/health-wallet/actions/workflows/ci.yml) [![Smart Contract Tests](https://github.com/sbhavani/health-wallet/actions/workflows/smart-contract.yml/badge.svg)](https://github.com/sbhavani/health-wallet/actions/workflows/smart-contract.yml) [![Dependency Review](https://github.com/sbhavani/health-wallet/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/sbhavani/health-wallet/actions/workflows/dependency-review.yml)

## Project Overview

EHR Wallet is an innovative blockchain-powered healthcare information solution designed to empower patients with full control over their medical data while streamlining healthcare provider workflows. The platform enables secure sharing of medical records, imaging data, and patient information using decentralized web3 technologies.

## Project Roadmap

Track our development progress and upcoming features on our public GitHub Project board:

[View EHR Wallet Roadmap](https://github.com/users/sbhavani/projects/2/views/1)

## Product Screenshot

![EHR Wallet Dashboard](/public/healthwallet-dashboard.png)

## Key Patient-Centric Features

- **Blockchain-Based Health Records**: Secure, immutable patient records stored with Ethereum and IPFS technologies
- **Patient Data Ownership**: Complete control over personal health information with granular access permissions
- **MetaMask Integration**: Connect securely with your Ethereum wallet for identity verification and data access
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

1. **Connect Your Wallet**: Use MetaMask or another Ethereum wallet to connect to the platform
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
- **Ethereum Blockchain**: For secure, verifiable patient record tracking
- **IPFS**: InterPlanetary File System for decentralized storage of medical data
- **Web3.js**: JavaScript library interacting with the Ethereum blockchain
- **MetaMask**: Wallet integration for secure patient authentication
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
- **User**: Extended with Ethereum address for blockchain identity
- **Patient**: Core medical information with blockchain references
- **HealthRecord**: Individual health record entries with IPFS content identifiers
- **AccessGrant**: Smart contract-based permissions for record access
- **Appointment**: Scheduled medical imaging appointments
- **Provider**: Healthcare providers with verified blockchain identities

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## Maintainers

This project is maintained by:

- [@sbhavani](https://github.com/sbhavani)
- [@rstellar](https://github.com/rstellar)

## Documentation License

This documentation is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).
