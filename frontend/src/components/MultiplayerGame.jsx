import React, { useState, useEffect } from 'react';
import { Play, Users, Trophy, Gamepad2, Wallet, Copy, Check } from 'lucide-react';

import { 
  ReactTogether, 
  useStateTogether, 
  useFunctionTogether, 
  useConnectedUsers, 
  SessionManager 
} from 'react-together';

// Mock Multisynq SDK - replace with actual import: import { ReactTogether, useStateTogether, useFunctionTogether, useConnectedUsers, SessionManager } from 'react-together';
// const ReactTogether = ({ children, sessionParams }) => children;
// const useStateTogether = (key, initial) => {
//   const [state, setState] = useState(initial);
//   return [state, setState];
// };
// const useFunctionTogether = (key, fn) => fn;
// const useConnectedUsers = () => [
//   { userId: 'user1', nickname: 'Player 1' },
//   { userId: 'user2', nickname: 'Player 2' }
// ];
// const SessionManager = () => (
//   <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
//     🔗 Session Manager - Share link to invite players
//   </div>
// );

// Game constants
const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

const PLAYER_SYMBOLS = {
  1: 'X',
  2: 'O'
};

// Game Board Component
const GameBoard = ({ board, onMove, isMyTurn, gameStatus,}) => {
  const canMakeMove = (index) => {
    return board[index] === 0 && isMyTurn && gameStatus === GAME_STATUS.PLAYING;
  };

  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {board.map((cell, index) => (
        <button
          key={index}
          onClick={() => canMakeMove(index) && onMove(index)}
          disabled={!canMakeMove(index)}
          className={`
            aspect-square flex items-center justify-center text-4xl font-bold
            border-2 border-gray-600 rounded-lg transition-all duration-200
            ${canMakeMove(index) 
              ? 'hover:bg-blue-600/20 hover:border-blue-500 cursor-pointer' 
              : 'cursor-not-allowed'
            }
            ${cell === 1 ? 'text-blue-400' : cell === 2 ? 'text-red-400' : 'text-gray-500'}
            bg-gray-800/50 backdrop-blur-sm
          `}
        >
          {cell !== 0 ? PLAYER_SYMBOLS[cell] : ''}
        </button>
      ))}
    </div>
  );
};

// Player Info Component
const PlayerInfo = ({ player, isCurrentTurn, playerNumber, isConnected }) => (
  <div className={`
    flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-300
    ${isCurrentTurn 
      ? 'border-blue-500 bg-blue-600/20 shadow-lg' 
      : 'border-gray-600 bg-gray-800/30'
    }
  `}>
    <div className={`
      w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
      ${playerNumber === 1 ? 'bg-blue-600' : 'bg-red-600'}
    `}>
      {PLAYER_SYMBOLS[playerNumber]}
    </div>
    <div className="flex-1">
      <div className="font-semibold text-white">
        {player?.nickname || `Player ${playerNumber}`}
      </div>
      <div className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
    {isCurrentTurn && (
      <div className="text-blue-400 text-sm font-medium animate-pulse">
        Your Turn
      </div>
    )}
  </div>
);

// Game Stats Component
const GameStats = ({ stats }) => (
  <div className="grid grid-cols-3 gap-4 text-center">
    <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-3">
      <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
      <div className="text-sm text-gray-300">Wins</div>
    </div>
    <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-lg p-3">
      <div className="text-2xl font-bold text-yellow-400">{stats.ties}</div>
      <div className="text-sm text-gray-300">Ties</div>
    </div>
    <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3">
      <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
      <div className="text-sm text-gray-300">Losses</div>
    </div>
  </div>
);

// Main Multiplayer Tic-Tac-Toe Component
const MultiplayerTicTacToe = () => {
  const connectedUsers = useConnectedUsers();
  
  // Game state synchronized across all players
  const [gameState, setGameState] = useStateTogether('tictactoe-game', {
    board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    currentPlayer: 1,
    status: GAME_STATUS.WAITING,
    winner: null,
    gameId: null,
    player1: null,
    player2: null,
    moveCount: 0
  });

  // Local player state
  const [localStats, setLocalStats] = useState({ wins: 0, ties: 0, losses: 0 });
//   const [showGameHistory, setShowGameHistory] = useState(false);
  
  const myUserId = connectedUsers[0]?.userId; // In real implementation, use useMyId()
  const myPlayerNumber = gameState.player1?.userId === myUserId ? 1 : 
                         gameState.player2?.userId === myUserId ? 2 : null;
  const isMyTurn = gameState.currentPlayer === myPlayerNumber && gameState.status === GAME_STATUS.PLAYING;

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

  // Synchronized game actions
  const makeMove = useFunctionTogether('make-move', (position) => {
    if (gameState.board[position] !== 0 || gameState.status !== GAME_STATUS.PLAYING) return;
    if (gameState.currentPlayer !== myPlayerNumber) return;

    const newBoard = [...gameState.board];
    newBoard[position] = gameState.currentPlayer;
    
    const winner = checkWinner(newBoard);
    const newMoveCount = gameState.moveCount + 1;

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      moveCount: newMoveCount,
      winner: winner,
      status: winner ? GAME_STATUS.FINISHED : GAME_STATUS.PLAYING
    }));

    // Update local stats if game finished
    if (winner) {
      setLocalStats(prev => ({
        ...prev,
        wins: winner === myPlayerNumber ? prev.wins + 1 : prev.wins,
        losses: winner !== 'tie' && winner !== myPlayerNumber ? prev.losses + 1 : prev.losses,
        ties: winner === 'tie' ? prev.ties + 1 : prev.ties
      }));
    }
  });

  const startNewGame = useFunctionTogether('start-new-game', () => {
    if (connectedUsers.length < 2) return;

    setGameState(prev => ({
      ...prev,
      board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      currentPlayer: 1,
      status: GAME_STATUS.PLAYING,
      winner: null,
      gameId: Date.now().toString(),
      player1: connectedUsers[0],
      player2: connectedUsers[1],
      moveCount: 0
    }));
  });

  const joinAsPlayer = useFunctionTogether('join-as-player', () => {
    if (!gameState.player1) {
      setGameState(prev => ({
        ...prev,
        player1: connectedUsers.find(u => u.userId === myUserId),
        status: connectedUsers.length >= 2 ? GAME_STATUS.PLAYING : GAME_STATUS.WAITING
      }));
    } else if (!gameState.player2 && gameState.player1.userId !== myUserId) {
      setGameState(prev => ({
        ...prev,
        player2: connectedUsers.find(u => u.userId === myUserId),
        status: GAME_STATUS.PLAYING
      }));
    }
  });

  // Auto-start game when 2 players are connected
  useEffect(() => {
    if (connectedUsers.length >= 2 && gameState.status === GAME_STATUS.WAITING) {
      if (!gameState.player1 || !gameState.player2) {
        startNewGame();
      }
    }
  }, [connectedUsers.length, gameState.status]);

  const getGameStatusMessage = () => {
    if (gameState.status === GAME_STATUS.WAITING) {
      return `Waiting for players... (${connectedUsers.length}/2)`;
    }
    if (gameState.status === GAME_STATUS.PLAYING) {
      if (isMyTurn) return "Your turn!";
      return `Waiting for ${gameState.currentPlayer === 1 ? gameState.player1?.nickname : gameState.player2?.nickname}...`;
    }
    if (gameState.status === GAME_STATUS.FINISHED) {
      if (gameState.winner === 'tie') return "It's a tie!";
      if (gameState.winner === myPlayerNumber) return "🎉 You won!";
      return `${gameState.winner === 1 ? gameState.player1?.nickname : gameState.player2?.nickname} wins!`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🎮 Multiplayer Tic-Tac-Toe
          </h1>
          <p className="text-gray-300">Powered by Multisynq</p>
        </div>

        {/* Session Manager */}
        <div className="flex justify-center mb-6">
          <SessionManager />
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          <div className={`
            inline-block px-6 py-3 rounded-lg font-semibold text-lg
            ${gameState.status === GAME_STATUS.PLAYING ? 'bg-green-600/20 border border-green-500/50 text-green-400' :
              gameState.status === GAME_STATUS.FINISHED ? 'bg-purple-600/20 border border-purple-500/50 text-purple-400' :
              'bg-yellow-600/20 border border-yellow-500/50 text-yellow-400'}
          `}>
            {getGameStatusMessage()}
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Player 1 */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4">Player X</h3>
            {gameState.player1 ? (
              <PlayerInfo 
                player={gameState.player1}
                isCurrentTurn={gameState.currentPlayer === 1 && gameState.status === GAME_STATUS.PLAYING}
                playerNumber={1}
                isConnected={connectedUsers.some(u => u.userId === gameState.player1.userId)}
              />
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center text-gray-400">
                Waiting for Player X...
              </div>
            )}
            
            {myPlayerNumber && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Your Stats</h4>
                <GameStats stats={localStats} />
              </div>
            )}
          </div>

          {/* Center - Game Board */}
          <div className="space-y-6">
            <GameBoard 
              board={gameState.board}
              onMove={makeMove}
              isMyTurn={isMyTurn}
              gameStatus={gameState.status}
              myPlayerId={myPlayerNumber}
            />
            
            {/* Game Controls */}
            <div className="flex flex-col gap-3">
              {gameState.status === GAME_STATUS.FINISHED && (
                <button
                  onClick={startNewGame}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  New Game
                </button>
              )}
              
              {gameState.status === GAME_STATUS.WAITING && !myPlayerNumber && connectedUsers.length > 0 && (
                <button
                  onClick={joinAsPlayer}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Gamepad2 className="w-5 h-5" />
                  Join Game
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Player 2 */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4">Player O</h3>
            {gameState.player2 ? (
              <PlayerInfo 
                player={gameState.player2}
                isCurrentTurn={gameState.currentPlayer === 2 && gameState.status === GAME_STATUS.PLAYING}
                playerNumber={2}
                isConnected={connectedUsers.some(u => u.userId === gameState.player2.userId)}
              />
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center text-gray-400">
                Waiting for Player O...
              </div>
            )}

            {/* Connected Users */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Connected Users ({connectedUsers.length})</h4>
              <div className="space-y-2">
                {connectedUsers.map(user => (
                  <div key={user.userId} className="flex items-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {user.nickname ? user.nickname[0].toUpperCase() : '?'}
                    </div>
                    <span className="text-sm">{user.nickname || `User ${user.userId.slice(0, 6)}`}</span>
                    <div className="ml-auto">
                      {user.userId === myUserId && <span className="text-xs text-blue-400">(You)</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Move Counter */}
        {gameState.status === GAME_STATUS.PLAYING && (
          <div className="text-center mt-6 text-gray-300">
            Move {gameState.moveCount + 1}
          </div>
        )}
      </div>
    </div>
  );
};

// App wrapper with Multisynq provider
const App = () => {
  return (
    <ReactTogether sessionParams={{
      appId: "io.multisynq.687fab9ee273b89ce27e20f2.tictactoe",
      apiKey: "2dyeDTRFnR0mmcgPtJVzCdgEww3G8U5050kLzOHtfT"
    }}>
      <MultiplayerTicTacToe />
    </ReactTogether>
  );
};

export default App;