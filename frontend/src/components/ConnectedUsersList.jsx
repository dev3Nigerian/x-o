import React from 'react';

const ConnectedUsersList = ({ users }) => {
  return (
    <div className="connected-users">
      {users.map((user, index) => (
        <div key={user.userId} className="user-card">
          <div className="user-avatar">
            {user.nickname ? user.nickname[0].toUpperCase() : '?'}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user.nickname || `Player ${index + 1}`}
            </div>
            <div className="user-status">
              🟢 Connected
              {user.isMe && <span className="you-badge">(You)</span>}
            </div>
            {user.walletAddress && (
              <div className="user-wallet">
                💰 {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConnectedUsersList;