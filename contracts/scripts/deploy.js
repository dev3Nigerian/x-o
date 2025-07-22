const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to Monad network...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "MON\n");

  // Deploy MON Token
  console.log("📄 Deploying MON Token...");
  const MONToken = await ethers.getContractFactory("MONToken");
  const monToken = await MONToken.deploy();
  await monToken.deployed();
  console.log("✅ MON Token deployed to:", monToken.address);

  // Deploy TicTacToe Game Contract
  console.log("🎮 Deploying TicTacToe Game Contract...");
  const TicTacToeGame = await ethers.getContractFactory("TicTacToeGame");
  const gameContract = await TicTacToeGame.deploy(monToken.address);
  await gameContract.deployed();
  console.log("✅ TicTacToe Game deployed to:", gameContract.address);

  // Mint some tokens for testing
  const mintTx = await monToken.faucet(deployer.address, ethers.utils.parseEther("10000"));
  await mintTx.wait();
  console.log("💰 Minted 10,000 MON tokens to deployer");

  // Save deployment data
  const deploymentData = {
    network: hre.network.name,
    MONToken: monToken.address,
    TicTacToeGame: gameContract.address
  };

  fs.writeFileSync(
    path.join(__dirname, `../deployments/deployment-${hre.network.name}.json`),
    JSON.stringify(deploymentData, null, 2)
  );

  // Create environment file for frontend
  const frontendEnv = `VITE_MON_TOKEN_ADDRESS=${monToken.address}
VITE_GAME_CONTRACT_ADDRESS=${gameContract.address}`;

  fs.writeFileSync(
    path.join(__dirname, "../../frontend/.env.deployment"),
    frontendEnv
  );

  console.log("\n🎉 Deployment completed!");
  console.log("📋 Addresses:");
  console.log("├─ MON Token:", monToken.address);
  console.log("└─ Game Contract:", gameContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
