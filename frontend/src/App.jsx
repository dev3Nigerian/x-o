import React, { useState } from 'react';
import { Gamepad2, Zap, Plus, AlertCircle } from 'lucide-react';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setWalletConnected(true);
      }
    } catch (error) {
      console.log(error)
      setError('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Gamepad2 className="w-12 h-12 text-purple-400" />
            Crypto Tic-Tac-Toe
          </h1>
          <p className="text-purple-200 text-lg">Real MON token staking on Monad blockchain!</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Wallet Panel */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6">Wallet</h2>
            
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4">
                  <div className="text-green-400 text-sm">Connected</div>
                  <div className="text-white font-mono text-sm">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                </div>
                
                <button
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Game
                </button>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Game Board</h2>
            
            <div className="grid grid-cols-3 gap-2 mb-6 max-w-xs mx-auto">
              {Array(9).fill().map((_, index) => (
                <button
                  key={index}
                  className="w-20 h-20 border-2 border-purple-400 text-3xl font-bold transition-all duration-200 hover:bg-purple-50 bg-white"
                >
                  
                </button>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-purple-200">Connect wallet to start playing!</p>
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-6">Game Info</h2>
            
            <div className="text-center text-purple-300">
              <p>No active game</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-purple-300">
          <p className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Powered by Monad Blockchain
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
