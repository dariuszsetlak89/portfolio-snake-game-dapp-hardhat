// const hre = require("hardhat");
// const { network, deployments, ethers, getNamedAccounts } = hre;
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SnakeGame Unit Tests", function () {
          beforeEach(async () => {
              // Deploy smart contracts
              await deployments.fixture(["SnakeGame", "GameTokens"]);
              // Get accounts: deployer, player
              deployer = (await getNamedAccounts()).deployer;
              player1 = (await getNamedAccounts()).player1;
              console.log(`Deployer address: ${deployer}`);
              console.log(`Player1 address: ${player1}`);
              // Get contract: SnakeGame
              snakeGame = await ethers.getContract("SnakeGame", deployer);
              // Get contract: GameTokens
              gameTokens = await ethers.getContract("GameTokens", deployer);
              // Get contract: SnakeToken
              snakeTokenAddress = await gameTokens.getSnakeContractAddress();
              snakeToken = await ethers.getContractAt("Token", snakeTokenAddress);
              // Get contract: FruitToken
              fruitTokenAddress = await gameTokens.getFruitContractAddress();
              fruitToken = await ethers.getContractAt("Token", fruitTokenAddress);
          });

          describe("gameStart", async () => {
              it("reverts when player don't have any gameCredits", async () => {
                  await expect(snakeGame.gameStart()).to.be.revertedWith(
                      "SnakeGame__NoGameCredits"
                  );
              });
              it.only("decrements `gameCredits` by one", async () => {
                  await gameTokens.snakeAirdropClaim();
                  await snakeToken.approve(gameTokens.address, 1000);
                  const gameCreditsBeforeBuyCredits = (
                      await gameTokens.getPlayerData()
                  ).gameCredits.toString();
                  console.log("JS: GameCredits before BuyCredits:", gameCreditsBeforeBuyCredits);
                  // 0
                  await gameTokens.buyCredits(2);
                  // 2
                  const gameCreditsBeforeStart = (
                      await gameTokens.getPlayerData()
                  ).gameCredits.toString();
                  console.log("JS: GameCredits before gameStart:", gameCreditsBeforeStart);
                  // 2
                  await snakeGame.gameStart();
                  const expectedGameCredits = 1;
                  const gameCreditsAfter = (
                      await gameTokens.getPlayerData()
                  ).gameCredits.toString();
                  console.log("JS: GameCredits after gameStart:", gameCreditsAfter);
                  assert.equal(expectedGameCredits, gameCreditsAfter);
              });
              it("sets parameter `gameStartedFlag` to `true`", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartedFlagBeforeCall = (await snakeGame.getPlayerData())
                      .gameStartedFlag;
                  // console.log(gameStartedFlagBeforeCall);
                  const gameStartCall = await snakeGame.gameStart();
                  const gameStartedFlagAfterCall = (await snakeGame.getPlayerData())
                      .gameStartedFlag;
                  // console.log(gameStartedFlagAfterCall);
                  assert.equal(gameStartedFlagAfterCall, true);
              });
              it("emits event when game starts", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  await expect(snakeGame.gameStart()).to.emit(snakeGame, "GameStarted");
              });
          });

          describe("gameOver", async () => {
              it("reverts when player didn't start the game", async () => {
                  const gameScore = 50;
                  await expect(snakeGame.gameOver(gameScore)).to.be.revertedWith(
                      "SnakeGame__GameNotStarted"
                  );
              });
              it("sets parameter `gameStartedFlag` to `false`", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const gameStartedFlagBeforeCall = (await snakeGame.getPlayerData())
                      .gameStartedFlag;
                  // console.log(gameStartedFlagBeforeCall);
                  const gameScore = 50;
                  const gameOverCall = await snakeGame.gameOver(gameScore);
                  const gameStartedFlagAfterCall = (await snakeGame.getPlayerData())
                      .gameStartedFlag;
                  // console.log(gameStartedFlagAfterCall);
                  assert.equal(gameStartedFlagAfterCall, false);
              });
              it("adds score to parameter `fruitToClaim`", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const fruitToClaimBeforeCall = (
                      await snakeGame.getPlayerData()
                  ).fruitToClaim.toString();
                  // console.log(fruitToClaimBeforeCall);
                  const gameScore = 50;
                  const gameOverCall = await snakeGame.gameOver(gameScore);
                  const fruitToClaimAfterCall = (
                      await snakeGame.getPlayerData()
                  ).fruitToClaim.toString();
                  // console.log(fruitToClaimAfterCall);
                  assert.equal(fruitToClaimAfterCall, gameScore);
              });
              it("increments parameter `gamesPlayed`", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const gamesPlayedBeforeCall = (await snakeGame.getPlayerStats(deployer))
                      .gamesPlayed;
                  // console.log(gamesPlayedBeforeCall);
                  const gameScore = 50;
                  const gameOverCall = await snakeGame.gameOver(gameScore);
                  const gamesPlayedAfterCall = (await snakeGame.getPlayerStats(deployer))
                      .gamesPlayed;
                  // console.log(gamesPlayedAfterCall);
                  assert.equal(gamesPlayedAfterCall, 1);
              });
              it("adds score to parameter `fruitTokensCollected`", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const fruitTokensCollectedBeforeCall = (
                      await snakeGame.getPlayerStats(deployer)
                  ).fruitTokensCollected.toString();
                  // console.log(fruitTokensCollectedBeforeCall);
                  const gameScore = 50;
                  const gameOverCall = await snakeGame.gameOver(gameScore);
                  const fruitTokensCollectedAfterCall = (
                      await snakeGame.getPlayerStats(deployer)
                  ).fruitTokensCollected.toString();
                  // console.log(fruitTokensCollectedAfterCall);
                  assert.equal(fruitTokensCollectedAfterCall, gameScore);
              });
              it("increment parameter `snakeNftsToClaim` if condition passed ", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const scoreToClaimNft = await snakeGame.getScoreToClaimNft();
                  // console.log(scoreToClaimNft);
                  const snakeNftsToClaimBeforeCall = (await snakeGame.getPlayerData())
                      .snakeNftsToClaim;
                  // console.log(snakeNftsToClaimBeforeCall);
                  const gameScore = 50;
                  const gameOverCall = await snakeGame.gameOver(gameScore);
                  const snakeNftsToClaimAfterCall = (await snakeGame.getPlayerData())
                      .snakeNftsToClaim;
                  // console.log(snakeNftsToClaimAfterCall);
                  assert(gameScore >= scoreToClaimNft);
                  assert.equal(snakeNftsToClaimAfterCall, 1);
              });
              it("emits event `SnakeNftUnlocked` if condition passed", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const gameScore = 50;
                  await expect(snakeGame.gameOver(gameScore)).to.emit(
                      snakeGame,
                      "SnakeNftUnlocked"
                  );
              });
              it("sets parameter `lastScore` to be equal to given parameter `score`", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const lastScoreBeforeCall = (
                      await snakeGame.getPlayerStats(deployer)
                  ).lastScore.toString();
                  // console.log(lastScoreBeforeCall);
                  const gameScore = 50;
                  const gameOverCall = await snakeGame.gameOver(gameScore);
                  const lastScoreAfterCall = (
                      await snakeGame.getPlayerStats(deployer)
                  ).lastScore.toString();
                  // console.log(lastScoreAfterCall);
                  assert.equal(lastScoreAfterCall, gameScore);
              });
              it("sets parameter `bestScore` to be equal to given parameter `score` if condition passed", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const bestScoreBeforeCall = (
                      await snakeGame.getPlayerStats(deployer)
                  ).bestScore.toString();
                  // console.log(bestScoreBeforeCall);
                  const gameScore = 50;
                  const gameOverCall = await snakeGame.gameOver(gameScore);
                  const bestScoreAfterCall = (
                      await snakeGame.getPlayerStats(deployer)
                  ).bestScore.toString();
                  // console.log(bestScoreAfterCall);
                  assert(gameScore >= bestScoreBeforeCall);
                  assert.equal(bestScoreAfterCall, gameScore);
              });
              it("sets parameter `bestScore` to be equal to given parameter `score` if condition passed", async () => {
                  // Need to call function fundGame from GameTokens smart contract!!!
                  // Simulate call function gameFund: Add 1 gameCredits
                  const setGameCredits = await snakeGame.setPlayerData();
                  const gameStartCall = await snakeGame.gameStart();
                  const gameScore = 50;
                  await expect(snakeGame.gameOver(gameScore)).to.emit(snakeGame, "GameOver");
              });
          });

          describe("withdrawEth", async () => {
              it("withdraw given amount ETH from `snakeGame` smart contract successfully", async () => {
                  const ethAmount = ethers.utils.parseEther("1");
                  sendEthToContract = await snakeGame.fallback({ value: ethAmount });
                  ethBalanceBeforeWithdrawal = (await snakeGame.getEthBalance()).toString();
                  // console.log(ethBalanceBeforeWithdrawal);
                  withdrawEthFromContract = await snakeGame.withdrawEth(ethAmount);
                  ethBalanceAfterWithdrawal = (await snakeGame.getEthBalance()).toString();
                  // console.log(ethBalanceAfterWithdrawal);
                  assert.equal(ethBalanceAfterWithdrawal, ethBalanceBeforeWithdrawal - ethAmount);
              });
              it("reverts when ETH withdrawal didn't pass", async () => {
                  const ethAmount = ethers.utils.parseEther("1");
                  ethBalanceBeforeWithdrawal = (await snakeGame.getEthBalance()).toString();
                  // console.log(ethBalanceBeforeWithdrawal);
                  await expect(snakeGame.withdrawEth(ethAmount)).to.be.revertedWith(
                      "SnakeGame__EthWithdrawalFailed"
                  );
              });
          });

          // Need to write more tests for getter functions, receive and fallback:
          // getAnyPlayerData
          // getPlayerData
          // getPlayerStats
          // getCurrentPlayerAddress
          // getScoreToClaimNft
          // getSnakeGameContractAddress
          // getEthBalance
          // receive
          // fallback
          // setPlayerData - to be deleted
      });
