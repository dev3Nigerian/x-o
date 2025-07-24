// frontend/src/hooks/useContracts.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";

// Contract ABIs - These would be imported from your contract artifacts
const MON_TOKEN_ABI = [
	"function balanceOf(address owner) view returns (uint256)",
	"function transfer(address to, uint256 amount) returns (bool)",
	"function approve(address spender, uint256 amount) returns (bool)",
	"function allowance(address owner, address spender) view returns (uint256)",
	"function faucet(address to, uint256 amount)",
	"function decimals() view returns (uint8)",
	"function symbol() view returns (string)",
	"function name() view returns (string)",
];

const GAME_ABI = [
	"function createGame(uint256 stakeAmount) returns (uint256)",
	"function joinGame(uint256 gameId, uint256 stakeAmount)",
	"function makeMove(uint256 gameId, uint8 position)",
	"function claimWinnings(uint256 gameId)",
	"function games(uint256) view returns (address playerX, address playerO, uint256 stakeX, uint256 stakeO, uint8[9] board, uint8 currentPlayer, uint8 status, address winner, uint256 createdAt)",
	"function gameCounter() view returns (uint256)",
	"function playerGames(address player, uint256 index) view returns (uint256)",
	"function playerStats(address player) view returns (uint256)",
	"function platformFee() view returns (uint256)",
	"event GameCreated(uint256 indexed gameId, address indexed creator, uint256 stakeAmount)",
	"event GameJoined(uint256 indexed gameId, address indexed joiner, uint256 stakeAmount)",
	"event MoveMade(uint256 indexed gameId, address indexed player, uint8 position, uint8 value)",
	"event GameEnded(uint256 indexed gameId, address indexed winner, uint256 totalPrize, bool isTie)",
	"event WinningsClaimed(uint256 indexed gameId, address indexed winner, uint256 amount)",
];

export const useContracts = (walletContext) => {
	const { signer, provider, account, isConnected } = walletContext;
	const [contracts, setContracts] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Initialize contracts when wallet connects
	useEffect(() => {
		if (
			isConnected &&
			signer &&
			import.meta.env.VITE_MON_TOKEN_ADDRESS &&
			import.meta.env.VITE_GAME_CONTRACT_ADDRESS
		) {
			try {
				const tokenContract = new ethers.Contract(
					import.meta.env.VITE_MON_TOKEN_ADDRESS,
					MON_TOKEN_ABI,
					signer,
				);

				const gameContract = new ethers.Contract(
					import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
					GAME_ABI,
					signer,
				);

				setContracts({ tokenContract, gameContract });
				setError("");
			} catch (err) {
				console.error("Error initializing contracts:", err);
				setError("Failed to initialize contracts");
				setContracts(null);
			}
		} else {
			setContracts(null);
		}
	}, [isConnected, signer]);

	// Get MON token balance
	const getTokenBalance = async (address = account) => {
		if (!contracts?.tokenContract || !address) return "0";

		try {
			const balance = await contracts.tokenContract.balanceOf(address);
			return ethers.utils.formatEther(balance);
		} catch (error) {
			console.error("Error getting token balance:", error);
			return "0";
		}
	};

	// Get token allowance
	const getTokenAllowance = async (
		owner = account,
		spender = import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
	) => {
		if (!contracts?.tokenContract || !owner || !spender) return "0";

		try {
			const allowance = await contracts.tokenContract.allowance(
				owner,
				spender,
			);
			return ethers.utils.formatEther(allowance);
		} catch (error) {
			console.error("Error getting allowance:", error);
			return "0";
		}
	};

	// Request tokens from faucet (testnet only)
	const requestFaucet = async (amount = "1000") => {
		if (!contracts?.tokenContract)
			throw new Error("Token contract not initialized");

		setLoading(true);
		setError("");

		try {
			const amountWei = ethers.utils.parseEther(amount);
			const tx = await contracts.tokenContract.faucet(account, amountWei);
			await tx.wait();

			return { success: true, txHash: tx.hash };
		} catch (error) {
			const errorMsg =
				error.reason || error.message || "Faucet request failed";
			setError(errorMsg);
			throw new Error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	// Approve tokens for game contract
	const approveTokens = async (amount) => {
		if (!contracts?.tokenContract)
			throw new Error("Token contract not initialized");

		setLoading(true);
		setError("");

		try {
			const amountWei = ethers.utils.parseEther(amount.toString());
			const tx = await contracts.tokenContract.approve(
				import.meta.env.VITE_GAME_CONTRACT_ADDRESS,
				amountWei,
			);
			await tx.wait();

			return { success: true, txHash: tx.hash };
		} catch (error) {
			const errorMsg =
				error.reason || error.message || "Token approval failed";
			setError(errorMsg);
			throw new Error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	// Create a new staked game
	const createStakedGame = async (stakeAmount) => {
		if (!contracts?.gameContract)
			throw new Error("Game contract not initialized");

		setLoading(true);
		setError("");

		try {
			const stakeWei = ethers.utils.parseEther(stakeAmount.toString());

			// Check allowance first
			const currentAllowance = await getTokenAllowance();
			if (parseFloat(currentAllowance) < parseFloat(stakeAmount)) {
				await approveTokens(stakeAmount);
			}

			// Create the game
			const tx = await contracts.gameContract.createGame(stakeWei);
			const receipt = await tx.wait();

			// Extract game ID from events
			const gameCreatedEvent = receipt.events?.find(
				(e) => e.event === "GameCreated",
			);
			const gameId = gameCreatedEvent?.args?.gameId?.toString();

			if (!gameId) {
				throw new Error("Game ID not found in transaction receipt");
			}

			return {
				success: true,
				gameId,
				txHash: tx.hash,
				blockNumber: receipt.blockNumber,
			};
		} catch (error) {
			const errorMsg =
				error.reason || error.message || "Game creation failed";
			setError(errorMsg);
			throw new Error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	// Join an existing staked game
	const joinStakedGame = async (gameId, stakeAmount) => {
		if (!contracts?.gameContract)
			throw new Error("Game contract not initialized");

		setLoading(true);
		setError("");

		try {
			const stakeWei = ethers.utils.parseEther(stakeAmount.toString());

			// Check allowance first
			const currentAllowance = await getTokenAllowance();
			if (parseFloat(currentAllowance) < parseFloat(stakeAmount)) {
				await approveTokens(stakeAmount);
			}

			// Join the game
			const tx = await contracts.gameContract.joinGame(gameId, stakeWei);
			const receipt = await tx.wait();

			return {
				success: true,
				txHash: tx.hash,
				blockNumber: receipt.blockNumber,
			};
		} catch (error) {
			const errorMsg =
				error.reason || error.message || "Failed to join game";
			setError(errorMsg);
			throw new Error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	// Make a move on the blockchain
	const makeBlockchainMove = async (gameId, position) => {
		if (!contracts?.gameContract)
			throw new Error("Game contract not initialized");

		setLoading(true);
		setError("");

		try {
			const tx = await contracts.gameContract.makeMove(gameId, position);
			const receipt = await tx.wait();

			// Extract move event
			const moveEvent = receipt.events?.find(
				(e) => e.event === "MoveMade",
			);

			return {
				success: true,
				txHash: tx.hash,
				blockNumber: receipt.blockNumber,
				moveEvent: moveEvent?.args,
			};
		} catch (error) {
			const errorMsg = error.reason || error.message || "Move failed";
			setError(errorMsg);
			throw new Error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	// Claim winnings from a completed game
	const claimWinnings = async (gameId) => {
		if (!contracts?.gameContract)
			throw new Error("Game contract not initialized");

		setLoading(true);
		setError("");

		try {
			const tx = await contracts.gameContract.claimWinnings(gameId);
			const receipt = await tx.wait();

			// Extract winnings claimed event
			const claimEvent = receipt.events?.find(
				(e) => e.event === "WinningsClaimed",
			);
			const amount = claimEvent?.args?.amount;

			return {
				success: true,
				txHash: tx.hash,
				blockNumber: receipt.blockNumber,
				amount: amount ? ethers.utils.formatEther(amount) : "0",
			};
		} catch (error) {
			const errorMsg =
				error.reason || error.message || "Failed to claim winnings";
			setError(errorMsg);
			throw new Error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	// Get game data from blockchain
	const getGameData = async (gameId) => {
		if (!contracts?.gameContract || !gameId) return null;

		try {
			const gameData = await contracts.gameContract.games(gameId);

			return {
				playerX: gameData.playerX,
				playerO: gameData.playerO,
				stakeX: ethers.utils.formatEther(gameData.stakeX),
				stakeO: ethers.utils.formatEther(gameData.stakeO),
				board: gameData.board,
				currentPlayer: gameData.currentPlayer,
				status: gameData.status,
				winner: gameData.winner,
				createdAt: gameData.createdAt.toString(),
			};
		} catch (error) {
			console.error("Error getting game data:", error);
			return null;
		}
	};

	// Get player statistics
	const getPlayerStats = async (playerAddress = account) => {
		if (!contracts?.gameContract || !playerAddress) return null;

		try {
			const wins = await contracts.gameContract.playerStats(
				playerAddress,
			);
			return {
				wins: wins.toString(),
				address: playerAddress,
			};
		} catch (error) {
			console.error("Error getting player stats:", error);
			return null;
		}
	};

	// Listen for contract events
	const subscribeToGameEvents = (gameId, callbacks = {}) => {
		if (!contracts?.gameContract) return () => {};

		const { onMove, onGameEnd, onWinningsClaimed } = callbacks;

		// Set up event listeners
		const moveFilter = contracts.gameContract.filters.MoveMade(gameId);
		const gameEndFilter = contracts.gameContract.filters.GameEnded(gameId);
		const claimFilter =
			contracts.gameContract.filters.WinningsClaimed(gameId);

		if (onMove) {
			contracts.gameContract.on(moveFilter, onMove);
		}

		if (onGameEnd) {
			contracts.gameContract.on(gameEndFilter, onGameEnd);
		}

		if (onWinningsClaimed) {
			contracts.gameContract.on(claimFilter, onWinningsClaimed);
		}

		// Return cleanup function
		return () => {
			if (onMove) contracts.gameContract.off(moveFilter, onMove);
			if (onGameEnd) contracts.gameContract.off(gameEndFilter, onGameEnd);
			if (onWinningsClaimed)
				contracts.gameContract.off(claimFilter, onWinningsClaimed);
		};
	};

	return {
		// State
		contracts,
		loading,
		error,

		// Token functions
		getTokenBalance,
		getTokenAllowance,
		requestFaucet,
		approveTokens,

		// Game functions
		createStakedGame,
		joinStakedGame,
		makeBlockchainMove,
		claimWinnings,
		getGameData,
		getPlayerStats,

		// Event subscription
		subscribeToGameEvents,

		// Utilities
		isReady: !!contracts,
		hasContracts: !!contracts,
	};
};
