const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
	console.log("🚀 Starting deployment to Monad network...\n");

	const [deployer] = await ethers.getSigners();
	console.log("📝 Deploying contracts with account:", deployer.address);

	const balance = await deployer.getBalance();
	console.log(
		"💰 Account balance:",
		ethers.utils.formatEther(balance),
		"MON\n",
	);

	// Check if balance is sufficient (at least 0.1 MON for deployment)
	if (balance.lt(ethers.utils.parseEther("0.1"))) {
		console.warn(
			"⚠️  Low balance detected. You might need more MON tokens for deployment.",
		);
	}

	// Get current gas price from network
	const provider = deployer.provider;
	let gasPrice;

	try {
		gasPrice = await provider.getGasPrice();
		console.log(
			"⛽ Current network gas price:",
			ethers.utils.formatUnits(gasPrice, "gwei"),
			"gwei",
		);

		// Add 20% buffer to gas price for faster inclusion
		gasPrice = gasPrice.mul(120).div(100);
		console.log(
			"⛽ Using gas price:",
			ethers.utils.formatUnits(gasPrice, "gwei"),
			"gwei (with 20% buffer)\n",
		);
	} catch (error) {
		console.log("⚠️  Could not fetch gas price, using default\n");
		gasPrice = ethers.utils.parseUnits("50", "gwei"); // 50 gwei fallback
	}

	// Gas options for transactions
	const gasOptions = {
		gasPrice: gasPrice,
		gasLimit: 3000000, // 3M gas limit should be enough
	};

	try {
		// Deploy MON Token
		console.log("📄 Deploying MON Token...");
		const MONToken = await ethers.getContractFactory("MONToken");
		const monToken = await MONToken.deploy(gasOptions);
		await monToken.deployed();
		console.log("✅ MON Token deployed to:", monToken.address);

		// Deploy TicTacToe Game Contract
		console.log("🎮 Deploying TicTacToe Game Contract...");
		const TicTacToeGame = await ethers.getContractFactory("TicTacToeGame");
		const gameContract = await TicTacToeGame.deploy(
			monToken.address,
			gasOptions,
		);
		await gameContract.deployed();
		console.log("✅ TicTacToe Game deployed to:", gameContract.address);

		// Mint some tokens for testing
		console.log("💰 Minting test tokens...");
		const mintTx = await monToken.faucet(
			deployer.address,
			ethers.utils.parseEther("10000"),
			gasOptions,
		);
		await mintTx.wait();
		console.log("✅ Minted 10,000 MON tokens to deployer");

		// Create deployments directory if it doesn't exist
		const deploymentsDir = path.join(__dirname, "../deployments");
		if (!fs.existsSync(deploymentsDir)) {
			fs.mkdirSync(deploymentsDir, { recursive: true });
		}

		// Save deployment data
		const deploymentData = {
			network: hre.network.name,
			chainId: (await provider.getNetwork()).chainId,
			deployer: deployer.address,
			MONToken: monToken.address,
			TicTacToeGame: gameContract.address,
			gasPrice: ethers.utils.formatUnits(gasPrice, "gwei") + " gwei",
			timestamp: new Date().toISOString(),
		};

		const deploymentPath = path.join(
			deploymentsDir,
			`deployment-${hre.network.name}.json`,
		);
		fs.writeFileSync(
			deploymentPath,
			JSON.stringify(deploymentData, null, 2),
		);

		// Create environment file for frontend
		const frontendEnvPath = path.join(
			__dirname,
			"../../frontend/.env.deployment",
		);
		const frontendEnv = `# Auto-generated deployment addresses
VITE_MON_TOKEN_ADDRESS=${monToken.address}
VITE_GAME_CONTRACT_ADDRESS=${gameContract.address}
VITE_DEPLOYMENT_NETWORK=${hre.network.name}
VITE_DEPLOYMENT_CHAIN_ID=${(await provider.getNetwork()).chainId}`;

		fs.writeFileSync(frontendEnvPath, frontendEnv);

		console.log("\n🎉 Deployment completed successfully!");
		console.log("📋 Contract Addresses:");
		console.log("├─ MON Token:", monToken.address);
		console.log("└─ Game Contract:", gameContract.address);
		console.log("\n📁 Files created:");
		console.log("├─ Deployment data:", deploymentPath);
		console.log("└─ Frontend env:", frontendEnvPath);
		console.log("\n🔧 Next steps:");
		console.log("1. Copy contract addresses to frontend/.env");
		console.log("2. Get Multisynq API key from https://multisynq.io/coder");
		console.log("3. Run: cd ../frontend && npm run dev");
	} catch (error) {
		console.error("\n❌ Deployment failed:", error.message);

		if (error.message.includes("insufficient funds")) {
			console.log("\n💡 Solution: Get more MON tokens for gas fees");
			console.log("   - Visit Monad testnet faucet");
			console.log("   - Or reduce gas limit in deployment");
		} else if (error.message.includes("gas")) {
			console.log("\n💡 Solution: Gas price issues");
			console.log("   - Network might be congested");
			console.log("   - Try again in a few minutes");
			console.log("   - Or increase gas price manually");
		}

		process.exit(1);
	}
}

main().catch((error) => {
	console.error("💥 Unexpected error:", error);
	process.exit(1);
});
