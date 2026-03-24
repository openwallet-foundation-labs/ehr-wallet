# Web3 Integration

EHR Wallet integrates with Web3 technologies including Ethereum blockchain and IPFS for decentralized storage. This document covers the blockchain and IPFS integration architecture.

## Overview

The application uses:
- **Ethereum** for blockchain-based access control
- **IPFS** for decentralized medical data storage
- **Pinata** (optional) for IPFS pinning and retrieval
- **Helia** (optional) for in-browser IPFS operations

## Blockchain Integration

### Access Control Contract

The `lib/web3/contract.ts` module provides functions for interacting with the AccessControl smart contract:

```typescript
import {
  getAccessControlContract,
  createAccessGrant,
  verifyAccess,
  getAccessGrantDetails,
  generateShareableLink
} from '@/lib/web3/contract';
```

#### Key Functions

**`getAccessControlContract()`**
- Returns an ethers.js Contract instance
- Requires MetaMask to be installed
- Uses the contract address from `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS`

**`createAccessGrant(ipfsCid, durationInSeconds, password?)`**
- Creates a new access grant on the blockchain
- Returns a unique `accessId` (bytes32)
- Supports optional password protection

**`verifyAccess(accessId, password?)`**
- Verifies access to a shared resource
- Returns the IPFS CID if access is valid

**`getAccessGrantDetails(accessId)`**
- Retrieves details about an access grant
- Returns: `{ owner, ipfsCid, expiryTime, hasPassword }`

### Contract ABI

The application uses a simplified ABI with these key elements:

```solidity
// Events
event AccessCreated(bytes32 indexed accessId, address indexed owner, string ipfsCid, uint256 expiryTime);
event AccessVerified(bytes32 indexed accessId, address indexed viewer);
event AccessDenied(bytes32 indexed accessId, address indexed viewer, string reason);

// Functions
function createAccess(string memory _ipfsCid, uint256 _durationSeconds, bytes32 _passwordHash) external returns (bytes32 accessId);
function verifyAccess(bytes32 _accessId, string memory _passwordInput) external view returns (string memory ipfsCid);
function getAccessGrantDetails(bytes32 _accessId) external view returns (address owner, string memory ipfsCid, uint256 expiryTime, bool hasPassword);
```

### Fallback Mechanism

If no smart contract is deployed (contract address not configured), the system falls back to direct IPFS-based access management using the database.

## IPFS Integration

### Upload Functions

The `lib/web3/ipfs.ts` module provides IPFS functionality with automatic fallbacks:

```typescript
import {
  uploadToIpfs,
  getFromIpfs,
  getIpfsGatewayUrl,
  checkIpfsAvailability,
  encryptData,
  decryptData
} from '@/lib/web3/ipfs';
```

#### Upload Priority

1. **Pinata** - If credentials are configured
2. **Helia** - In-browser IPFS node
3. **HTTP API** - Infura or other IPFS HTTP API

#### Key Functions

**`uploadToIpfs(data)`**
- Uploads JSON data to IPFS
- Returns the IPFS CID
- Automatically tries Pinata, Helia, then HTTP API

**`getFromIpfs(cidString)`**
- Retrieves data from IPFS
- Uses fallback chain: Pinata -> Helia -> API proxy -> Gateway

**`getIpfsGatewayUrl(cid)`**
- Returns the appropriate gateway URL for a CID
- Uses Pinata gateway if configured, otherwise uses public gateway

**`encryptData(data, password)`**
- Encrypts data using AES-GCM before IPFS upload

**`decryptData(encryptedData, password)`**
- Decrypts AES-GCM encrypted data retrieved from IPFS

## Pinata Service

The `lib/web3/pinata.ts` module provides direct Pinata integration:

```typescript
import { pinataService } from '@/lib/web3/pinata';
```

### Configuration

Configure via environment variables:
- `NEXT_PUBLIC_PINATA_API_KEY`
- `NEXT_PUBLIC_PINATA_SECRET_API_KEY`
- `NEXT_PUBLIC_PINATA_JWT` (alternative to API keys)
- `NEXT_PUBLIC_PINATA_GATEWAY_URL`

### Methods

| Method | Description |
|--------|-------------|
| `isConfigured()` | Check if credentials are set |
| `uploadJSON(jsonData, name?)` | Upload JSON to IPFS |
| `uploadFile(file, name?)` | Upload file to IPFS |
| `getContent(cid)` | Retrieve content from IPFS |
| `isPinned(cid)` | Check if CID is pinned |
| `unpin(cid)` | Unpin content from IPFS |
| `getGatewayUrl(cid)` | Get gateway URL for CID |
| `getPinList(cid?)` | List pinned content |
| `getCidStats(cid)` | Get statistics for a CID |
| `getAccessLogs(cids)` | Get access logs for CIDs |

## Data Flow

### Sharing Medical Data

1. User encrypts medical data (optional)
2. Data is uploaded to IPFS via `uploadToIpfs()`
3. Access grant is created via `createAccessGrant()`
4. Shareable link is generated via `generateShareableLink()`
5. Recipient accesses data using the link

### Accessing Shared Data

1. Recipient clicks shareable link
2. System verifies access via `verifyAccess()`
3. IPFS content is retrieved via `getFromIpfs()`
4. Data is decrypted if password-protected
5. Access count is incremented

## Error Handling

The system includes multiple fallback layers:

1. If Pinata fails, it tries Helia
2. If Helia fails, it uses HTTP API
3. If HTTP API fails, it tries public gateways
4. If all IPFS methods fail, it returns an error

## Browser Requirements

For full Web3 functionality, users need:
- MetaMask browser extension
- Web3-compatible browser

Without MetaMask, the application falls back to database-based access control.
