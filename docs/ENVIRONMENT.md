# Environment Variables

This document lists all environment variables used in EHR Wallet.

## Quick Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Application URL for NextAuth |
| `NEXTAUTH_SECRET` | Yes | Secret for NextAuth session encryption |
| `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS` | No | Ethereum contract address |
| `POLYGON_API_KEY` | No | Alchemy API key for Polygon |
| `ETHEREUM_API_KEY` | No | Alchemy API key for Ethereum |
| `WALLET_PRIVATE_KEY` | No | Wallet private key for deployments |
| `PINATA_API_KEY` | No | Pinata API key |
| `PINATA_SECRET_KEY` | No | Pinata secret key |
| `NEXT_PUBLIC_PINATA_JWT` | No | Pinata JWT token |
| `NEXT_PUBLIC_IPFS_PROJECT_ID` | No | Infura IPFS project ID |
| `NEXT_PUBLIC_IPFS_PROJECT_SECRET` | No | Infura IPFS project secret |

## Database

### `DATABASE_URL`

PostgreSQL connection string.

```
DATABASE_URL=postgresql://user:password@localhost:5432/ehr_wallet?schema=public
```

Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

## Authentication (NextAuth)

### `NEXTAUTH_URL`

Base URL of the application.

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://ehr-wallet.example.com
```

### `NEXTAUTH_SECRET`

Secret used to encrypt NextAuth JWT tokens.

```
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Blockchain

### `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS`

Ethereum address of the deployed AccessControl smart contract.

```
NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### `POLYGON_API_KEY`

Alchemy API key for Polygon network operations.

```
POLYGON_API_KEY=your_polygon_alchemy_api_key_here
```

Get an API key from [Alchemy](https://www.alchemy.com/).

### `ETHEREUM_API_KEY`

Alchemy API key for Ethereum mainnet/testnet operations.

```
ETHEREUM_API_KEY=your_ethereum_alchemy_api_key_here
```

### `WALLET_PRIVATE_KEY`

Private key of the wallet used to deploy smart contracts.

```
WALLET_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
```

**Security Warning:** Never commit this to version control! Use `.env.local` and add it to `.gitignore`.

### `POLYGONSCAN_API_KEY`

PolygonScan API key for contract verification.

```
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
```

### `ETHERSCAN_API_KEY`

Etherscan API key for contract verification.

```
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

## IPFS Configuration

### Pinata (Recommended)

Pinata provides reliable IPFS pinning services.

```
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
# Or use JWT token
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token_here
```

Get credentials from [Pinata](https://www.pinata.cloud/).

### `NEXT_PUBLIC_PINATA_GATEWAY_URL`

Custom Pinata gateway URL (optional).

```
NEXT_PUBLIC_PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs
```

### Infura IPFS

Alternative IPFS provider.

```
NEXT_PUBLIC_IPFS_PROJECT_ID=your_infura_project_id
NEXT_PUBLIC_IPFS_PROJECT_SECRET=your_infura_project_secret
NEXT_PUBLIC_IPFS_NODE_URL=https://ipfs.infura.io:5001/api/v0
```

### `NEXT_PUBLIC_IPFS_GATEWAY_URL`

Public IPFS gateway fallback.

```
NEXT_PUBLIC_IPFS_GATEWAY_URL=https://ipfs.io/ipfs
```

## Client-Side Variables (NEXT_PUBLIC)

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS` | - | Smart contract address |
| `NEXT_PUBLIC_PINATA_API_KEY` | - | Pinata API key (public) |
| `NEXT_PUBLIC_PINATA_GATEWAY_URL` | `https://gateway.pinata.cloud/ipfs` | Pinata gateway |
| `NEXT_PUBLIC_IPFS_PROJECT_ID` | - | Infura project ID |
| `NEXT_PUBLIC_IPFS_GATEWAY_URL` | `https://ipfs.io/ipfs` | IPFS gateway |

## Setup

### 1. Copy the example file

```bash
cp .env.example .env.local
```

### 2. Configure required variables

At minimum, set:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

### 3. Configure optional variables

Add blockchain and IPFS credentials as needed.

## Development vs Production

### Development (.env.local)

```bash
DATABASE_URL=postgresql://localhost:5432/ehr_wallet_dev
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-not-for-production
NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS=
```

### Production

```bash
DATABASE_URL=postgresql://user:password@prod-db:5432/ehr_wallet
NEXTAUTH_URL=https://ehr-wallet.example.com
NEXTAUTH_SECRET=<generate-secure-secret>
NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS=0x...
POLYGON_API_KEY=<alchemy-key>
# IPFS credentials
```

## Security Best Practices

1. **Never commit secrets** - Add `.env.local` to `.env.local`
2. **Use different secrets** for development and production
3. **Rotate secrets** periodically
4. **Use secrets management** in production (e.g., AWS Secrets Manager, HashiCorp Vault)
5. **Validate required variables** at startup

## Validation

The application validates required environment variables on startup. Missing required variables will cause the application to fail with an error message indicating the missing variable.
