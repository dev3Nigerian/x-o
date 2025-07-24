// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TicTacToeGame
 * @dev A decentralized Tic-Tac-Toe game with MON token staking
 */
contract TicTacToeGame is ReentrancyGuard, Ownable {
    IERC20 public immutable monToken;
    
    enum GameStatus { Waiting, Playing, Finished }
    enum Player { None, X, O }
    
    struct Game {
        address playerX;
        address playerO;
        uint256 stakeX;
        uint256 stakeO;
        uint8[9] board;
        Player currentPlayer;
        GameStatus status;
        address winner;
        uint256 createdAt;
    }
    
    uint256 public gameCounter;
    uint256 public platformFee = 250; // 2.5% platform fee
    uint256 public constant PERCENTAGE_BASE = 10000;
    
    mapping(uint256 => Game) public games;
    mapping(address => uint256[]) public playerGames;
    mapping(address => uint256) public playerStats; // wins count
    
    // Events
    event GameCreated(uint256 indexed gameId, address indexed creator, uint256 stakeAmount);
    event GameJoined(uint256 indexed gameId, address indexed joiner, uint256 stakeAmount);
    event MoveMade(uint256 indexed gameId, address indexed player, uint8 position, uint8 value);
    event GameEnded(uint256 indexed gameId, address indexed winner, uint256 totalPrize, bool isTie);
    event WinningsClaimed(uint256 indexed gameId, address indexed winner, uint256 amount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    modifier validGameId(uint256 gameId) {
        require(gameId > 0 && gameId <= gameCounter, "Invalid game ID");
        _;
    }
    
    modifier onlyGamePlayer(uint256 gameId) {
        Game storage game = games[gameId];
        require(
            msg.sender == game.playerX || msg.sender == game.playerO,
            "Not a player in this game"
        );
        _;
    }
    
    constructor(address _monToken) {
        require(_monToken != address(0), "Invalid token address");
        monToken = IERC20(_monToken);
    }
    
    function createGame(uint256 stakeAmount) external returns (uint256) {
        require(stakeAmount > 0, "Stake must be greater than 0");
        require(
            monToken.transferFrom(msg.sender, address(this), stakeAmount),
            "Token transfer failed"
        );
        
        gameCounter++;
        uint256 gameId = gameCounter;
        
        games[gameId] = Game({
            playerX: msg.sender,
            playerO: address(0),
            stakeX: stakeAmount,
            stakeO: 0,
            board: [0,0,0,0,0,0,0,0,0],
            currentPlayer: Player.X,
            status: GameStatus.Waiting,
            winner: address(0),
            createdAt: block.timestamp
        });
        
        playerGames[msg.sender].push(gameId);
        emit GameCreated(gameId, msg.sender, stakeAmount);
        
        return gameId;
    }
    
    function joinGame(uint256 gameId, uint256 stakeAmount) external validGameId(gameId) {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Waiting, "Game not available for joining");
        require(game.playerO == address(0), "Game already has two players");
        require(game.playerX != msg.sender, "Cannot join your own game");
        require(stakeAmount == game.stakeX, "Stake amount must match");
        require(
            monToken.transferFrom(msg.sender, address(this), stakeAmount),
            "Token transfer failed"
        );
        
        game.playerO = msg.sender;
        game.stakeO = stakeAmount;
        game.status = GameStatus.Playing;
        
        playerGames[msg.sender].push(gameId);
        emit GameJoined(gameId, msg.sender, stakeAmount);
    }
    
    function makeMove(uint256 gameId, uint8 position) 
        external 
        validGameId(gameId) 
        onlyGamePlayer(gameId) 
        returns (bool) 
    {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Playing, "Game is not active");
        require(position < 9, "Invalid board position");
        require(game.board[position] == 0, "Position already occupied");
        
        bool isPlayerX = msg.sender == game.playerX;
        bool isPlayerO = msg.sender == game.playerO;
        
        // Verify it's the player's turn
        if (game.currentPlayer == Player.X) {
            require(isPlayerX, "Not your turn");
            game.board[position] = 1;
            game.currentPlayer = Player.O;
            emit MoveMade(gameId, msg.sender, position, 1);
        } else {
            require(isPlayerO, "Not your turn");
            game.board[position] = 2;
            game.currentPlayer = Player.X;
            emit MoveMade(gameId, msg.sender, position, 2);
        }
        
        // Check for game end conditions
        address winner = checkWinner(gameId);
        bool isTie = false;
        
        if (winner != address(0)) {
            game.status = GameStatus.Finished;
            game.winner = winner;
            playerStats[winner]++;
        } else if (isBoardFull(gameId)) {
            game.status = GameStatus.Finished;
            isTie = true;
        }
        
        if (game.status == GameStatus.Finished) {
            uint256 totalPrize = game.stakeX + game.stakeO;
            emit GameEnded(gameId, winner, totalPrize, isTie);
        }
        
        return true;
    }
    
    function claimWinnings(uint256 gameId) 
        external 
        validGameId(gameId) 
        nonReentrant 
    {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Finished, "Game not finished");
        
        uint256 totalStake = game.stakeX + game.stakeO;
        require(totalStake > 0, "No winnings to claim");
        
        if (game.winner == msg.sender) {
            // Winner takes all minus platform fee
            uint256 platformFeeAmount = (totalStake * platformFee) / PERCENTAGE_BASE;
            uint256 winnerAmount = totalStake - platformFeeAmount;
            
            game.stakeX = 0;
            game.stakeO = 0;
            
            require(monToken.transfer(msg.sender, winnerAmount), "Winner transfer failed");
            if (platformFeeAmount > 0) {
                require(monToken.transfer(owner(), platformFeeAmount), "Fee transfer failed");
            }
            
            emit WinningsClaimed(gameId, msg.sender, winnerAmount);
        } else if (game.winner == address(0)) {
            // Tie game - return stakes to players
            if (msg.sender == game.playerX && game.stakeX > 0) {
                uint256 stake = game.stakeX;
                game.stakeX = 0;
                require(monToken.transfer(msg.sender, stake), "Stake return failed");
                emit WinningsClaimed(gameId, msg.sender, stake);
            } else if (msg.sender == game.playerO && game.stakeO > 0) {
                uint256 stake = game.stakeO;
                game.stakeO = 0;
                require(monToken.transfer(msg.sender, stake), "Stake return failed");
                emit WinningsClaimed(gameId, msg.sender, stake);
            } else {
                revert("No stake to return or already claimed");
            }
        } else {
            revert("Not eligible for winnings");
        }
    }
    
    function checkWinner(uint256 gameId) internal view returns (address) {
        uint8[9] memory board = games[gameId].board;
        
        // Fixed: Correct array dimensions - [3][8] means 8 arrays of 3 elements each
        uint8[3][8] memory winningLines = [
            [0,1,2], [3,4,5], [6,7,8],  // rows
            [0,3,6], [1,4,7], [2,5,8],  // columns
            [0,4,8], [2,4,6]            // diagonals
        ];
        
        for (uint i = 0; i < 8; i++) {
            uint8 a = winningLines[i][0];
            uint8 b = winningLines[i][1];
            uint8 c = winningLines[i][2];
            
            if (board[a] != 0 && board[a] == board[b] && board[b] == board[c]) {
                return board[a] == 1 ? games[gameId].playerX : games[gameId].playerO;
            }
        }
        return address(0);
    }
    
    function isBoardFull(uint256 gameId) internal view returns (bool) {
        uint8[9] memory board = games[gameId].board;
        for (uint i = 0; i < 9; i++) {
            if (board[i] == 0) return false;
        }
        return true;
    }
    
    function getGame(uint256 gameId) external view validGameId(gameId) returns (Game memory) {
        return games[gameId];
    }
    
    function getPlayerGames(address player) external view returns (uint256[] memory) {
        return playerGames[player];
    }
    
    function getWaitingGames(uint256 limit) external view returns (uint256[] memory) {
        uint256[] memory waitingGames = new uint256[](limit);
        uint256 count = 0;
        
        for (uint256 i = gameCounter; i > 0 && count < limit; i--) {
            if (games[i].status == GameStatus.Waiting) {
                waitingGames[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = waitingGames[i];
        }
        
        return result;
    }
    
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee cannot exceed 10%");
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
}