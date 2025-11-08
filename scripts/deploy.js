// Scripts for deploying the AccessControl contract
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log(`\n🚀 Deploying AccessControl contract to ${network}...`);

  // Get the contract factory
  const AccessControlFactory = await hre.ethers.getContractFactory("AccessControl");

  // Deploy the contract
  console.log("📝 Deploying contract...");
  const accessControl = await AccessControlFactory.deploy();

  // Wait for deployment to complete
  await accessControl.waitForDeployment();

  const address = await accessControl.getAddress();
  console.log(`\n✅ AccessControl contract deployed to: ${address}`);

  // Get network-specific info
  const networkInfo = {
    network: network,
    contractAddress: address,
    deployedAt: new Date().toISOString(),
    chainId: hre.network.config.chainId
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(networkInfo, null, 2));
  console.log(`📄 Deployment info saved to: deployments/${network}.json`);

  // Create/update .env.local with contract address
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  const envVarName = "NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS";
  const envLine = `${envVarName}=${address}`;

  if (envContent.includes(envVarName)) {
    // Update existing variable
    envContent = envContent.replace(
      new RegExp(`${envVarName}=.*`, "g"),
      envLine
    );
  } else {
    // Add new variable
    envContent += `\n${envLine}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log(`📝 Updated .env.local with contract address`);

  // Network-specific verification instructions
  if (network === "amoy") {
    console.log(`\n🔍 To verify on PolygonScan:`);
    console.log(`   npx hardhat verify --network amoy ${address}`);
    console.log(`   View on explorer: https://amoy.polygonscan.com/address/${address}`);
  } else if (network === "polygon") {
    console.log(`\n🔍 To verify on PolygonScan:`);
    console.log(`   npx hardhat verify --network polygon ${address}`);
    console.log(`   View on explorer: https://polygonscan.com/address/${address}`);
  } else if (network === "sepolia") {
    console.log(`\n🔍 To verify on Etherscan:`);
    console.log(`   npx hardhat verify --network sepolia ${address}`);
    console.log(`   View on explorer: https://sepolia.etherscan.io/address/${address}`);
  } else if (network === "ethereum") {
    console.log(`\n🔍 To verify on Etherscan:`);
    console.log(`   npx hardhat verify --network ethereum ${address}`);
    console.log(`   View on explorer: https://etherscan.io/address/${address}`);
  }

  console.log(`\n✨ Deployment complete!\n`);

  return address;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
