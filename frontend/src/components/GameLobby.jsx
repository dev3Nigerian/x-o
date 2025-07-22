import React from 'react';
import { SessionManager, useConnectedUsers } from 'react-together';
import ConnectedUsersList from './ConnectedUsersList';

const GAME_MODES = {
  CASUAL: 'casual',
  STAKED: 'staked'
};

const GameLobby = ({ 
  onStartGame, 
  isConnected, 
  account, 
  selectedMode, 
  onModeChange, 
  stakeInput, 
  onStakeChange 
}) => {
  const connectedUsers = useConnectedUsers();
  const canStartGame = connectedUsers.length >= 2;

  return (
    <div className="game-lobby">
      <div className="lobby-header">
        <h1>🎮 Crypto Tic-Tac-Toe Lobby</h1>
        <p>Real-time multiplayer powered by Multisynq</p>
      </div>

      <div className="lobby-content">
        <div className="session-section">
          <h3>📡 Session Management</h3>
          <SessionManager />
          <p className="session-help">
            Share the session link to invite friends to play!
          </p>
        </div>

        <div className="players-section">
          <h3>👥 Connected Players ({connectedUsers.length})</h3>
          <ConnectedUsersList users={connectedUsers} />
          
          {!canStartGame && (
            <div className="waiting-message">
              <p>⏳ Waiting for at least 2 players to start...</p>
              <small>Share the session link above to invite friends!</small>
            </div>
          )}
        </div>

        <div className="game-setup">
          <h3>🎯 Game Mode</h3>
          
          <div className="mode-selection">
            <label className={`mode-option ${selectedMode === GAME_MODES.CASUAL ? 'selected' : ''}`}>
              <input
                type="radio"
                value={GAME_MODES.CASUAL}
                checked={selectedMode === GAME_MODES.CASUAL}
                onChange={(e) => onModeChange(e.target.value)}
              />
              <div className="mode-content">
                <h4>🎯 Casual Game</h4>
                <p>Free play with real-time synchronization</p>
                <small>No blockchain interaction required</small>
              </div>
            </label>

            <label className={`mode-option ${selectedMode === GAME_MODES.STAKED ? 'selected' : ''}`}>
              <input
                type="radio"
                value={GAME_MODES.STAKED}
                checked={selectedMode === GAME_MODES.STAKED}
                onChange={(e) => onModeChange(e.target.value)}
                disabled={!isConnected}
              />
              <div className="mode-content">
                <h4>💰 Staked Game</h4>
                <p>Blockchain-backed with MON token stakes</p>
                <small>{isConnected ? `Connected: ${account?.slice(0, 6)}...` : 'Connect wallet required'}</small>
              </div>
            </label>
          </div>

          {selectedMode === GAME_MODES.STAKED && (
            <div className="stake-input">
              <label>
                Stake Amount (MON):
                <input
                  type="number"
                  value={stakeInput}
                  onChange={(e) => onStakeChange(e.target.value)}
                  min="0.1"
                  step="0.1"
                  placeholder="1.0"
                />
              </label>
            </div>
          )}

          <button
            className="start-game-btn"
            onClick={() => onStartGame(selectedMode, selectedMode === GAME_MODES.STAKED ? stakeInput : '0')}
            disabled={!canStartGame || (selectedMode === GAME_MODES.STAKED && !isConnected)}
          >
            {!canStartGame ? 'Waiting for Players...' : 
             selectedMode === GAME_MODES.STAKED ? `Start Staked Game (${stakeInput} MON)` : 
             'Start Casual Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;