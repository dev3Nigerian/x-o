import React, { useState, useEffect, useCallback } from 'react';
import { ReactTogether, useStateTogether, useConnectedUsers } from 'react-together';

// Wallet Hook with Real MetaMask Integration
const useWallet = () => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');

  const MONAD_TESTNET_CONFIG = {
    chainId: '0x279F', // 10143 in hex
    chainName: 'Monad Testnet',
    nativeCurrency: {
      name: 'MON',
      symbol: 'MON',
      decimals: 18,
    },
    rpcUrls: ['https://testnet-rpc.monad.xyz'],
    blockExplorerUrls: ['https://testnet.monadexplorer.com'],
  };

  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    try {
      setLoading(true);
      setError('');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get network info
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);

      setAccount(accounts[0]);
      setChainId(chainIdNumber);
      setIsConnected(true);
      setIsCorrectNetwork(chainIdNumber === 10143);

      // Mock token balance for demo
      setTokenBalance('1,250.50');

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isMetaMaskInstalled]);

  const switchToTargetNetwork = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      setLoading(true);
      setError('');

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
      });

      setIsCorrectNetwork(true);
      return true;
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [MONAD_TESTNET_CONFIG],
          });
          setIsCorrectNetwork(true);
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          setError('Failed to add Monad network');
          return false;
        }
      } else {
        console.error('Error switching network:', error);
        setError('Failed to switch to Monad network');
        return false;
      }
    } finally {
      setLoading(false);
    }
  }, [isMetaMaskInstalled]);

  const disconnect = useCallback(() => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setError('');
    setTokenBalance('0');
  }, []);

  // Handle account and network changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId) => {
      const chainIdNumber = parseInt(newChainId, 16);
      setChainId(chainIdNumber);
      setIsCorrectNetwork(chainIdNumber === 10143);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts.length > 0) {
          connectWallet();
        }
      })
      .catch(console.error);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, connectWallet, disconnect]);

  return {
    account,
    provider,
    signer,
    chainId,
    isConnected,
    isCorrectNetwork,
    error,
    loading,
    tokenBalance,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    switchToTargetNetwork,
    disconnect,
    setError,
    shortAddress: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null,
    networkName: 'Monad Testnet',
  };
};

// Contracts Hook
const useContracts = (walletContext) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createStakedGame = async (stakeAmount) => {
    setLoading(true);
    try {
      // Simulate blockchain transaction
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true, gameId: Math.floor(Math.random() * 1000), txHash: '0xabc123...' };
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true, amount: '200', txHash: '0xghi789...' };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestFaucet = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
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
    isReady: walletContext.isConnected,
  };
};

// Constants
const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
};

const PLAYER_SYMBOLS = { 1: '❌', 2: '⭕' };
const GAME_MODES = { CASUAL: 'casual', STAKED: 'staked' };

// Notification Hook
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  return { notifications, addNotification };
};

// Wallet Button Component
const WalletButton = () => {
  const wallet = useWallet();
  const contracts = useContracts(wallet);
  const [showFaucet, setShowFaucet] = useState(false);

  if (wallet.loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
        padding: '12px 24px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: '500',
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid white',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
        <span>Connecting...</span>
      </div>
    );
  }

  if (wallet.isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(to right, #059669, #10b981)',
            padding: '12px 24px',
            borderRadius: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: '#34d399',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
              }}></div>
              <div style={{ color: 'white' }}>
                <div style={{ fontWeight: '500' }}>{wallet.shortAddress}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>{wallet.tokenBalance} MON</div>
              </div>
            </div>
          </div>
          <button
            onClick={wallet.disconnect}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.target.style.background = '#b91c1c')}
            onMouseOut={(e) => (e.target.style.background = '#dc2626')}
          >
            Disconnect
          </button>
        </div>

        {!wallet.isCorrectNetwork && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid #f59e0b',
            padding: '8px 16px',
            borderRadius: '8px',
          }}>
            <span style={{ color: '#fbbf24' }}>⚠️ Wrong network</span>
            <button
              onClick={wallet.switchToTargetNetwork}
              style={{
                padding: '4px 12px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Switch to {wallet.networkName}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowFaucet(!showFaucet)}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            💧 Get Test Tokens
          </button>

          {showFaucet && (
            <button
              onClick={() => contracts.requestFaucet()}
              disabled={contracts.loading}
              style={{
                padding: '8px 16px',
                background: contracts.loading ? '#6b7280' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: contracts.loading ? 'not-allowed' : 'pointer',
                opacity: contracts.loading ? 0.5 : 1,
              }}
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
      style={{
        background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: 'scale(1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'scale(1.05)';
        e.target.style.background = 'linear-gradient(to right, #2563eb, #7c3aed)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.background = 'linear-gradient(to right, #3b82f6, #8b5cf6)';
      }}
    >
      Connect Wallet
    </button>
  );
};

// Game Board Component
const GameBoard = ({ board, onCellClick, isMyTurn, myPlayerNumber, gameMode, isBlockchainMove }) => {
  const getCellSymbol = (cellValue) => {
    if (cellValue === 0) return '';
    return PLAYER_SYMBOLS[cellValue];
  };

  const getCellStyle = (cellValue, index) => {
    const baseStyle = {
      width: '96px',
      height: '96px',
      border: '2px solid #4b5563',
      borderRadius: '12px',
      fontSize: '32px',
      fontWeight: 'bold',
      cursor: cellValue === 0 && isMyTurn && !isBlockchainMove ? 'pointer' : 'not-allowed',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    };

    if (cellValue === 0 && isMyTurn && !isBlockchainMove) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #374151, #111827)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      };
    } else if (cellValue === 1) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      };
    } else if (cellValue === 2) {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
      };
    } else {
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #374151, #111827)',
      };
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        padding: '24px',
        background: 'linear-gradient(135deg, #111827, #000000)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => onCellClick(index)}
            disabled={cell !== 0 || !isMyTurn || isBlockchainMove}
            style={getCellStyle(cell, index)}
            onMouseOver={(e) => {
              if (cell === 0 && isMyTurn && !isBlockchainMove) {
                e.target.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={(e) => {
              if (cell === 0 && isMyTurn && !isBlockchainMove) {
                e.target.style.background = 'linear-gradient(135deg, #374151, #111827)';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))' }}>
              {getCellSymbol(cell)}
            </span>
            {gameMode === GAME_MODES.STAKED && cell === 0 && isMyTurn && (
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                background: '#fbbf24',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
              }}></div>
            )}
          </button>
        ))}
      </div>

      {isBlockchainMove && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#3b82f6',
            padding: '12px 24px',
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}></div>
            <span>Processing on blockchain...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Player Card Component
const PlayerCard = ({ player, playerNumber, isCurrentTurn, isConnected, gameMode, hasClaimableWinnings, onClaimWinnings }) => (
  <div style={{
    padding: '24px',
    borderRadius: '16px',
    border: `2px solid ${isCurrentTurn ? '#10b981' : '#374151'}`,
    background: isCurrentTurn
      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))'
      : 'linear-gradient(135deg, rgba(55, 65, 81, 0.1), rgba(17, 24, 39, 0.05))',
    transition: 'all 0.3s',
    boxShadow: isCurrentTurn ? '0 0 20px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: playerNumber === 1 ? '#3b82f6' : '#dc2626',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: 'white',
        fontWeight: 'bold',
      }}>
        {PLAYER_SYMBOLS[playerNumber]}
      </div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
          {player?.nickname || `Player ${playerNumber}`}
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af' }}>
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </div>
      </div>
    </div>

    {player?.walletAddress && (
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        fontFamily: 'monospace',
        marginBottom: '8px',
      }}>
        {player.walletAddress.slice(0, 8)}...{player.walletAddress.slice(-6)}
      </div>
    )}

    {isCurrentTurn && (
      <div style={{
        background: '#10b981',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'center',
      }}>
        Your Turn!
      </div>
    )}

    {hasClaimableWinnings && (
      <button
        onClick={onClaimWinnings}
        style={{
          width: '100%',
          background: 'linear-gradient(to right, #f59e0b, #d97706)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          marginTop: '8px',
        }}
      >
        🎉 Claim Winnings
      </button>
    )}
  </div>
);

// Notification Component
const NotificationDisplay = ({ notifications }) => (
  <div style={{
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }}>
    {notifications.map((notification) => (
      <div
        key={notification.id}
        style={{
          background: notification.type === 'error' ? '#dc2626' 
                   : notification.type === 'success' ? '#059669' 
                   : '#3b82f6',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '300px',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {notification.message}
      </div>
    ))}
  </div>
);

// Main Game Component
const CryptoTicTacToe = () => {
  const connectedUsers = useConnectedUsers();
  const wallet = useWallet();
  const contracts = useContracts(wallet);
  const { notifications, addNotification } = useNotifications();

  // Game state - PROPERLY USING useStateTogether for multiplayer sync
  const [gameState, setGameState] = useStateTogether('cryptoTicTacToe', {
    board: Array(9).fill(0),
    currentPlayer: 1,
    status: GAME_STATUS.WAITING,
    winner: null,
    moveCount: 0,
    gameMode: GAME_MODES.CASUAL,
    stakeAmount: '100',
    blockchainGameId: null,
    pendingBlockchainMove: false,
  });

  const [selectedMode, setSelectedMode] = useState(GAME_MODES.CASUAL);
  const [stakeAmount, setStakeAmount] = useState('100');
  const [localStats, setLocalStats] = useState({ wins: 0, losses: 0, ties: 0 });

  const myPlayerNumber = connectedUsers.findIndex(user => user.isYou) + 1;
  const isMyTurn = gameState.currentPlayer === myPlayerNumber && gameState.status === GAME_STATUS.PLAYING;

  // Winner checking function
  const checkWinner = (board) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (let line of lines) {
      const [a, b, c] = line;
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
      board: Array(9).fill(0),
      currentPlayer: 1,
      status: GAME_STATUS.PLAYING,
      winner: null,
      moveCount: 0,
      gameMode: selectedMode,
      stakeAmount: selectedMode === GAME_MODES.STAKED ? stakeAmount : '0',
      blockchainGameId: blockchainGameId,
      pendingBlockchainMove: false,
    });

    addNotification('New game started!', 'success');
  };

  // Claim winnings
  const handleClaimWinnings = async () => {
    if (!gameState.blockchainGameId) return;

    try {
      addNotification('Claiming winnings...', 'info');
      const result = await contracts.claimWinnings(gameState.blockchainGameId);
      addNotification(`Winnings claimed! Amount: ${result.amount} MON`, 'success');
    } catch (error) {
      addNotification(`Failed to claim winnings: ${error.message}`, 'error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `
          radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
        `,
        animation: 'float 20s ease-in-out infinite',
        zIndex: -1,
      }}></div>

      <NotificationDisplay notifications={notifications} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #10b981)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '16px',
          }}>
            🎮 Crypto Tic-Tac-Toe
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            Play classic Tic-Tac-Toe with friends in real-time, or stake crypto for winner-takes-all games!
          </p>
        </div>

        {/* Wallet Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '40px',
        }}>
          <WalletButton />
        </div>

        {/* Game Setup */}
        {gameState.status === GAME_STATUS.WAITING && (
          <div style={{
            background: 'rgba(55, 65, 81, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '24px',
              color: 'white',
            }}>
              🚀 Start New Game
            </h2>

            {/* Game Mode Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '12px',
                color: '#e5e7eb',
              }}>
                Game Mode
              </label>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}>
                <button
                  onClick={() => setSelectedMode(GAME_MODES.CASUAL)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    background: selectedMode === GAME_MODES.CASUAL 
                      ? 'linear-gradient(135deg, #3b82f6, #1e40af)' 
                      : 'rgba(55, 65, 81, 0.5)',
                    color: 'white',
                  }}
                >
                  🎯 Casual Play
                </button>
                <button
                  onClick={() => setSelectedMode(GAME_MODES.STAKED)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    background: selectedMode === GAME_MODES.STAKED 
                      ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                      : 'rgba(55, 65, 81, 0.5)',
                    color: 'white',
                  }}
                >
                  💰 Staked Game
                </button>
              </div>
            </div>

            {/* Stake Amount Input */}
            {selectedMode === GAME_MODES.STAKED && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '12px',
                  color: '#e5e7eb',
                }}>
                  Stake Amount (MON)
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  style={{
                    width: '200px',
                    padding: '12px',
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: 'rgba(17, 24, 39, 0.5)',
                    color: 'white',
                    fontSize: '16px',
                    textAlign: 'center',
                  }}
                  placeholder="Enter stake amount"
                />
              </div>
            )}

            {/* Players Status */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(17, 24, 39, 0.3)',
              borderRadius: '12px',
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: 'white',
              }}>
                👥 Players ({connectedUsers.length}/2) - Status: {connectedUsers.length >= 2 ? '✅ Ready' : '⏳ Waiting'}
              </h3>
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}>
                {connectedUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'rgba(55, 65, 81, 0.5)',
                      borderRadius: '12px',
                      border: user.isYou ? '2px solid #10b981' : '1px solid #4b5563',
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: index === 0 ? '#3b82f6' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                    }}>
                      {user.nickname ? user.nickname[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: 'white' }}>
                        {user.nickname || `Player ${index + 1}`}
                        {user.isYou && (
                          <span style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            marginLeft: '8px',
                          }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}>
                        {user.isTogether ? '🟢 Connected' : '🔴 Disconnected'} | ID: {user.userId.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Game Button */}
            <button
              onClick={startNewGame}
              disabled={connectedUsers.length < 2 || (selectedMode === GAME_MODES.STAKED && (!wallet.isConnected || !wallet.isCorrectNetwork))}
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: connectedUsers.length >= 2 ? 'pointer' : 'not-allowed',
                opacity: connectedUsers.length >= 2 ? 1 : 0.5,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (connectedUsers.length >= 2) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {connectedUsers.length < 2 
                ? 'Waiting for players...' 
                : `Start ${selectedMode === GAME_MODES.STAKED ? 'Staked' : 'Casual'} Game`
              }
            </button>
          </div>
        )}

        {/* Active Game */}
        {gameState.status !== GAME_STATUS.WAITING && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px 1fr',
            gap: '32px',
            alignItems: 'start',
          }}>
            {/* Player 1 */}
            <div>
              {connectedUsers[0] && (
                <PlayerCard
                  player={connectedUsers[0]}
                  playerNumber={1}
                  isCurrentTurn={gameState.currentPlayer === 1}
                  isConnected={connectedUsers[0].isTogether}
                  gameMode={gameState.gameMode}
                  hasClaimableWinnings={gameState.winner === 1 && gameState.gameMode === GAME_MODES.STAKED && connectedUsers[0].isYou}
                  onClaimWinnings={handleClaimWinnings}
                />
              )}
            </div>

            {/* Game Board */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}>
              <GameBoard
                board={gameState.board}
                onCellClick={handleCellClick}
                isMyTurn={isMyTurn}
                myPlayerNumber={myPlayerNumber}
                gameMode={gameState.gameMode}
                isBlockchainMove={gameState.pendingBlockchainMove}
              />

              {/* Game Status */}
              {gameState.status === GAME_STATUS.FINISHED && (
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  background: gameState.winner === 'tie' 
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '16px',
                  color: 'white',
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}>
                    {gameState.winner === 'tie' 
                      ? "🤝 It's a Tie!" 
                      : `🎉 Player ${gameState.winner} Wins!`
                    }
                  </h2>
                  {gameState.gameMode === GAME_MODES.STAKED && gameState.winner !== 'tie' && (
                    <p style={{ fontSize: '16px', opacity: 0.9 }}>
                      Prize: {gameState.stakeAmount * 2} MON
                    </p>
                  )}
                  <button
                    onClick={() => setGameState(prev => ({ 
                      ...prev, 
                      status: GAME_STATUS.WAITING,
                      board: Array(9).fill(0),
                      currentPlayer: 1,
                      winner: null,
                      moveCount: 0,
                      blockchainGameId: null,
                      pendingBlockchainMove: false,
                    }))}
                    style={{
                      marginTop: '16px',
                      padding: '12px 24px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div>
              {connectedUsers[1] && (
                <PlayerCard
                  player={connectedUsers[1]}
                  playerNumber={2}
                  isCurrentTurn={gameState.currentPlayer === 2}
                  isConnected={connectedUsers[1].isTogether}
                  gameMode={gameState.gameMode}
                  hasClaimableWinnings={gameState.winner === 2 && gameState.gameMode === GAME_MODES.STAKED && connectedUsers[1].isYou}
                  onClaimWinnings={handleClaimWinnings}
                />
              )}
            </div>
          </div>
        )}

        {/* Game Info Sidebar */}
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: 'rgba(55, 65, 81, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          minWidth: '250px',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: 'white',
          }}>
            📊 Your Stats
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Wins:</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>{localStats.wins}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Losses:</span>
              <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{localStats.losses}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Ties:</span>
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{localStats.ties}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Mode:</span>
              <span style={{ 
                color: gameState.gameMode === GAME_MODES.STAKED ? '#f59e0b' : '#3b82f6',
                fontWeight: 'bold' 
              }}>
                {gameState.gameMode === GAME_MODES.CASUAL ? '🎯 Casual' : '💰 Staked'}
              </span>
            </div>
            {gameState.gameMode === GAME_MODES.STAKED && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af' }}>Stake:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{gameState.stakeAmount} MON</span>
                </div>
                {gameState.blockchainGameId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#9ca3af' }}>Game ID:</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>#{gameState.blockchainGameId}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-30px) rotate(0.5deg); }
          66% { transform: translateY(20px) rotate(-0.5deg); }
        }
        @media (max-width: 1024px) {
          .grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .game-board { 
            grid-template-columns: repeat(3, 80px) !important;
            gap: 12px !important;
          }
          .game-cell {
            width: 80px !important;
            height: 80px !important;
            font-size: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

// Main App Component with ReactTogether wrapper
const App = () => {
  return (
    <ReactTogether 
      sessionParams={{
        apiKey: "2dyeDTRFnR0mmcgPtJVzCdgEww3G8U5050kLzOHtfT",
        appId: "io.multisynq.687fab9ee273b89ce27e20f2.cryptotictactoe",
        name: "crypto-tictactoe-game",
        password: "secure-game-2025"
      }}
    >
      <CryptoTicTacToe />
    </ReactTogether>
  );
};

export default App;