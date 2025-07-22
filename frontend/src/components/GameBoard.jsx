import React from 'react';

const GameBoard = ({ board, onMove, isMyTurn, gameStatus, currentPlayer, winner }) => {
  const canMakeMove = (index) => {
    return board[index] === 0 && isMyTurn && gameStatus === 'playing';
  };

  const getCellClass = (cell, index) => {
    let classes = 'game-cell';
    
    if (cell === 1) classes += ' player-x';
    if (cell === 2) classes += ' player-o';
    if (canMakeMove(index)) classes += ' can-move';
    
    return classes;
  };

  return (
    <div className="game-board">
      <div className="board-grid">
        {board.map((cell, index) => (
          <button
            key={index}
            className={getCellClass(cell, index)}
            onClick={() => canMakeMove(index) && onMove(index)}
            disabled={!canMakeMove(index)}
          >
            {cell === 1 ? 'X' : cell === 2 ? 'O' : ''}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;