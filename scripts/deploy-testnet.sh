#!/bin/bash
# Deploy AccessControl contract to Polygon Amoy testnet

echo "🚀 Deploying to Polygon Amoy testnet..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with the following variables:"
    echo "  POLYGON_API_KEY=your_alchemy_api_key"
    echo "  WALLET_PRIVATE_KEY=your_wallet_private_key"
    echo "  POLYGONSCAN_API_KEY=your_polygonscan_api_key"
    exit 1
fi

# Check if required variables are set
source .env.local

if [ -z "$POLYGON_API_KEY" ]; then
    echo "❌ Error: POLYGON_API_KEY not set in .env.local"
    exit 1
fi

if [ -z "$WALLET_PRIVATE_KEY" ] || [ "$WALLET_PRIVATE_KEY" = "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then
    echo "❌ Error: WALLET_PRIVATE_KEY not set or using default value"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Deploy using hardhat
npx hardhat run scripts/deploy.js --network amoy

echo ""
echo "✨ Deployment script completed!"
