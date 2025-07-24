// frontend/src/hooks/useGame.js
import { useState, useEffect, useCallback } from "react";
import { useContract } from "./useContracts";
import { useWallet } from "./useWallet";

export const useGame = () => {
	const { account } = useWallet();
	const { gameContract, getGame, getWaitingGames } = useContract();
	const [currentGame, setCurrentGame] = useState(null);
	const [waitingGames, setWaitingGames] = useState([]);
	const [gameHistory, setGameHistory] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Load current game data
	const loadGameData = useCallback(
		async (gameId) => {
			if (!gameId || !gameContract) return;

			try {
				const game = await getGame(gameId);
				if (game) {
					setCurrentGame({ id: gameId, ...game });
				}
			} catch (error) {
				console.error("Error loading game data:", error);
				setError("Failed to load game data");
			}
		},
		[getGame, gameContract],
	);

	// Load waiting games
	const loadWaitingGames = useCallback(async () => {
		if (!gameContract) return;

		try {
			const games = await getWaitingGames(20);
			setWaitingGames(games);
		} catch (error) {
			console.error("Error loading waiting games:", error);
			setError("Failed to load waiting games");
		}
	}, [getWaitingGames, gameContract]);

	// Check if current user is a player in the game
	const isCurrentPlayer = useCallback(
		(game, playerType) => {
			if (!game || !account) return false;

			if (playerType === "X") {
				return game.playerX.toLowerCase() === account.toLowerCase();
			} else if (playerType === "O") {
				return game.playerO.toLowerCase() === account.toLowerCase();
			}

			return (
				game.playerX.toLowerCase() === account.toLowerCase() ||
				game.playerO.toLowerCase() === account.toLowerCase()
			);
		},
		[account],
	);

	// Check if it's current user's turn
	const isUserTurn = useCallback(
		(game) => {
			if (!game || !account || game.status !== 1) return false; // 1 = playing

			const isPlayerX =
				game.playerX.toLowerCase() === account.toLowerCase();
			const isPlayerO =
				game.playerO.toLowerCase() === account.toLowerCase();

			if (!isPlayerX && !isPlayerO) return false;

			return (
				(game.currentPlayer === 1 && isPlayerX) ||
				(game.currentPlayer === 2 && isPlayerO)
			);
		},
		[account],
	);

	// Get winner status for current user
	const getWinnerStatus = useCallback(
		(game) => {
			if (!game || !account || game.status !== 2) return null; // 2 = finished

			if (game.winner === "0x0000000000000000000000000000000000000000") {
				return "tie";
			}

			if (game.winner.toLowerCase() === account.toLowerCase()) {
				return "won";
			}

			if (isCurrentPlayer(game)) {
				return "lost";
			}

			return null;
		},
		[account, isCurrentPlayer],
	);

	// Get current player symbol (X or O)
	const getCurrentPlayerSymbol = useCallback(
		(game) => {
			if (!game || !account) return null;

			if (game.playerX.toLowerCase() === account.toLowerCase()) {
				return "X";
			} else if (game.playerO.toLowerCase() === account.toLowerCase()) {
				return "O";
			}

			return null;
		},
		[account],
	);

	// Check if game is joinable by current user
	const isGameJoinable = useCallback(
		(game) => {
			if (!game || !account) return false;

			return (
				game.status === 0 && // Waiting status
				game.playerO === "0x0000000000000000000000000000000000000000" && // No second player
				game.playerX.toLowerCase() !== account.toLowerCase() // Not the creator
			);
		},
		[account],
	);

	// Get game status text
	const getGameStatusText = useCallback(
		(game) => {
			if (!game) return "No game";

			switch (game.status) {
				case 0: // Waiting
					return "Waiting for opponent";
				case 1: // Playing
					if (isUserTurn(game)) {
						return "Your turn";
					} else {
						const currentPlayerSymbol =
							game.currentPlayer === 1 ? "X" : "O";
						return `Player ${currentPlayerSymbol}'s turn`;
					}
				case 2: {
					// Finished
					const winnerStatus = getWinnerStatus(game);
					if (winnerStatus === "won") {
						return "You won!";
					} else if (winnerStatus === "lost") {
						return "You lost";
					} else if (winnerStatus === "tie") {
						return "Tie game";
					} else {
						return "Game finished";
					}
				}
				default:
					return "Unknown status";
			}
		},
		[isUserTurn, getWinnerStatus],
	);

	// Filter user's games from history
	const getUserGames = useCallback(() => {
		if (!account) return [];

		return gameHistory.filter(
			(game) =>
				game.playerX.toLowerCase() === account.toLowerCase() ||
				game.playerO.toLowerCase() === account.toLowerCase(),
		);
	}, [gameHistory, account]);

	// Get user's game statistics
	const getUserStats = useCallback(() => {
		const userGames = getUserGames();
		const finishedGames = userGames.filter((game) => game.status === 2);

		const wins = finishedGames.filter(
			(game) => getWinnerStatus(game) === "won",
		).length;

		const losses = finishedGames.filter(
			(game) => getWinnerStatus(game) === "lost",
		).length;

		const ties = finishedGames.filter(
			(game) => getWinnerStatus(game) === "tie",
		).length;

		return {
			totalGames: finishedGames.length,
			wins,
			losses,
			ties,
			winRate:
				finishedGames.length > 0
					? ((wins / finishedGames.length) * 100).toFixed(1)
					: 0,
		};
	}, [getUserGames, getWinnerStatus]);

	// Add game to history
	const addToHistory = useCallback((game) => {
		setGameHistory((prev) => {
			const exists = prev.some((g) => g.id === game.id);
			if (!exists) {
				return [game, ...prev].slice(0, 50); // Keep last 50 games
			}
			return prev.map((g) => (g.id === game.id ? game : g));
		});
	}, []);

	// Clear current game
	const clearCurrentGame = useCallback(() => {
		setCurrentGame(null);
		setError("");
	}, []);

	// Setup event listeners
	useEffect(() => {
		if (!gameContract) return;

		const handleGameCreated = (gameId, creator, stakeAmount) => {
			console.log("Game created:", gameId.toString());
			loadWaitingGames();

			// If current user created the game, set it as current
			if (creator.toLowerCase() === account?.toLowerCase()) {
				loadGameData(gameId.toString());
			}
		};

		const handleGameJoined = (gameId, joiner, stakeAmount) => {
			console.log("Game joined:", gameId.toString());
			loadWaitingGames();

			// Update current game if it's the one that was joined
			if (currentGame && currentGame.id === gameId.toString()) {
				loadGameData(gameId.toString());
			}

			// If current user joined, set as current game
			if (joiner.toLowerCase() === account?.toLowerCase()) {
				loadGameData(gameId.toString());
			}
		};

		const handleMoveMade = (gameId, player, position, value) => {
			console.log("Move made:", gameId.toString(), player, position);

			// Update current game if it's the one where move was made
			if (currentGame && currentGame.id === gameId.toString()) {
				loadGameData(gameId.toString());
			}
		};

		const handleGameEnded = async (gameId, winner, totalPrize, isTie) => {
			console.log(
				"Game ended:",
				gameId.toString(),
				winner,
				totalPrize.toString(),
			);

			// Update current game
			if (currentGame && currentGame.id === gameId.toString()) {
				await loadGameData(gameId.toString());

				// Add to history
				const updatedGame = await getGame(gameId.toString());
				if (updatedGame) {
					addToHistory({ id: gameId.toString(), ...updatedGame });
				}
			}

			// Refresh waiting games list
			loadWaitingGames();
		};

		const handleWinningsClaimed = (gameId, winner, amount) => {
			console.log(
				"Winnings claimed:",
				gameId.toString(),
				winner,
				amount.toString(),
			);

			// Update current game if it's the one where winnings were claimed
			if (currentGame && currentGame.id === gameId.toString()) {
				loadGameData(gameId.toString());
			}
		};

		// Add event listeners
		gameContract.on("GameCreated", handleGameCreated);
		gameContract.on("GameJoined", handleGameJoined);
		gameContract.on("MoveMade", handleMoveMade);
		gameContract.on("GameEnded", handleGameEnded);
		gameContract.on("WinningsClaimed", handleWinningsClaimed);

		return () => {
			// Remove event listeners
			gameContract.removeListener("GameCreated", handleGameCreated);
			gameContract.removeListener("GameJoined", handleGameJoined);
			gameContract.removeListener("MoveMade", handleMoveMade);
			gameContract.removeListener("GameEnded", handleGameEnded);
			gameContract.removeListener(
				"WinningsClaimed",
				handleWinningsClaimed,
			);
		};
	}, [
		gameContract,
		currentGame,
		account,
		loadGameData,
		loadWaitingGames,
		getGame,
		addToHistory,
	]);

	// Load initial data when contract is available
	useEffect(() => {
		if (gameContract && account) {
			loadWaitingGames();
		}
	}, [gameContract, account, loadWaitingGames]);

	// Auto-refresh waiting games periodically
	useEffect(() => {
		if (!gameContract) return;

		const interval = setInterval(() => {
			loadWaitingGames();
		}, 30000); // Refresh every 30 seconds

		return () => clearInterval(interval);
	}, [gameContract, loadWaitingGames]);

	return {
		// State
		currentGame,
		waitingGames,
		gameHistory,
		loading,
		error,

		// Actions
		setCurrentGame,
		setError,
		loadGameData,
		loadWaitingGames,
		clearCurrentGame,
		addToHistory,

		// Computed properties
		isCurrentPlayer,
		isUserTurn,
		getWinnerStatus,
		getCurrentPlayerSymbol,
		isGameJoinable,
		getGameStatusText,
		getUserGames,
		getUserStats,
	};
};
