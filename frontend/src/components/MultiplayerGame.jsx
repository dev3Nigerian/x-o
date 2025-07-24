import React, { useState } from 'react';
import { ReactTogether, useStateTogether, useConnectedUsers, SessionManager } from 'react-together';

// Mock implementations for demo - Replace with your actual implementations
const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnected(true);
      setAccount('0x1234...5678');
      setBalance('1,250.50');
      setTokenBalance('5,000.00');
      setIsCorrectNetwork(true);
      setIsConnecting(false);
    }, 2000);
  };

  const switchToTargetNetwork = async () => {
    setIsCorrectNetwork(true);
  };

  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance('0');
    setTokenBalance('0');
    setIsCorrectNetwork(false);
  };

  return { 
    isConnected, 
    account, 
    balance, 
    tokenBalance, 
    isConnecting, 
    isCorrectNetwork,
    connectWallet, 
    disconnect,
    switchToTargetNetwork,
    shortAddress: account ? '0x1234...5678' : null,
    networkName: 'Monad Testnet'
  };
};

const useContracts = (walletContext) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createStakedGame = async (stakeAmount) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, gameId: '1', txHash: '0xabc123...' };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const makeBlockchainMove = async (gameId, position) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, txHash: '0xdef456...' };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const claimWinnings = async (gameId) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, amount: '200', txHash: '0xghi789...' };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestFaucet = async (amount = '1000') => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return { success: true, txHash: '0xfaucet123...' };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createStakedGame,
    makeBlockchainMove,
    claimWinnings,
    requestFaucet,
    isReady: walletContext.isConnected
  };
};

// Constants
const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

const PLAYER_SYMBOLS = { 1: 'X', 2: 'O' };
const GAME_MODES = { CASUAL: 'casual', STAKED: 'staked' };

// Enhanced Wallet Button Component
const WalletButton = () => {
  const wallet = useWallet();
  const contracts = useContracts(wallet);
  const [showFaucet, setShowFaucet] = useState(false);

  if (wallet.isConnecting) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-xl">
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="text-white font-medium">Connecting...</span>
      </div>
    );
  }

  if (wallet.isConnected) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-white">
                <div className="font-medium">{wallet.shortAddress}</div>
                <div className="text-sm opacity-90">{wallet.tokenBalance} MON</div>
              </div>
            </div>
          </div>
          <button
            onClick={wallet.disconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200"
          >
            Disconnect
          </button>
        </div>

        {!wallet.isCorrectNetwork && (
          <div className="flex items-center gap-3 bg-yellow-600/20 border border-yellow-500 px-4 py-2 rounded-lg">
            <span className="text-yellow-400">⚠️ Wrong network</span>
            <button
              onClick={wallet.switchToTargetNetwork}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
            >
              Switch to {wallet.networkName}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setShowFaucet(!showFaucet)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all duration-200"
          >
            💧 Get Test Tokens
          </button>
          
          {showFaucet && (
            <button
              onClick={() => contracts.requestFaucet()}
              disabled={contracts.loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm transition-all duration-200"
            >
              {contracts.loading ? '⏳ Requesting...' : '🚰 Request 1000 MON'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={wallet.connectWallet}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
    >
      Connect Wallet
    </button>
  );
};

// Enhanced Game Board Component
const GameBoard = ({ board, onCellClick, isMyTurn, myPlayerNumber, gameMode, isBlockchainMove }) => {
  const getCellSymbol = (cellValue) => {
    if (cellValue === 0) return '';
    return PLAYER_SYMBOLS[cellValue];
  };

  const getCellStyle = (cellValue, index) => {
    let baseStyle = "w-24 h-24 border-2 border-gray-600 rounded-xl font-bold text-4xl transition-all duration-300 transform hover:scale-105 relative ";
    
    if (cellValue === 0 && isMyTurn && !isBlockchainMove) {
      baseStyle += "bg-gradient-to-br from-gray-800 to-gray-900 hover:from-blue-600 hover:to-purple-600 cursor-pointer shadow-lg hover:shadow-xl ";
    } else if (cellValue === 1) {
      baseStyle += "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-lg ";
    } else if (cellValue === 2) {
      baseStyle += "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-lg ";
    } else {
      baseStyle += "bg-gradient-to-br from-gray-800 to-gray-900 cursor-not-allowed ";
    }

    return baseStyle;
  };

  return (
    <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl">
      {board.map((cell, index) => (
        <button
          key={index}
          onClick={() => onCellClick(index)}
          disabled={cell !== 0 || !isMyTurn || isBlockchainMove}
          className={getCellStyle(cell, index)}
        >
          <span className="drop-shadow-lg">{getCellSymbol(cell)}</span>
          {gameMode === GAME_MODES.STAKED && cell === 0 && isMyTurn && (
            <div className="absolute top-1 right-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </button>
      ))}
      
      {isBlockchainMove && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="bg-blue-600 px-6 py-3 rounded-xl text-white flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing on blockchain...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Player Card Component with enhanced features
const PlayerCard = ({ player, playerNumber, isCurrentTurn, isConnected, gameMode, hasClaimableWinnings, onClaimWinnings }) => (
  <div className={`
    p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-102
    ${isCurrentTurn 
      ? 'border-yellow-400 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 shadow-xl glow-yellow' 
      : 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-900/50'
    }
  `}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`
        w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg
        ${playerNumber === 1 
          ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white' 
          : 'bg-gradient-to-br from-red-600 to-red-800 text-white'
        }
      `}>
        {PLAYER_SYMBOLS[playerNumber]}
      </div>
      <div className="flex-1">
        <div className="font-bold text-xl text-white">
          {player?.nickname || `Player ${playerNumber}`}
        </div>
        <div className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>
      {isCurrentTurn && (
        <div className="text-yellow-400 text-lg font-bold animate-pulse">
          YOUR TURN
        </div>
      )}
    </div>

    {hasClaimableWinnings && (
      <button
        onClick={onClaimWinnings}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105"
      >
        🏆 Claim Winnings
      </button>
    )}
  </div>
);

// Game Stats Component
const GameStats = ({ stats }) => (
  <div className="grid grid-cols-3 gap-4 text-center">
    <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-xl p-4">
      <div className="text-3xl font-bold text-green-400">{stats.wins}</div>
      <div className="text-sm text-gray-300">Wins</div>
    </div>
    <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-xl p-4">
      <div className="text-3xl font-bold text-yellow-400">{stats.ties}</div>
      <div className="text-sm text-gray-300">Ties</div>
    </div>
    <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/50 rounded-xl p-4">
      <div className="text-3xl font-bold text-red-400">{stats.losses}</div>
      <div className="text-sm text-gray-300">Losses</div>
    </div>
  </div>
);

// Game Mode Selector with enhanced staking options
const GameModeSelector = ({ selectedMode, onModeChange, isWalletConnected, stakeAmount, onStakeChange }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-bold text-white mb-4">🎯 Game Mode</h3>
    
    <label className={`
      block bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-102
      ${selectedMode === GAME_MODES.CASUAL ? 'border-blue-400 shadow-xl glow-blue' : 'border-gray-600 hover:border-blue-500'}
    `}>
      <input
        type="radio"
        value={GAME_MODES.CASUAL}
        checked={selectedMode === GAME_MODES.CASUAL}
        onChange={(e) => onModeChange(e.target.value)}
        className="sr-only"
      />
      <div>
        <h4 className="text-lg font-bold text-white mb-2">🎯 Casual Game</h4>
        <p className="text-gray-300 mb-1">Free play with real-time synchronization</p>
        <small className="text-gray-400">No blockchain interaction required</small>
      </div>
    </label>

    <label className={`
      block bg-gradient-to-r from-emerald-600/20 to-green-600/20 border-2 rounded-xl p-6 transition-all duration-300 transform hover:scale-102
      ${selectedMode === GAME_MODES.STAKED ? 'border-emerald-400 shadow-xl glow-green' : 'border-gray-600'}
      ${!isWalletConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-emerald-500'}
    `}>
      <input
        type="radio"
        value={GAME_MODES.STAKED}
        checked={selectedMode === GAME_MODES.STAKED}
        onChange={(e) => onModeChange(e.target.value)}
        disabled={!isWalletConnected}
        className="sr-only"
      />
      <div>
        <h4 className="text-lg font-bold text-white mb-2">💰 Staked Game</h4>
        <p className="text-gray-300 mb-1">Blockchain-backed with MON token stakes</p>
        <small className="text-gray-400">
          {isWalletConnected ? 'Winner takes all!' : 'Connect wallet to enable'}
        </small>
        
        {selectedMode === GAME_MODES.STAKED && isWalletConnected && (
          <div className="mt-4 p-4 bg-emerald-600/20 border border-emerald-500/50 rounded-xl">
            <label className="block text-emerald-400 font-medium mb-2">Stake Amount (MON)</label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => onStakeChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
              min="1"
              max="1000"
              step="1"
            />
            <p className="text-xs text-emerald-300 mt-1">Winner receives {stakeAmount * 2} MON (minus 2.5% platform fee)</p>
          </div>
        )}
      </div>
    </label>
  </div>
);

// Connected Users List
const ConnectedUsersList = ({ users }) => (
  <div className="space-y-3">
    {users.map((user, index) => (
      <div key={user.userId || index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {user.nickname ? user.nickname[0].toUpperCase() : '?'}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white">
            {user.nickname || `Player ${index + 1}`}
          </div>
          <div className="text-sm text-green-400">🟢 Online</div>
        </div>
      </div>
    ))}
  </div>
);

// Main Game Component
const CryptoTicTacToe = () => {
  const wallet = useWallet();
  const contracts = useContracts(wallet);
  const connectedUsers = useConnectedUsers();
  
  // Game state synchronized across all players
  const [gameState, setGameState] = useStateTogether('crypto-tictactoe', {
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    currentPlayer: 1,
    status: GAME_STATUS.WAITING,
    winner: null,
    player1: null,
    player2: null,
    moveCount: 0,
    gameMode: GAME_MODES.CASUAL,
    stakeAmount: '100',
    blockchainGameId: null,
    pendingBlockchainMove: false
  });

  // Local state
  const [localStats, setLocalStats] = useState({ wins: 0, ties: 0, losses: 0 });
  const [selectedMode, setSelectedMode] = useState(GAME_MODES.CASUAL);
  const [stakeAmount, setStakeAmount] = useState('100');
  const [notifications, setNotifications] = useState([]);
  
  const myUserId = connectedUsers[0]?.userId || 'demo-user';
  const myPlayerNumber = gameState.player1?.userId === myUserId ? 1 : 
                         gameState.player2?.userId === myUserId ? 2 : null;
  const isMyTurn = gameState.currentPlayer === myPlayerNumber && gameState.status === GAME_STATUS.PLAYING;

  // Add notification
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Check for win condition
  const checkWinner = (board) => {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return board.every(cell => cell !== 0) ? 'tie' : null;
  };

  // Handle cell click
  const handleCellClick = async (index) => {
    if (gameState.board[index] !== 0 || !isMyTurn || gameState.status !== GAME_STATUS.PLAYING || gameState.pendingBlockchainMove) {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;
    
    const winner = checkWinner(newBoard);
    const newMoveCount = gameState.moveCount + 1;

    // For staked games, make blockchain move
    if (gameState.gameMode === GAME_MODES.STAKED && gameState.blockchainGameId) {
      try {
        setGameState(prev => ({ ...prev, pendingBlockchainMove: true }));
        addNotification('Making move on blockchain...', 'info');
        
        await contracts.makeBlockchainMove(gameState.blockchainGameId, index);
        addNotification('Move confirmed on blockchain!', 'success');
      } catch (error) {
        addNotification(`Blockchain move failed: ${error.message}`, 'error');
        setGameState(prev => ({ ...prev, pendingBlockchainMove: false }));
        return;
      }
    }
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      moveCount: newMoveCount,
      winner: winner,
      status: winner ? GAME_STATUS.FINISHED : GAME_STATUS.PLAYING,
      pendingBlockchainMove: false
    }));

    // Update local stats
    if (winner) {
      setLocalStats(prev => {
        if (winner === 'tie') {
          return { ...prev, ties: prev.ties + 1 };
        } else if (winner === myPlayerNumber) {
          return { ...prev, wins: prev.wins + 1 };
        } else {
          return { ...prev, losses: prev.losses + 1 };
        }
      });

      if (gameState.gameMode === GAME_MODES.STAKED && winner === myPlayerNumber) {
        addNotification('🎉 You won! You can claim your winnings now.', 'success');
      }
    }
  };

  // Start new game
  const startNewGame = async () => {
    if (connectedUsers.length < 2) {
      addNotification('Need at least 2 players to start!', 'error');
      return;
    }

    if (selectedMode === GAME_MODES.STAKED && !wallet.isConnected) {
      addNotification('Connect wallet for staked games!', 'error');
      return;
    }

    if (selectedMode === GAME_MODES.STAKED && !wallet.isCorrectNetwork) {
      addNotification('Please switch to the correct network!', 'error');
      return;
    }

    let blockchainGameId = null;

    // Create blockchain game for staked mode
    if (selectedMode === GAME_MODES.STAKED) {
      try {
        addNotification('Creating staked game on blockchain...', 'info');
        const result = await contracts.createStakedGame(stakeAmount);
        blockchainGameId = result.gameId;
        addNotification(`Staked game created! Game ID: ${blockchainGameId}`, 'success');
      } catch (error) {
        addNotification(`Failed to create staked game: ${error.message}`, 'error');
        return;
      }
    }

    setGameState({
      board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      currentPlayer: 1,
      status: GAME_STATUS.PLAYING,
      winner: null,
      player1: { userId: connectedUsers[0]?.userId, nickname: connectedUsers[0]?.nickname },
      player2: { userId: connectedUsers[1]?.userId, nickname: connectedUsers[1]?.nickname },
      moveCount: 0,
      gameMode: selectedMode,
      stakeAmount: stakeAmount,
      blockchainGameId: blockchainGameId,
      pendingBlockchainMove: false
    });

    addNotification(`${selectedMode === GAME_MODES.CASUAL ? 'Casual' : 'Staked'} game started!`, 'success');
  };

  // Reset game
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      currentPlayer: 1,
      status: GAME_STATUS.WAITING,
      winner: null,
      moveCount: 0,
      blockchainGameId: null,
      pendingBlockchainMove: false
    }));
  };

  // Claim winnings
  const handleClaimWinnings = async () => {
    if (!gameState.blockchainGameId || gameState.winner !== myPlayerNumber) {
      return;
    }

    try {
      addNotification('Claiming winnings...', 'info');
      const result = await contracts.claimWinnings(gameState.blockchainGameId);
      addNotification(`Winnings claimed! Received ${result.amount} MON`, 'success');
    } catch (error) {
      addNotification(`Failed to claim winnings: ${error.message}`, 'error');
    }
  };

  const canStartGame = connectedUsers.length >= 2;
  const gameFinished = gameState.status === GAME_STATUS.FINISHED;
  const gameInProgress = gameState.status === GAME_STATUS.PLAYING;
  const hasClaimableWinnings = gameFinished && gameState.gameMode === GAME_MODES.STAKED && 
                               gameState.winner === myPlayerNumber && gameState.blockchainGameId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`
              px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border transition-all duration-300 transform translate-x-0
              ${notif.type === 'success' ? 'bg-green-600/90 border-green-500 text-white' :
                notif.type === 'error' ? 'bg-red-600/90 border-red-500 text-white' :
                'bg-blue-600/90 border-blue-500 text-white'}
            `}
          >
            {notif.message}
          </div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Crypto Tic-Tac-Toe
          </h1>
          <p className="text-xl text-gray-300 mb-8">Real-time multiplayer powered by Multisynq & Blockchain</p>
          <WalletButton />
        </div>

        {gameState.status === GAME_STATUS.WAITING ? (
          /* Lobby View */
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
            {/* Session Management */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">📡 Session</h3>
              <div className="mb-4">
                <SessionManager />
              </div>
              <p className="text-gray-400 text-sm">Share this session to invite friends!</p>
            </div>

            {/* Connected Players */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">👥 Players ({connectedUsers.length})</h3>
              <ConnectedUsersList users={connectedUsers} />
              
              {!canStartGame && (
                <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-500/50 rounded-xl">
                  <p className="text-yellow-400 font-medium">⏳ Need 2+ players to start</p>
                  <p className="text-yellow-300 text-sm">Share the session link above!</p>
                </div>
              )}
            </div>

            {/* Game Setup */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <GameModeSelector 
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                isWalletConnected={wallet.isConnected && wallet.isCorrectNetwork}
                stakeAmount={stakeAmount}
                onStakeChange={setStakeAmount}
              />

              <button
                onClick={startNewGame}
                disabled={!canStartGame || (selectedMode === GAME_MODES.STAKED && (!wallet.isConnected || !wallet.isCorrectNetwork)) || contracts.loading}
                className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg"
              >
                {contracts.loading ? '⏳ Creating Game...' : '🚀 Start Game'}
              </button>
            </div>
          </div>
        ) : (
          /* Game View */
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
            {/* Game Board */}
            <div className="lg:col-span-2">
              <GameBoard
                board={gameState.board}
                onCellClick={handleCellClick}
                isMyTurn={isMyTurn}
                myPlayerNumber={myPlayerNumber}
                gameMode={gameState.gameMode}
                isBlockchainMove={gameState.pendingBlockchainMove}
              />

              {/* Game Status */}
              <div className="mt-6 p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700">
                {gameFinished ? (
                  <div className="text-center">
                    {gameState.winner === 'tie' ? (
                      <h3 className="text-3xl font-bold text-yellow-400 mb-4">🤝 It's a Tie!</h3>
                    ) : (
                      <h3 className="text-3xl font-bold text-green-400 mb-4">
                        🎉 Player {PLAYER_SYMBOLS[gameState.winner]} Wins!
                      </h3>
                    )}
                    
                    {gameState.gameMode === GAME_MODES.STAKED && gameState.winner !== 'tie' && (
                      <p className="text-lg text-emerald-400 mb-4">
                        💰 Prize: {gameState.stakeAmount * 2} MON
                      </p>
                    )}
                    
                    <button
                      onClick={resetGame}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      🔄 New Game
                    </button>
                  </div>
                ) : gameInProgress ? (
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Player {PLAYER_SYMBOLS[gameState.currentPlayer]}'s Turn
                    </h3>
                    {isMyTurn && !gameState.pendingBlockchainMove && (
                      <p className="text-yellow-400 font-bold animate-pulse">Your move!</p>
                    )}
                    {gameState.pendingBlockchainMove && (
                      <p className="text-blue-400 font-bold">Processing blockchain transaction...</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Players */}
              {gameState.player1 && (
                <PlayerCard
                  player={gameState.player1}
                  playerNumber={1}
                  isCurrentTurn={gameState.currentPlayer === 1 && gameInProgress}
                  isConnected={true}
                  gameMode={gameState.gameMode}
                  hasClaimableWinnings={hasClaimableWinnings && myPlayerNumber === 1}
                  onClaimWinnings={handleClaimWinnings}
                />
              )}
              
              {gameState.player2 && (
                <PlayerCard
                  player={gameState.player2}
                  playerNumber={2}
                  isCurrentTurn={gameState.currentPlayer === 2 && gameInProgress}
                  isConnected={true}
                  gameMode={gameState.gameMode}
                  hasClaimableWinnings={hasClaimableWinnings && myPlayerNumber === 2}
                  onClaimWinnings={handleClaimWinnings}
                />
              )}

              {/* Game Stats */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">📊 Your Stats</h3>
                <GameStats stats={localStats} />
              </div>

              {/* Game Info */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4">🎮 Game Info</h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="font-semibold">
                      {gameState.gameMode === GAME_MODES.CASUAL ? '🎯 Casual' : '💰 Staked'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moves:</span>
                    <span className="font-semibold">{gameState.moveCount}</span>
                  </div>
                  {gameState.gameMode === GAME_MODES.STAKED && (
                    <>
                      <div className="flex justify-between">
                        <span>Stake:</span>
                        <span className="font-semibold text-emerald-400">{gameState.stakeAmount} MON</span>
                      </div>
                      {gameState.blockchainGameId && (
                        <div className="flex justify-between">
                          <span>Game ID:</span>
                          <span className="font-semibold text-blue-400">#{gameState.blockchainGameId}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Blockchain Status */}
              {gameState.gameMode === GAME_MODES.STAKED && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold text-white mb-4">⛓️ Blockchain</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${wallet.isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-gray-300">Wallet: {wallet.isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${wallet.isCorrectNetwork ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-gray-300">Network: {wallet.networkName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${contracts.isReady ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-gray-300">Contracts: {contracts.isReady ? 'Ready' : 'Not Ready'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Custom styles for animations and glows */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .glow-yellow {
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
        }
        .glow-blue {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }
        .glow-green {
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
        }
      `}</style>
    </div>
  );
};

// Main App Component with ReactTogether wrapper
const App = () => {
  return (
    <ReactTogether sessionParams={{
       appId: "io.multisynq.687fab9ee273b89ce27e20f2.tictactoe",
      apiKey: "2dyeDTRFnR0mmcgPtJVzCdgEww3G8U5050kLzOHtfT",
      name: "crypto-tictactoe"
    }}>
      <CryptoTicTacToe />
    </ReactTogether>
  );
};

export default App;