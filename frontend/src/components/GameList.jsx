import React from 'react';
import { Users, Clock, Coins, Play } from 'lucide-react';

const GameList = ({ games, onJoinGame, currentAccount, loading, formatMON }) => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (!games || games.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <p className="text-purple-200">No games available</p>
        <p className="text-purple-400 text-sm">Create a new game to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-purple-200 font-semibold flex items-center gap-2">
        <Users className="w-5 h-5" />
        Available Games ({games.length})
      </h3>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {games.map((game) => (
          <div 
            key={game.id} 
            className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-semibold">Game #{game.id}</span>
              </div>
              <div className="flex items-center gap-1 text-purple-300 text-xs">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(game.createdAt)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <div className="text-purple-400 text-xs">Creator</div>
                <div className="text-white font-mono text-xs">
                  {formatAddress(game.playerX)}
                </div>
              </div>
              <div>
                <div className="text-purple-400 text-xs">Stake</div>
                <div className="text-white flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  {formatMON(game.stakeX)} MON
                </div>
              </div>
            </div>
            
            {game.playerX.toLowerCase() === currentAccount.toLowerCase() ? (
              <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-2 text-center">
                <span className="text-blue-300 text-sm">Your game - waiting for opponent</span>
              </div>
            ) : (
              <button
                onClick={() => onJoinGame(game.id, game.stakeX)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Joining...' : 'Join Game'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameList;