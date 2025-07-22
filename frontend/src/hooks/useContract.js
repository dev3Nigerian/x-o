import { useState, useMemo } from "react";
import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import MONTokenABI from "../abi/MONToken.json";
import GameContractABI from "../abi/GameContract.json";

export const useContract = () => {
	const { signer, isConnected } = useWallet();
	const [monBalance, setMonBalance] = useState("0");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Contract instances
	const monTokenContract = useMemo(() => {
		if (!signer || !isConnected || !MONTokenABI.address) return null;
		return new ethers.Contract(
			MONTokenABI.address,
			MONTokenABI.abi,
			signer,
		);
	}, [signer, isConnected]);

	const gameContract = useMemo(() => {
		if (!signer || !isConnected || !GameContractABI.address) return null;
		return new ethers.Contract(
			GameContractABI.address,
			GameContractABI.abi,
			signer,
		);
	}, [signer, isConnected]);

	// Load MON token balance
	const loadBalance = async (address) => {
		if (!monTokenContract || !address) return;

		try {
			const balance = await monTokenContract.balanceOf(address);
			const formattedBalance = ethers.utils.formatEther(balance);
			setMonBalance(formattedBalance);
		} catch (error) {
			console.error("Error loading balance:", error);
			setError("Failed to load balance");
		}
	};

	// Contract interaction functions
	const createGame = async (stakeAmount) => {
		if (!gameContract || !monTokenContract) {
			throw new Error("Contracts not initialized");
		}

		setLoading(true);
		setError("");

		try {
			const stakeWei = ethers.utils.parseEther(stakeAmount.toString());

			// Check balance
			const signerAddress = await signer.getAddress();
			const balance = await monTokenContract.balanceOf(signerAddress);
			if (balance.lt(stakeWei)) {
				throw new Error("Insufficient MON balance");
			}

			// Check allowance
			const allowance = await monTokenContract.allowance(
				signerAddress,
				gameContract.address,
			);
			if (allowance.lt(stakeWei)) {
				// Approve tokens
				const approveTx = await monTokenContract.approve(
					gameContract.address,
					stakeWei,
				);
				await approveTx.wait();
			}

			// Create game
			const tx = await gameContract.createGame(stakeWei);
			const receipt = await tx.wait();

			// Find GameCreated event
			const gameCreatedEvent = receipt.events?.find(
				(e) => e.event === "GameCreated",
			);
			const gameId = gameCreatedEvent?.args?.gameId?.toString();

			await loadBalance(signerAddress);
			return { gameId, txHash: tx.hash };
		} catch (error) {
			console.error("Error creating game:", error);
			setError(error.message || "Failed to create game");
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const joinGame = async (gameId, stakeAmount) => {
		if (!gameContract || !monTokenContract) {
			throw new Error("Contracts not initialized");
		}

		setLoading(true);
		setError("");

		try {
			const stakeWei = ethers.utils.parseEther(stakeAmount.toString());

			// Check balance
			const signerAddress = await signer.getAddress();
			const balance = await monTokenContract.balanceOf(signerAddress);
			if (balance.lt(stakeWei)) {
				throw new Error("Insufficient MON balance");
			}

			// Check allowance
			const allowance = await monTokenContract.allowance(
				signerAddress,
				gameContract.address,
			);
			if (allowance.lt(stakeWei)) {
				// Approve tokens
				const approveTx = await monTokenContract.approve(
					gameContract.address,
					stakeWei,
				);
				await approveTx.wait();
			}

			// Join game
			const tx = await gameContract.joinGame(gameId, stakeWei);
			await tx.wait();

			await loadBalance(signerAddress);
			return { txHash: tx.hash };
		} catch (error) {
			console.error("Error joining game:", error);
			setError(error.message || "Failed to join game");
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const makeMove = async (gameId, position) => {
		if (!gameContract) {
			throw new Error("Game contract not initialized");
		}

		setLoading(true);
		setError("");

		try {
			const tx = await gameContract.makeMove(gameId, position);
			await tx.wait();
			return { txHash: tx.hash };
		} catch (error) {
			console.error("Error making move:", error);
			setError(error.message || "Failed to make move");
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const claimWinnings = async (gameId) => {
		if (!gameContract) {
			throw new Error("Game contract not initialized");
		}

		setLoading(true);
		setError("");

		try {
			const tx = await gameContract.claimWinnings(gameId);
			await tx.wait();

			const signerAddress = await signer.getAddress();
			await loadBalance(signerAddress);
			return { txHash: tx.hash };
		} catch (error) {
			console.error("Error claiming winnings:", error);
			setError(error.message || "Failed to claim winnings");
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const getGame = async (gameId) => {
		if (!gameContract) return null;

		try {
			const game = await gameContract.getGame(gameId);
			return {
				playerX: game.playerX,
				playerO: game.playerO,
				stakeX: ethers.utils.formatEther(game.stakeX),
				stakeO: ethers.utils.formatEther(game.stakeO),
				board: game.board.map((cell) => cell.toNumber()),
				currentPlayer: game.currentPlayer,
				status: game.status, // 0: waiting, 1: playing, 2: finished
				winner: game.winner,
				createdAt: game.createdAt.toNumber(),
			};
		} catch (error) {
			console.error("Error getting game:", error);
			return null;
		}
	};

	const getWaitingGames = async (limit = 10) => {
		if (!gameContract) return [];

		try {
			const gameIds = await gameContract.getWaitingGames(limit);
			const games = [];

			for (const gameId of gameIds) {
				if (gameId.toNumber() > 0) {
					const game = await getGame(gameId.toString());
					if (game) {
						games.push({ id: gameId.toString(), ...game });
					}
				}
			}

			return games;
		} catch (error) {
			console.error("Error getting waiting games:", error);
			return [];
		}
	};

	return {
		monTokenContract,
		gameContract,
		monBalance,
		loading,
		error,
		setError,
		loadBalance,
		createGame,
		joinGame,
		makeMove,
		claimWinnings,
		getGame,
		getWaitingGames,
	};
};
