import React, { useState, useEffect } from 'react';
import './TicTacToe.css';

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState({ player: 0, bot: 0, draws: 0 });

  // Check for winner
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    if (squares.every(square => square !== null)) {
      return 'draw';
    }

    return null;
  };

  // Simple bot AI - tries to win, then blocks, then takes center, then random
  const getBotMove = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    // Try to win
    for (let line of lines) {
      const [a, b, c] = line;
      const values = [squares[a], squares[b], squares[c]];
      if (values.filter(v => v === 'O').length === 2 && values.includes(null)) {
        return line[values.indexOf(null)];
      }
    }

    // Block player from winning
    for (let line of lines) {
      const [a, b, c] = line;
      const values = [squares[a], squares[b], squares[c]];
      if (values.filter(v => v === 'X').length === 2 && values.includes(null)) {
        return line[values.indexOf(null)];
      }
    }

    // Take center if available
    if (squares[4] === null) {
      return 4;
    }

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => squares[i] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Random available move
    const available = squares.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleClick = (index) => {
    if (board[index] || winner || gameOver || !isXNext) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);

    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      setGameOver(true);
      if (newWinner === 'X') {
        setScore(prev => ({ ...prev, player: prev.player + 1 }));
      } else if (newWinner === 'draw') {
        setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
      return;
    }

    // Bot's turn (with a small delay for better UX)
    setTimeout(() => {
      const botMove = getBotMove(newBoard);
      if (botMove !== undefined && newBoard[botMove] === null) {
        const botBoard = [...newBoard];
        botBoard[botMove] = 'O';
        setBoard(botBoard);
        setIsXNext(true);

        const botWinner = calculateWinner(botBoard);
        if (botWinner) {
          setWinner(botWinner);
          setGameOver(true);
          if (botWinner === 'O') {
            setScore(prev => ({ ...prev, bot: prev.bot + 1 }));
          } else if (botWinner === 'draw') {
            setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
          }
        }
      }
    }, 500);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setGameOver(false);
  };

  const resetScore = () => {
    setScore({ player: 0, bot: 0, draws: 0 });
    resetGame();
  };

  const renderSquare = (index) => {
    return (
      <button
        className={`square ${board[index] ? `square-${board[index].toLowerCase()}` : ''} ${gameOver ? 'game-over' : ''}`}
        onClick={() => handleClick(index)}
        disabled={board[index] !== null || winner !== null || gameOver || !isXNext}
      >
        {board[index]}
      </button>
    );
  };

  const getStatusMessage = () => {
    if (winner === 'X') {
      return '🎉 You won!';
    } else if (winner === 'O') {
      return '🤖 Bot won!';
    } else if (winner === 'draw') {
      return '🤝 It\'s a draw!';
    } else if (!isXNext) {
      return '🤖 Bot is thinking...';
    } else {
      return 'Your turn (X)';
    }
  };

  return (
    <div className="tic-tac-toe-container">
      <div className="tic-tac-toe-header">
        <h3>🎮 Tic-Tac-Toe</h3>
        <p className="game-subtitle">Play while you wait!</p>
      </div>
      
      <div className="game-status">
        <p className={`status-message ${winner ? (winner === 'X' ? 'winner' : winner === 'O' ? 'loser' : 'draw') : ''}`}>
          {getStatusMessage()}
        </p>
      </div>

      <div className="board-container">
        <div className="board">
          <div className="board-row">
            {renderSquare(0)}
            {renderSquare(1)}
            {renderSquare(2)}
          </div>
          <div className="board-row">
            {renderSquare(3)}
            {renderSquare(4)}
            {renderSquare(5)}
          </div>
          <div className="board-row">
            {renderSquare(6)}
            {renderSquare(7)}
            {renderSquare(8)}
          </div>
        </div>
      </div>

      <div className="game-controls">
        <button className="btn-reset" onClick={resetGame} disabled={!gameOver && board.every(sq => sq === null)}>
          New Game
        </button>
        {(score.player > 0 || score.bot > 0 || score.draws > 0) && (
          <button className="btn-reset-score" onClick={resetScore}>
            Reset Score
          </button>
        )}
      </div>

      {(score.player > 0 || score.bot > 0 || score.draws > 0) && (
        <div className="score-board">
          <div className="score-item">
            <span className="score-label">You:</span>
            <span className="score-value">{score.player}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Bot:</span>
            <span className="score-value">{score.bot}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Draws:</span>
            <span className="score-value">{score.draws}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicTacToe;
