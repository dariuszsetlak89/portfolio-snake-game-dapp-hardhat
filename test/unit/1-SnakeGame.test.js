const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SnakeGame Unit Tests", function () {
          let deployer,
              player1,
              snakeGame,
              snakeTokenAddress,
              snakeToken,
              snakeNftAddress,
              snakeNft,
              superPetNftAddress,
              superPetNft;
          beforeEach(async () => {
              // Deploy smart contracts
              await deployments.fixture(["snakegame"]);
              // Get accounts: deployer, player
              deployer = (await getNamedAccounts()).deployer;
              player1 = (await getNamedAccounts()).player1;
              // Get contract: SnakeGame
              snakeGame = await ethers.getContract("SnakeGame", deployer);
              // Get contract: SnakeToken
              snakeTokenAddress = await snakeGame.i_snakeToken();
              snakeToken = await ethers.getContractAt("Token", snakeTokenAddress);
              // Get contract: SnakeNft
              snakeNftAddress = await snakeGame.i_snakeNft();
              snakeNft = await ethers.getContractAt("Nft", snakeNftAddress);
              // Get contract: SuperPetNft
              superPetNftAddress = await snakeGame.i_superPetNft();
              superPetNft = await ethers.getContractAt("Nft", superPetNftAddress);
          });

          describe("constructor", async () => {
              it("creates `SnakeToken` contract instance properly", async () => {
                  const snakeTokenAddress = await snakeGame.i_snakeToken();
                  const snakeTokenName = await snakeToken.name();
                  const snakeTokenSymbol = await snakeToken.symbol();
                  assert.equal(snakeToken.address, snakeTokenAddress);
                  assert.equal(snakeTokenName, "Snake Token");
                  assert.equal(snakeTokenSymbol, "SNAKE");
              });
              it("creates `SnakeNft` contract instance properly", async () => {
                  const snakeNftAddress = await snakeGame.i_snakeNft();
                  const snakeNftName = await snakeNft.name();
                  const snakeNftSymbol = await snakeNft.symbol();
                  const snakeNftUriZero = await snakeNft.getNftUris(0);
                  const snakeNftUriOne = await snakeNft.getNftUris(1);
                  const snakeNftUriTwo = await snakeNft.getNftUris(2);
                  const isInitialized = await snakeNft.getInitialized();
                  assert.equal(snakeNft.address, snakeNftAddress);
                  assert.equal(snakeNftName, "Snake NFT");
                  assert.equal(snakeNftSymbol, "SNFT");
                  assert(snakeNftUriZero.includes("snakeNftUri0"));
                  assert(snakeNftUriOne.includes("snakeNftUri1"));
                  assert(snakeNftUriTwo.includes("snakeNftUri2"));
                  assert.equal(isInitialized, true);
              });
              it("creates `SuperPetNft` contract instance properly", async () => {
                  const superPetNftAddress = await snakeGame.i_superPetNft();
                  const superPetNftName = await superPetNft.name();
                  const superPetNftSymbol = await superPetNft.symbol();
                  const superPetNftUriZero = await superPetNft.getNftUris(0);
                  const superPetNftUriOne = await superPetNft.getNftUris(1);
                  const superPetNftUriTwo = await superPetNft.getNftUris(2);
                  const isInitialized = await superPetNft.getInitialized();
                  assert.equal(superPetNft.address, superPetNftAddress);
                  assert.equal(superPetNftName, "Super Pet NFT");
                  assert.equal(superPetNftSymbol, "SPET");
                  assert(superPetNftUriZero.includes("superPetNftUri0"));
                  assert(superPetNftUriOne.includes("superPetNftUri1"));
                  assert(superPetNftUriTwo.includes("superPetNftUri2"));
                  assert.equal(isInitialized, true);
              });
              it("sets game immutable parameters properly", async () => {
                  const scoreRequired = await snakeGame.i_scoreRequired();
                  const snakeNftRequired = await snakeGame.i_snakeNftRequired();
                  const snakeExchangeRate = await snakeGame.i_snakeExchangeRate();
                  const superPetNftMintFee = await snakeGame.i_superPetNftMintFee();
                  const currentRound = await snakeGame.getGameRound();
                  assert.equal(scoreRequired, 100);
                  assert.equal(snakeNftRequired, 5);
                  assert.equal(snakeExchangeRate, 1e16);
                  assert.equal(superPetNftMintFee, 1e17);
                  assert.equal(currentRound, 1);
              });
              it("sets initial game round properly", async () => {
                  const currentRound = await snakeGame.getGameRound();
                  assert.equal(currentRound, 1);
              });
          });

          describe("gameStart", async () => {
              it("reverts when the game was already started before", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  // console.log(`Game baseFee: ${baseFee} SNAKE`);
                  await snakeToken.approve(snakeGame.address, baseFee);
                  await snakeGame.gameStart();
                  await expect(snakeGame.gameStart()).to.be.revertedWith("SnakeGame__GameAlreadyStarted");
              });
              it("reverts when SNAKE balance is less than calculated `gameFee`", async () => {
                  const snakeBalance = await snakeToken.balanceOf(deployer);
                  // console.log(`SNAKE balance: ${snakeBalance} SNAKE`);
                  await expect(snakeGame.gameStart()).to.be.revertedWith(
                      `SnakeGame__SnakeBalanceTooLow(${snakeBalance})`
                  );
              });
              it("sets `gameStartedFlag` parameter to value `true`", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, baseFee);
                  await snakeGame.gameStart();
                  const gameStartedFlag = (await snakeGame.getPlayerData(deployer)).gameStartedFlag;
                  assert.equal(gameStartedFlag, true);
              });
              it("burns `gameFee` amount of SNAKE tokens from Player's account", async () => {
                  await snakeGame.snakeAirdrop();
                  const snakeBalanceBefore = await snakeToken.balanceOf(deployer);
                  // console.log(`SNAKE balance before game start: ${snakeBalanceBefore}`);
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  // console.log(`Game baseFee: ${baseFee} SNAKE`);
                  await snakeToken.approve(snakeGame.address, baseFee);
                  await snakeGame.gameStart();
                  const snakeBalanceAfter = await snakeToken.balanceOf(deployer);
                  // console.log(`SNAKE balance after game start: ${snakeBalanceAfter}`);
                  assert.equal(Number(snakeBalanceBefore), Number(snakeBalanceAfter) + Number(baseFee));
              });
              it("emits event when game starts", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, baseFee);
                  await expect(snakeGame.gameStart()).to.emit(snakeGame, "GameStarted").withArgs(deployer);
              });
          });

          describe("gameOver", async () => {
              it("reverts when Player didn't start the game", async () => {
                  const gameScore = 100;
                  await expect(snakeGame.gameOver(gameScore)).to.be.revertedWith("SnakeGame__GameNotStarted");
              });
              it("updates parameter `gameStartedFlag` to value `false`", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, baseFee);
                  // Game play
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  //
                  const gameStartedFlag = (await snakeGame.getPlayerData(deployer)).gameStartedFlag;
                  // console.log(`gameStartedFlag: ${gameStartedFlag}`);
                  assert.equal(gameStartedFlag, false);
              });
              it("increases parameter `playerGamesPlayed` by 1", async () => {
                  const playerGamesPlayedBefore = (await snakeGame.getPlayerData(deployer)).playerGamesPlayed;
                  // console.log(`playerGamesPlayed before gameOver: ${playerGamesPlayedBefore}`);
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, baseFee);
                  // Game play
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  //
                  const playerGamesPlayed = (await snakeGame.getPlayerData(deployer)).playerGamesPlayed;
                  // console.log(`playerGamesPlayed after gameOver: ${playerGamesPlayed}`);
                  assert.equal(playerGamesPlayed, playerGamesPlayedBefore + 1);
              });
              it("updates parameter `playerLastScore` to last Player's score", async () => {
                  const playerLastScoreBefore = (await snakeGame.getPlayerData(deployer)).playerLastScore;
                  // console.log(`playerLastScore before gameOver: ${playerLastScoreBefore}`);
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, baseFee);
                  // Game play
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  //
                  const playerLastScore = (await snakeGame.getPlayerData(deployer)).playerLastScore;
                  // console.log(`playerLastScore after gameOver: ${playerLastScore}`);
                  assert.equal(playerLastScore, playerLastScoreBefore + gameScore);
              });
              it("updates parameter `playerBestScore` if last Player's score is higher than `playerBestScore`", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, 2 * baseFee);
                  // First game play
                  await snakeGame.gameStart();
                  const gameScore1 = 100;
                  await snakeGame.gameOver(gameScore1);
                  const playerBestScoreBefore = (await snakeGame.getPlayerData(deployer)).playerBestScore;
                  // console.log(`playerBestScore before: ${playerBestScoreBefore}`);
                  // Second game play
                  await snakeGame.gameStart();
                  const gameScore2 = 150;
                  await snakeGame.gameOver(gameScore2);
                  const playerBestScoreAfter = (await snakeGame.getPlayerData(deployer)).playerBestScore;
                  // console.log(`playerBestScore after: ${playerBestScoreAfter}`);
                  //
                  assert.equal(playerBestScoreAfter, gameScore2);
              });
              it("does not updates parameter `playerBestScore` if last Player's score is less than `playerBestScore`", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, 2 * baseFee);
                  // First game play
                  await snakeGame.gameStart();
                  const gameScore1 = 100;
                  await snakeGame.gameOver(gameScore1);
                  const playerBestScoreBefore = (await snakeGame.getPlayerData(deployer)).playerBestScore;
                  // console.log(`playerBestScore before: ${playerBestScoreBefore}`);
                  // Second game play
                  await snakeGame.gameStart();
                  const gameScore2 = 50;
                  await snakeGame.gameOver(gameScore2);
                  const playerBestScoreAfter = (await snakeGame.getPlayerData(deployer)).playerBestScore;
                  // console.log(`playerBestScore after: ${playerBestScoreAfter}`);
                  //
                  assert.equal(playerBestScoreAfter, gameScore1);
              });
              it("increases parameter `roundGamesPlayed` by 1", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, baseFee);
                  const currentRound = snakeGame.getGameRound();
                  const roundGamesPlayedBefore = (await snakeGame.getGameRoundData(currentRound)).roundGamesPlayed;
                  // console.log(`roundGamesPlayed before: ${roundGamesPlayedBefore}`);
                  // Game play
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  //
                  const roundGamesPlayed = (await snakeGame.getGameRoundData(currentRound)).roundGamesPlayed;
                  // console.log(`roundGamesPlayed after: ${roundGamesPlayed}`);
                  assert.equal(roundGamesPlayed, roundGamesPlayedBefore + 1);
              });
              it("updates parameters `roundBestPlayer` and `roundHighestScore` ONLY when not played using airdropped SNAKE tokens", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, 5 * baseFee);
                  const currentRound = snakeGame.getGameRound();
                  const roundBestPlayerBefore = (await snakeGame.getGameRoundData(currentRound)).roundBestPlayer;
                  // console.log(`roundBestPlayer before game play: ${roundBestPlayerBefore}`);
                  const roundHighestScoreBefore = (await snakeGame.getGameRoundData(currentRound)).roundHighestScore;
                  // console.log(`roundHighestScore before game play: ${roundHighestScoreBefore}`);
                  // Airdropped SNAKE tokens game play
                  for (let i = 1; i <= 3; i++) {
                      await snakeGame.gameStart();
                      const gameScoreTestGame = 100 * i;
                      await snakeGame.gameOver(gameScoreTestGame);
                      const roundBestPlayerTestGame = (await snakeGame.getGameRoundData(currentRound)).roundBestPlayer;
                      // console.log(`roundBestPlayer after ${i} test game play: ${roundBestPlayerTestGame}`);
                      const roundBestScoreTestGame = (await snakeGame.getGameRoundData(currentRound)).roundHighestScore;
                      // console.log(`roundHighestScore after ${i} test game play: ${roundBestScoreTestGame}`);
                      assert.equal(roundBestPlayerTestGame, roundBestPlayerBefore);
                      assert.equal(roundBestScoreTestGame, roundHighestScoreBefore);
                  }
                  // Purchased SNAKE tokens game play
                  const snakeToBuy = baseFee;
                  const snakeExchangeRate = await snakeGame.i_snakeExchangeRate();
                  const payment = snakeToBuy * snakeExchangeRate;
                  // console.log(`payment: ${ethers.utils.formatEther(payment.toString())} ETH`);
                  await snakeGame.buySnake(snakeToBuy, { value: payment.toString() });
                  await snakeGame.gameStart();
                  const gameScorePurchasedGame = 400;
                  await snakeGame.gameOver(gameScorePurchasedGame);
                  const roundBestPlayerPurchasedGame = (await snakeGame.getGameRoundData(currentRound)).roundBestPlayer;
                  // console.log(`roundBestPlayer after purchased SNAKE game play: ${roundBestPlayerPurchasedGame}`);
                  const roundHighestScorePurchasedGame = (await snakeGame.getGameRoundData(currentRound))
                      .roundHighestScore;
                  // console.log(`roundHighestScore after purchased SNAKE game play: ${roundHighestScorePurchasedGame}`);
                  assert.equal(roundBestPlayerPurchasedGame, deployer);
                  assert.equal(roundHighestScorePurchasedGame, gameScorePurchasedGame);
              });
              it("mint `Snake NFT` ONLY when not played using airdropped SNAKE tokens AND score is higher than `i_scoreRequired`", async () => {
                  await snakeGame.snakeAirdrop();
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  await snakeToken.approve(snakeGame.address, 5 * baseFee);
                  const snakeBalanceBefore = await snakeNft.balanceOf(deployer);
                  // console.log(`snakeBalance before game play: ${snakeBalanceBefore}`);
                  // Airdropped SNAKE tokens game play
                  for (let i = 1; i <= 3; i++) {
                      await snakeGame.gameStart();
                      const gameScoreTestGame = 100 * i;
                      await snakeGame.gameOver(gameScoreTestGame);
                      const snakeBalanceTestGame = await snakeNft.balanceOf(deployer);
                      // console.log(`snakeBalance after ${i} test game play: ${snakeBalanceBefore}`);
                      assert.equal(snakeBalanceTestGame.toString(), snakeBalanceBefore.toString());
                  }
                  // Purchased SNAKE tokens game play
                  const snakeToBuy = baseFee;
                  const snakeExchangeRate = await snakeGame.i_snakeExchangeRate();
                  const payment = snakeToBuy * snakeExchangeRate;
                  // console.log(`payment: ${ethers.utils.formatEther(payment.toString())} ETH`);
                  await snakeGame.buySnake(snakeToBuy, { value: payment.toString() });
                  await snakeGame.gameStart();
                  const gameScorePurchasedGame = 400;
                  await snakeGame.gameOver(gameScorePurchasedGame);
                  const snakeBalancePurchasedGame = await snakeNft.balanceOf(deployer);
                  // console.log(`snakeBalance after purchased game play: ${snakeBalancePurchasedGame}`);
                  assert.equal(snakeBalancePurchasedGame.toString(), 1);
              });
              it("sets parameter `superPetNftClaimFlag` to value `true` when conditions are met", async () => {
                  // Buy SNAKE tokens
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  const snakeToBuy = 5 * baseFee;
                  const snakeExchangeRate = await snakeGame.i_snakeExchangeRate();
                  const payment = snakeToBuy * snakeExchangeRate;
                  await snakeGame.buySnake(snakeToBuy, { value: payment.toString() });
                  await snakeToken.approve(snakeGame.address, snakeToBuy);
                  const superPetNftClaimFlag = (await snakeGame.getPlayerData(deployer)).superPetNftClaimFlag;
                  // console.log(`superPetNftClaimFlag before game plays: ${superPetNftClaimFlag}`);
                  // Purchased SNAKE tokens game play
                  for (let i = 1; i <= 5; i++) {
                      await snakeGame.gameStart();
                      const gameScorePurchasedGame = 400;
                      await snakeGame.gameOver(gameScorePurchasedGame);
                  }
                  const superPetNftClaimFlagAfter = (await snakeGame.getPlayerData(deployer)).superPetNftClaimFlag;
                  // console.log(`superPetNftClaimFlag after game plays: ${superPetNftClaimFlagAfter}`);
                  assert.equal(superPetNftClaimFlagAfter, true);
              });
              it("emits event when game overs", async () => {
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  const snakeExchangeRate = await snakeGame.i_snakeExchangeRate();
                  const payment = baseFee * snakeExchangeRate;
                  await snakeGame.buySnake(baseFee, { value: payment.toString() });
                  await snakeToken.approve(snakeGame.address, baseFee);
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await expect(snakeGame.gameOver(gameScore)).to.emit(snakeGame, "GameOver").withArgs(deployer);
              });
          });

          describe("finishRound", async () => {
              it("updates global parameter `s_gamesPlayedTotal", async () => {
                  // Buy SNAKE tokens
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  const snakeExchangeRate = await snakeGame.i_snakeExchangeRate();
                  const payment = baseFee * snakeExchangeRate;
                  await snakeGame.buySnake(baseFee, { value: payment.toString() });
                  await snakeToken.approve(snakeGame.address, baseFee);
                  // Play the game
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  //
                  const gamesPlayedTotalBefore = await snakeGame.getGamesPlayedTotal();
                  // console.log(`gamesPlayedTotal before finishRound: ${gamesPlayedTotalBefore}`);
                  const currentRoundBefore = await snakeGame.getGameRound();
                  const roundGamesPlayed = (await snakeGame.getGameRoundData(currentRoundBefore)).roundGamesPlayed;
                  // console.log(`roundGamesPlayed: ${roundGamesPlayed}`);
                  await snakeGame.finishRound();
                  const gamesPlayedTotalAfter = await snakeGame.getGamesPlayedTotal();
                  // console.log(`gamesPlayedTotal after finishRound: ${gamesPlayedTotalAfter}`);
                  assert.equal(
                      gamesPlayedTotalAfter.toString(),
                      (Number(gamesPlayedTotalBefore) + Number(roundGamesPlayed)).toString()
                  );
              });
              it("updates global parameters `s_highestScoreEver` and `s_bestPlayerEver` when score is higher than current `s_highestScoreEver`", async () => {
                  // Buy SNAKE tokens
                  const baseFee = await snakeGame.GAME_BASE_FEE();
                  const snakeExchangeRate = await snakeGame.i_snakeExchangeRate();
                  const payment = baseFee * snakeExchangeRate;
                  await snakeGame.buySnake(baseFee, { value: payment.toString() });
                  await snakeToken.approve(snakeGame.address, baseFee);
                  // Play the game
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  //
                  const highestScoreEverBefore = await snakeGame.getHighestScoreEver();
                  // console.log(`highestScoreEverBefore before finishRound: ${highestScoreEverBefore}`);
                  const bestPlayerEverBefore = await snakeGame.getBestPlayerEver();
                  // console.log(`bestPlayerEverBefore before finishRound: ${bestPlayerEverBefore}`);
                  const currentRoundBefore = await snakeGame.getGameRound();
                  const roundGamesPlayed = (await snakeGame.getGameRoundData(currentRoundBefore)).roundGamesPlayed;
                  // console.log(`roundGamesPlayed: ${roundGamesPlayed}`);
                  //
                  await snakeGame.finishRound();
                  const highestScoreEverAfter = await snakeGame.getHighestScoreEver();
                  // console.log(`highestScoreEver after finishRound: ${highestScoreEverAfter}`);
                  const bestPlayerEverAfter = await snakeGame.getBestPlayerEver();
                  // console.log(`bestPlayerEver after finishRound: ${bestPlayerEverAfter}`);
                  assert.equal(highestScoreEverAfter.toString(), gameScore);
                  assert.equal(bestPlayerEverAfter, deployer);
              });
              it("NEED MORE TESTS FOR `finishRound`", async () => {});
          });

          describe("snakeAirdrop", async () => {
              it("reverts when Player received airdrop earlier", async () => {
                  await snakeGame.snakeAirdrop();
                  await expect(snakeGame.snakeAirdrop()).to.be.revertedWith("SnakeGame__SnakeAirdopAlreadyReceived");
              });
              it("sets parameter `snakeAirdropFlag` to value `true`", async () => {
                  await snakeGame.snakeAirdrop();
                  const gameStartedFlag = (await snakeGame.getPlayerData(deployer)).snakeAirdropFlag;
                  assert.equal(gameStartedFlag, true);
              });
              it("mint SNAKE airdrop tokens to Player's account", async () => {
                  await snakeGame.snakeAirdrop();
                  const snakeBalance = (await snakeToken.balanceOf(deployer)).toString();
                  const snakeAirdropAmount = await snakeGame.SNAKE_AIRDROP();
                  // console.log(`Snake airdrop amount: ${snakeAirdropAmount}`);
                  assert.equal(snakeBalance, snakeAirdropAmount);
              });
              it("emits event after airdrop receive", async () => {
                  const snakeAirdropAmount = await snakeGame.SNAKE_AIRDROP();
                  await expect(snakeGame.snakeAirdrop())
                      .to.emit(snakeGame, "SnakeAirdropReceived")
                      .withArgs(deployer, snakeAirdropAmount);
              });
          });

          describe("buySnake", async () => {
              it("reverts when Player doesn't sent enough currency with transaction call", async () => {
                  const snakeToBuy = 10;
                  const snakeEthRate = await snakeGame.i_snakeExchangeRate();
                  const expectedEthPayment = snakeToBuy * snakeEthRate;
                  // console.log("expectedEthPayment:", (expectedEthPayment / 1e18).toString());
                  const ethPayment = ethers.utils.parseEther("0.09"); // 0.03 ETH - less than required
                  // console.log("ethPayment:", (ethPayment / 1e18).toString());
                  await expect(snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() })).to.be.revertedWith(
                      "SnakeGame__NotEnoughCurrencySent"
                  );
              });
              it("mint bought SNAKE tokens to Player's account", async () => {
                  const snakeToBuy = 10;
                  const snakeEthRate = await snakeGame.i_snakeExchangeRate();
                  const ethPayment = snakeToBuy * snakeEthRate;
                  await snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() });
                  const snakeBalance = (await snakeToken.balanceOf(deployer)).toString();
                  // console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance, 10);
              });
              it("emits event after SNAKE tokens purchase", async () => {
                  const snakeToBuy = 10;
                  const snakeEthRate = await snakeGame.i_snakeExchangeRate();
                  const ethPayment = snakeToBuy * snakeEthRate;
                  await expect(snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() }))
                      .to.emit(snakeGame, "SnakeTokensBought")
                      .withArgs(deployer, snakeToBuy);
              });
          });

          describe("mintSuperPetNft", async () => {});

          describe("_mintSnakeNft", async () => {});

          describe("_burnSnakeNfts", async () => {});

          describe("_checkSuperPetNft", async () => {});

          describe("_mintSuperPetNft", async () => {});

          describe("_gameFeeCalculation", async () => {});

          describe("getGameRound", async () => {
              it("should return current game round", async () => {
                  const currentGameRound = await snakeGame.getGameRound();
                  // console.log(`Current game round: ${currentGameRound}`);
                  assert.equal(currentGameRound, 1);
              });
          });

          describe("getHighestScoreEver", async () => {
              it("should return value of `highestScoreEver` parameter", async () => {
                  const highestScoreEver = await snakeGame.getHighestScoreEver();
                  // console.log(`Highest score ever: ${highestScoreEver}`);
                  assert.equal(highestScoreEver, 0);
              });
          });

          describe("getBestPlayerEver", async () => {
              it("should return `bestPlayerEver` address", async () => {
                  const bestPlayerEver = await snakeGame.getBestPlayerEver();
                  // console.log(`Best player ever address: ${bestPlayerEver}`);
                  addressZero = "0x0000000000000000000000000000000000000000";
                  assert.equal(bestPlayerEver, addressZero);
              });
          });

          describe("getGamesPlayedTotal", async () => {
              it("should return value of `gamesPlayedTotal` parameter", async () => {
                  const gamesPlayedTotal = await snakeGame.getGamesPlayedTotal();
                  // console.log(`Games played total: ${gamesPlayedTotal}`);
                  assert.equal(gamesPlayedTotal, 0);
              });
          });

          describe("getGameRoundData", async () => {
              it("should return struct of GameRoundData parameters of given game round", async () => {
                  const currentGameRound = await snakeGame.getGameRound();
                  const gameRoundData = await snakeGame.getGameRoundData(currentGameRound);
                  addressZero = "0x0000000000000000000000000000000000000000";
                  assert.equal(gameRoundData.roundGamesPlayed, 0);
                  assert.equal(gameRoundData.roundHighestScore, 0);
                  assert.equal(gameRoundData.roundBestPlayer, addressZero);
              });
          });

          describe("getPlayerData", async () => {
              it("should return struct of PlayerData parameters of given Player's address", async () => {
                  const currentGameRound = await snakeGame.getGameRound();
                  const gamePlayerData = await snakeGame.getPlayerData(deployer);
                  assert.equal(gamePlayerData.snakeAirdropFlag, false);
                  assert.equal(gamePlayerData.gameStartedFlag, false);
                  assert.equal(gamePlayerData.superPetNftClaimFlag, false);
                  assert.equal(gamePlayerData.playerGamesPlayed, 0);
                  assert.equal(gamePlayerData.playerLastScore, 0);
                  assert.equal(gamePlayerData.playerBestScore, 0);
                  assert.equal(gamePlayerData.mintedSnakeNfts, 0);
                  assert.equal(gamePlayerData.mintedSuperPetNfts, 0);
              });
          });

          describe("getBalance", async () => {
              it("should return `SnakeGame` contract balance", async () => {
                  const snakeGameBalance = await snakeGame.getBalance();
                  // console.log(`SnakeGame contract balance: ${snakeGameBalance}`);
                  assert.equal(snakeGameBalance, 0);
              });
          });

          describe("getRandomNumber", async () => {
              it("should return zero or positive integer random number, less than given range parameter", async () => {
                  const range = 10;
                  const randomNumber = await snakeGame.getRandomNumber(range);
                  // console.log(`Random number (less than ${range}): ${randomNumber}`);
                  assert(randomNumber >= 0 && randomNumber < range);
              });
          });

          describe("receive", async () => {
              it("should invoke the `receive` function and receive ETH payment", async () => {
                  const [signer] = await ethers.getSigners();
                  const ethAmount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeGame.address, data: "0x", value: ethAmount });
                  await expect(tx).to.emit(snakeGame, "TransferReceived").withArgs(ethAmount);
                  const balance = ethers.utils.formatEther(await snakeGame.getBalance()).toString();
                  // console.log("balance:", balance.toString());
              });
          });

          describe("fallback", async () => {
              it("should invoke the `fallback` function and receive ETH payment", async () => {
                  const [signer] = await ethers.getSigners();
                  const ethAmount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeGame.address, data: "0x01", value: ethAmount });
                  await expect(tx).to.emit(snakeGame, "TransferReceived").withArgs(ethAmount);
                  const balance = ethers.utils.formatEther(await snakeGame.getBalance()).toString();
                  // console.log("balance:", balance.toString());
              });
          });
      });
