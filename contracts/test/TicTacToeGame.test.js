const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicTacToeGame", function () {
  let monToken;
  let ticTacToeGame;
  let owner;
  let player1;
  let player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const MONToken = await ethers.getContractFactory("MONToken");
    monToken = await MONToken.deploy();
    await monToken.deployed();

    const TicTacToeGame = await ethers.getContractFactory("TicTacToeGame");
    ticTacToeGame = await TicTacToeGame.deploy(monToken.address);
    await ticTacToeGame.deployed();

    // Mint tokens to players
    await monToken.faucet(player1.address, ethers.utils.parseEther("1000"));
    await monToken.faucet(player2.address, ethers.utils.parseEther("1000"));
  });

  it("Should create a game successfully", async function () {
    const stakeAmount = ethers.utils.parseEther("10");
    
    await monToken.connect(player1).approve(ticTacToeGame.address, stakeAmount);
    const tx = await ticTacToeGame.connect(player1).createGame(stakeAmount);
    const receipt = await tx.wait();
    
    const gameCreatedEvent = receipt.events?.find(e => e.event === 'GameCreated');
    expect(gameCreatedEvent).to.not.be.undefined;
  });

  it("Should join a game successfully", async function () {
    const stakeAmount = ethers.utils.parseEther("10");
    
    // Create game
    await monToken.connect(player1).approve(ticTacToeGame.address, stakeAmount);
    const createTx = await ticTacToeGame.connect(player1).createGame(stakeAmount);
    const receipt = await createTx.wait();
    const gameCreatedEvent = receipt.events?.find(e => e.event === 'GameCreated');
    const gameId = gameCreatedEvent.args.gameId;
    
    // Join game
    await monToken.connect(player2).approve(ticTacToeGame.address, stakeAmount);
    await ticTacToeGame.connect(player2).joinGame(gameId, stakeAmount);
    
    const game = await ticTacToeGame.getGame(gameId);
    expect(game.playerO).to.equal(player2.address);
    expect(game.status).to.equal(1); // Playing
  });
});
