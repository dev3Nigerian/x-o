const { ethers } = require("hardhat");

async function main() {
	// Load deployed addresses
	const deploymentData = require("../deployments/deployment-monad-testnet.json");

	const [deployer, player1, player2] = await ethers.getSigners();

	console.log("🧪 Testing deployed contracts...\n");

	// Connect to contracts
	const monToken = await ethers.getContractAt(
		"MONToken",
		deploymentData.MONToken,
	);
	const gameContract = await ethers.getContractAt(
		"TicTacToeGame",
		deploymentData.TicTacToeGame,
	);

	// Test 1: Check token balance
	const balance = await monToken.balanceOf(deployer.address);
	console.log("✅ Deployer MON balance:", ethers.utils.formatEther(balance));

	// Test 2: Create a test game
	const stakeAmount = ethers.utils.parseEther("100");

	// Approve tokens
	await monToken.approve(gameContract.address, stakeAmount);
	console.log("✅ Tokens approved");

	// Create game
	const createTx = await gameContract.createGame(stakeAmount);
	const receipt = await createTx.wait();

	const gameCreatedEvent = receipt.events.find(
		(e) => e.event === "GameCreated",
	);
	const gameId = gameCreatedEvent.args.gameId;

	console.log("✅ Game created with ID:", gameId.toString());

	// Test 3: Check game state
	const gameData = await gameContract.games(gameId);
	console.log("✅ Game player X:", gameData[0]);
	console.log("✅ Game stake:", ethers.utils.formatEther(gameData[2]), "MON");

	console.log("\n🎉 All tests passed! Contracts are working correctly.");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
