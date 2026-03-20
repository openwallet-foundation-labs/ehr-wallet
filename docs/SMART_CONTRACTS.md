# Smart Contracts

EHR Wallet uses Ethereum smart contracts for blockchain-based access control to medical records stored on IPFS.

## Overview

Two smart contracts are available:

1. **AccessControl** - Base contract for access management
2. **FHIRAccessControl** - Extended contract with FHIR resource support

## Contracts

### AccessControl.sol

Location: `contracts/AccessControl.sol`

A simple, gas-efficient contract for managing time-limited access to IPFS-stored medical data.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AccessControl {
    struct AccessGrant {
        address owner;
        string ipfsCid;
        uint256 expiryTime;
        bytes32 passwordHash;
        bool exists;
    }

    mapping(bytes32 => AccessGrant) public accessGrants;

    // Events
    event AccessCreated(bytes32 indexed accessId, address indexed owner, string ipfsCid, uint256 expiryTime);
    event AccessVerified(bytes32 indexed accessId, address indexed viewer);
    event AccessDenied(bytes32 indexed accessId, address indexed viewer, string reason);
}
```

#### Key Features

- **Time-limited access**: Access grants automatically expire
- **Optional password protection**: Supports encrypted data access
- **Event logging**: All access events are logged on-chain
- **Gas optimized**: Minimal storage operations

#### Functions

**`createAccess(string _ipfsCid, uint256 _durationSeconds, bytes32 _passwordHash)`**
- Creates a new access grant
- Parameters:
  - `_ipfsCid`: IPFS CID of the data
  - `_durationSeconds`: Duration until expiry
  - `_passwordHash`: Hash of password (use `bytes32(0)` for no password)
- Returns: `bytes32` - Unique access ID

**`verifyAccess(bytes32 _accessId, string _passwordInput)`**
- Verifies access and returns IPFS CID
- Parameters:
  - `_accessId`: Access grant ID
  - `_passwordInput`: Password attempt (empty if not required)
- Returns: `string` - IPFS CID

**`getAccessGrantDetails(bytes32 _accessId)`**
- Retrieves access grant information
- Returns: `(address owner, string ipfsCid, uint256 expiryTime, bool hasPassword)`

### FHIRAccessControl.sol

Location: `contracts/FHIRAccessControl.sol`

Extended contract with FHIR R4 resource support for interoperable healthcare data sharing.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FHIRAccessControl {
    struct FHIRAccessGrant {
        address owner;
        string ipfsCid;
        uint256 expiryTime;
        bytes32 passwordHash;
        string fhirResourceType;
        string fhirResourceId;
        string fhirVersion;
        string[] resourceTypes;
        bool exists;
    }

    mapping(bytes32 => FHIRAccessGrant) public accessGrants;
    mapping(address => bytes32[]) public ownerGrants;
    mapping(string => bytes32[]) public resourceGrants;
}
```

#### Key Features

- **FHIR R4 support**: Stores FHIR resource metadata
- **Resource indexing**: Query grants by FHIR resource ID
- **Owner tracking**: View all grants by owner address
- **Revocation**: Early access revocation supported

#### Additional Functions

**`createFHIRAccess(...)`**
- Creates FHIR-enabled access grant with additional metadata

**`verifyFHIRAccess(bytes32 _accessId, string _passwordInput)`**
- Returns FHIR metadata along with IPFS CID

**`getFHIRAccessDetails(bytes32 _accessId)`**
- Returns complete FHIR access grant details

**`revokeFHIRAccess(bytes32 _accessId)`**
- Revokes access before expiry (owner only)

**`getGrantsByOwner(address _owner)`**
- Returns all grants for an owner

**`getGrantsByResourceId(string _fhirResourceId)`**
- Returns all grants for a FHIR resource

**`isAccessValid(bytes32 _accessId)`**
- Checks if an access grant is valid

## Deployment

### Networks Supported

| Network | Chain ID | Type |
|---------|----------|------|
| Ethereum Mainnet | 1 | Production |
| Sepolia | 11155111 | Testnet |
| Polygon Mainnet | 137 | Production |
| Amoy | 80002 | Testnet |

### Deployment Scripts

Use Hardhat scripts for deployment:

```bash
# Deploy to Amoy testnet
npx hardhat run scripts/deploy.js --network amoy

# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.js --network polygon

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy.js --network ethereum
```

### Post-Deployment

1. The deployment script automatically:
   - Saves deployment info to `deployments/{network}.json`
   - Updates `.env.local` with `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS`

2. Verify on block explorer:
   ```bash
   npx hardhat verify --network amoy <CONTRACT_ADDRESS>
   ```

## Integration

### Frontend Integration

```typescript
import { getAccessControlContract, createAccessGrant } from '@/lib/web3/contract';

// Create access grant
const accessId = await createAccessGrant(
  'QmXxx...',  // IPFS CID
  86400,       // 24 hours in seconds
  'optional-password'
);
```

### Contract Address Configuration

Set the deployed contract address:

```
NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

## Security Considerations

1. **Password hashing**: Uses `keccak256` for password hashing
2. **Access expiry**: Automatic expiration prevents long-term unauthorized access
3. **Event logging**: All access events are recorded on-chain for auditability
4. **Owner verification**: Critical functions verify caller ownership

## Gas Costs (Estimates)

| Operation | Gas Estimate |
|-----------|--------------|
| `createAccess` | ~100,000 gas |
| `verifyAccess` | ~50,000 gas |
| `getAccessGrantDetails` | ~30,000 gas |
| `revokeFHIRAccess` | ~40,000 gas |

## Fallback Mechanism

If no smart contract is deployed, the application falls back to database-based access control via the `/api/shared-data` endpoints. This allows testing without blockchain infrastructure.
