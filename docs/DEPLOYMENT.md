# Deployment Guide

This guide covers deploying EHR Wallet to various environments.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Ethereum wallet with MATIC tokens (for Polygon)
- Pinata account (optional, for IPFS pinning)

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd ehr-wallet
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration. See [ENVIRONMENT.md](./ENVIRONMENT.md) for details.

### 3. Setup Database

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Smart Contract Deployment

### Prerequisites

1. Get MATIC tokens for the target network:
   - **Polygon Mainnet**: Buy MATIC from an exchange
   - **Amoy Testnet**: Get free MATIC from [Polygon Faucet](https://faucet.polygon.technology/)

2. Configure environment:
   ```bash
   POLYGON_API_KEY=your_alchemy_api_key
   WALLET_PRIVATE_KEY=your_wallet_private_key
   ```

### Deploy to Amoy (Testnet)

```bash
npx hardhat run scripts/deploy.js --network amoy
```

Expected output:
```
🚀 Deploying AccessControl contract to amoy...
✅ AccessControl contract deployed to: 0x...
📄 Deployment info saved to: deployments/amoy.json
📝 Updated .env.local with contract address

🔍 To verify on PolygonScan:
   npx hardhat verify --network amoy <address>
   View on explorer: https://amoy.polygonscan.com/address/<address>
```

### Deploy to Polygon Mainnet

```bash
npx hardhat run scripts/deploy.js --network polygon
```

### Verify Contract

```bash
npx hardhat verify --network amoy <CONTRACT_ADDRESS>
```

## Application Deployment

### Development

```bash
npm run dev
```

Open http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

The project includes Docker support:

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t ehr-wallet .
docker run -p 3000:3000 ehr-wallet
```

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with `npm run build` command

### Railway/Render/DigitalOcean

Similar to Docker deployment:
1. Build: `npm run build`
2. Start: `node server.js`
3. Configure environment variables in dashboard

## Network Configuration

### Polygon Mainnet

| Setting | Value |
|---------|-------|
| Network Name | Polygon |
| RPC URL | https://polygon-rpc.com |
| Chain ID | 137 |
| Symbol | MATIC |
| Explorer | https://polygonscan.com |

### Amoy Testnet

| Setting | Value |
|---------|-------|
| Network Name | Polygon Amoy |
| RPC URL | https://rpc-amoy.polygon.technology |
| Chain ID | 80002 |
| Symbol | MATIC |
| Explorer | https://amoy.polygonscan.com |

### MetaMask Setup

1. Install MetaMask browser extension
2. Click "Add Network" manually
3. Enter the network details above

## IPFS Configuration

### Option 1: Pinata (Recommended)

1. Create account at https://pinata.cloud
2. Get API keys from dashboard
3. Add to environment:
   ```
   NEXT_PUBLIC_PINATA_API_KEY=your_key
   NEXT_PUBLIC_PINATA_SECRET_API_KEY=your_secret
   ```

### Option 2: Infura

1. Create account at https://infura.io
2. Create IPFS project
3. Add to environment:
   ```
   NEXT_PUBLIC_IPFS_PROJECT_ID=your_project_id
   NEXT_PUBLIC_IPFS_PROJECT_SECRET=your_project_secret
   ```

## Health Checks

### Database Connection

```bash
curl http://localhost:3000/api/health
```

### IPFS Availability

```bash
curl http://localhost:3000/api/ipfs?cid=QmXxx
```

## Troubleshooting

### Build Errors

If build fails with native module errors:
```bash
npm rebuild
```

### Database Connection Issues

Ensure `DATABASE_URL` is correct and database is accessible.

### Contract Deployment Fails

- Verify wallet has sufficient MATIC
- Check RPC URL is correct
- Ensure API key is valid

### IPFS Issues

- Verify Pinata/Infura credentials
- Check firewall allows outbound HTTPS

## Security Checklist

- [ ] Environment variables not committed to git
- [ ] `NEXTAUTH_SECRET` is secure and unique
- [ ] Database credentials are strong
- [ ] Wallet private key secured (not in code)
- [ ] HTTPS enabled in production
- [ ] CORS configured appropriately

## Monitoring

For production, consider adding:
- Error tracking (Sentry)
- Analytics (Plausible, Google Analytics)
- Uptime monitoring (UptimeRobot)
- Logging (Winston, Papertrail)
