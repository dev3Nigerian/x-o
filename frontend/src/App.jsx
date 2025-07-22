import React from 'react';
import { ReactTogether } from 'react-together';
import { WalletProvider } from './contexts/WalletContext';
import MultiplayerGame from './components/MultiplayerGame';
import './App.css';

function App() {
  return (
    <ReactTogether sessionParams={{
      appId: import.meta.env.VITE_MULTISYNQ_APP_ID,
      apiKey: import.meta.env.VITE_MULTISYNQ_API_KEY,
      name: "crypto-tictactoe"
    }}>
      <WalletProvider>
        <div className="App">
          <MultiplayerGame />
        </div>
      </WalletProvider>
    </ReactTogether>
  );
}

export default App;