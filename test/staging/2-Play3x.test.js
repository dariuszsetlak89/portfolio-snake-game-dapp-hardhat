const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

/*
  This test is prepared to run both on development network like Hardhat or testnet network
  like Goerli. To run this test on development network simply put exclamation mark in front
  of first code line below like this: '!developmentChains.includes(network.name)'and change
  test 'it' to 'it.only', to run only this test, without running also all unit tests from
  'unit' folder.
*/
developmentChains.includes(network.name)
    ? describe.skip
    : describe("SnakeGame Staging Test: Play Snake Game 3x", function () {
          let deployer,
              player1,
              snakeGame,
              snakeTokenAddress,
              snakeToken,
              fruitTokenAddress,
              fruitToken,
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
              // Get contract: FruitToken
              fruitTokenAddress = await snakeGame.i_fruitToken();
              fruitToken = await ethers.getContractAt("Token", fruitTokenAddress);
              // Get contract: SnakeNft
              snakeNftAddress = await snakeGame.i_snakeNft();
              snakeNft = await ethers.getContractAt("Nft", snakeNftAddress);
              // Get contract: SuperPetNft
              superPetNftAddress = await snakeGame.i_superPetNft();
              superPetNft = await ethers.getContractAt("Nft", superPetNftAddress);
          });

          describe("Play Snake Game", async () => {
              it("Snake Game gameplay simulation - 3x", async () => {
                  console.log("-------------------------------------------------------------");
                  console.log("              !!! Snake Game Gameplay - 3x !!!");
                  console.log("-------------------------------------------------------------");

                  // Test description:
                  // 1) Player gets SNAKE airdrop: +10 SNAKE
                  // 2) Player buys gameCredits: +2
                  // 3) Player plays the game first time: game1, gameScore = 100
                  // 4) Player plays the game second time: game2, gameScore = 150
                  // 5) Player claims FRUIT tokens: +250 FRUIT
                  // 6) Player swap FRUIT to SNAKE: 100 FRUIT => 5 SNAKE
                  // 7) Player buys gameCredits: gameCredits += 1 = 1
                  // 8) Player plays the game third time: game3, gameScore = 100
                  // 9) Player claims FRUIT tokens: +50 FRUIT
                  // 10) Player claims `Snake NFTs`: +2 SNFT
                  // 11) Player checks `Super Pet NFT` claim eligibility
                  // 12) Player try to claim `Super Pet NFT` - transaction should revert
                  // 13) FINAL PLAYER'S GAME TOKENS BALANCES

                  // -------------------------------------------------------------------------

                  // 1) Player gets SNAKE airdrop: +10 SNAKE
                  console.log("1) Player get SNAKE airdrop: +10 SNAKE");
                  await snakeGame.snakeAirdrop();
                  // SNAKE balance: 10 SNAKE
                  let snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 10);

                  console.log("-------------------------------------------------------------");

                  // 2) Player buys gameCredits: gameCredits += 2 = 2
                  console.log("2) Player buys gameCredits:  gameCredits += 2");
                  let snakeBalanceBeforeBuy = await snakeToken.balanceOf(deployer);
                  console.log("snakeBalanceBeforeBuy:", snakeBalanceBeforeBuy.toString());
                  // Approve `SnakeGame` to transfer 10 SNAKE tokens
                  await snakeToken.approve(snakeGame.address, snakeBalance);
                  // gameCredits += 2
                  await snakeGame.buyCredits(2);
                  // gameCredits = 2
                  let gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 2);
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 2);
                  // Calculate Game Credit price
                  let superPetNftBalance = await superPetNft.balanceOf(deployer);
                  let gameCreditBasePrice = await snakeGame.GAME_CREDIT_BASE_PRICE();
                  console.log("gameCreditBasePrice:", gameCreditBasePrice.toString());
                  let gameCreditPrice = gameCreditBasePrice - superPetNftBalance;
                  console.log("gameCreditPrice:", gameCreditPrice.toString());

                  console.log("-------------------------------------------------------------");

                  // 3) Player plays the game first time: game1, gameScore = 100
                  console.log("3) Player plays the game first time: game1");
                  // Game start: game nr1
                  console.log("GameStart game nr: 1");
                  await snakeGame.gameStart();
                  // gameCredits -= 1
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 1);
                  // gameStartedFlag == true
                  gameStartedFlag = (await snakeGame.getPlayerData()).gameStartedFlag;
                  console.log("gameStartedFlag:", gameStartedFlag.toString());
                  assert.equal(gameStartedFlag, true);
                  // Game over: game nr1
                  console.log("GameOver game nr: 1");
                  let gameScore = 100;
                  console.log("gameScore:", gameScore.toString());
                  await snakeGame.gameOver(gameScore);
                  // fruitToClaim += gameScore
                  let fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, gameScore);
                  // gameStartedFlag == false
                  gameStartedFlag = (await snakeGame.getPlayerData()).gameStartedFlag;
                  console.log("gameStartedFlag:", gameStartedFlag.toString());
                  assert.equal(gameStartedFlag, false);
                  // gamesPlayed += 1
                  let gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                  console.log("gamesPlayed:", gamesPlayed.toString());
                  assert.equal(gamesPlayed, 1);
                  // lastScore += gameScore
                  let lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                  console.log("lastScore:", lastScore.toString());
                  assert.equal(lastScore, gameScore);
                  // bestScore = gameScore = 100 (first gameplay)
                  let bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                  console.log("bestScore:", bestScore.toString());
                  assert.equal(bestScore, gameScore);
                  // snakeNftsToClaim += 1
                  let snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim.toString();
                  console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  assert.equal(snakeNftsToClaim, 1);

                  console.log("-------------------------------------------------------------");

                  // 4) Player plays the game second time: game2, gameScore = 150
                  console.log("4) Player plays the game second time: game2");
                  // Player plays the game second time
                  gameScore = 150;
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(gameScore);
                  // gameCredits -= 1 = 0
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 0);
                  // fruitToClaim += gameScore = 100 + 150 = 250
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, 250);
                  // gamesPlayed += 1 = 1 + 1 = 2
                  gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                  console.log("gamesPlayed:", gamesPlayed.toString());
                  assert.equal(gamesPlayed, 2);
                  // lastScore += gameScore = 150
                  lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                  console.log("lastScore:", lastScore.toString());
                  assert.equal(lastScore, gameScore);
                  // bestScore = gameScore = 150 (second score > first score)
                  bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                  console.log("bestScore:", bestScore.toString());
                  assert.equal(bestScore, gameScore);
                  // snakeNftsToClaim += 1 = 1 + 1 = 2
                  snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim.toString();
                  console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  assert.equal(snakeNftsToClaim, 2);

                  console.log("-------------------------------------------------------------");

                  // 5) Player claims FRUIT tokens: +250 FRUIT
                  console.log("5) Player claims FRUIT tokens: +250 FRUIT");
                  // FRUIT tokens claim
                  await snakeGame.fruitClaim();
                  // FRUIT balance: 250 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 250);
                  // fruitsCollected += fruitToClaim = 250
                  fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                  console.log("fruitsCollected:", fruitsCollected.toString());
                  assert.equal(fruitsCollected, 250);
                  // fruitToClaim == 0
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, 0);

                  console.log("-------------------------------------------------------------");

                  // 6) Player swap FRUIT to SNAKE: 100 FRUIT => 5 SNAKE
                  console.log("6) Player swap FRUIT to SNAKE: 100 FRUIT => 5 SNAKE");
                  // Approve `SnakeGame` to transfer 100 FRUIT tokens
                  await fruitToken.approve(snakeGame.address, fruitBalance);
                  // fruitToSnakeRate = 20
                  let fruitToSnakeRate = await snakeGame.FRUIT_SNAKE_RATE();
                  console.log("fruitToSnakeRate:", fruitToSnakeRate.toString());
                  // Swap FRUIT to SNAKE: 100 FRUIT => 5 SNAKE
                  swapAmount = 100;
                  await snakeGame.fruitToSnakeSwap(swapAmount);
                  // FRUIT balance: 150 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 150);
                  // SNAKE balance: 5 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 7);

                  console.log("-------------------------------------------------------------");

                  // 7) Player buys gameCredits: gameCredits += 1 = 1
                  console.log("7) Player buys gameCredits: gameCredits += 1 = 1");
                  // Approve `SnakeGame` to transfer 5 SNAKE tokens
                  await snakeToken.approve(snakeGame.address, snakeBalance);
                  // gameCredits += 1
                  await snakeGame.buyCredits(1);
                  // gameCredits += 1 = 1
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 1);
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 3);

                  console.log("-------------------------------------------------------------");

                  // 8) Player plays the game third time: game3, gameScore = 50
                  console.log("8) Player plays the game third time: game3");
                  // Player plays the game third time
                  gameScore = 50;
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(gameScore);
                  // gameCredits -= 1 = 0
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 0);
                  // fruitToClaim += gameScore = 50
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, gameScore);
                  // gamesPlayed += 1 = 2 + 1 = 3
                  gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                  console.log("gamesPlayed:", gamesPlayed.toString());
                  assert.equal(gamesPlayed, 3);
                  // lastScore += gameScore = 50
                  lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                  console.log("lastScore:", lastScore.toString());
                  assert.equal(lastScore, gameScore);
                  // bestScore = 150 (third score < best score)
                  bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                  console.log("bestScore:", bestScore.toString());
                  assert.equal(bestScore, 150);
                  // snakeNftsToClaim += 0 = 2 (gameScore < 100)
                  snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim.toString();
                  console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  assert.equal(snakeNftsToClaim, 2);

                  console.log("-------------------------------------------------------------");

                  // 9) Player claims FRUIT tokens: +50 FRUIT
                  console.log("9) Player claims FRUIT tokens: +50 FRUIT");
                  // FRUIT tokens claim
                  await snakeGame.fruitClaim();
                  // FRUIT balance: 200 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 200);
                  // fruitsCollected += fruitToClaim = 200 + 200 = 250
                  fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                  console.log("fruitsCollected:", fruitsCollected.toString());
                  assert.equal(fruitsCollected, 300);
                  // fruitToClaim == 0
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, 0);

                  console.log("-------------------------------------------------------------");

                  // 10) Player claims `Snake NFTs`: +2 SNFT
                  console.log("10) Player claims `Snake NFTs`: +2 SNFT");
                  let snakeNftsAmount = 2;
                  // fruitMintFee = 100
                  let fruitMintFee = await snakeGame.FRUIT_MINT_FEE();
                  console.log("fruitMintFee:", fruitMintFee.toString());
                  // Approve `SnakeGame` to transfer 200 FRUIT tokens
                  await fruitToken.approve(snakeGame.address, fruitMintFee * snakeNftsAmount);
                  // `snakeNftsToClaim` value
                  snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim.toString();
                  console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  // Claim `Snake NFTs`: 2 x FOR loop
                  for (let i = 0; i < 2; i++) {
                      await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  }
                  // FRUIT balance: 0 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 0);
                  // snakeNftsAmount += 2 = 2
                  snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount.toString();
                  console.log("snakeNftsAmount:", snakeNftsAmount.toString());
                  assert.equal(snakeNftsAmount, 2);
                  // `Snake NFT` balance = 2 SNFT
                  let snakeNftsBalance = await snakeNft.balanceOf(deployer);
                  console.log("snakeNftsBalance:", snakeNftsBalance.toString());
                  assert.equal(snakeNftsBalance.toString(), 2);

                  console.log("-------------------------------------------------------------");

                  // 11) Player checks `Super Pet NFT` claim eligibility
                  console.log("11) Player checks `Super Pet NFT` claim eligibility");
                  // Check `Super Pet NFT` claim eligibility
                  await snakeGame.checkSuperNftClaim();
                  // superNftClaimFlag = false
                  let superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  console.log("superNftClaimFlag:", superNftClaimFlag.toString());
                  assert.equal(superNftClaimFlag, false);

                  console.log("-------------------------------------------------------------");

                  // 12) Player try to claim `Super Pet NFT` - transaction should revert
                  console.log("12) Player try to claim `Super Pet NFT` - transaction should revert");
                  await expect(snakeGame.superPetNftClaim()).to.be.revertedWith("SnakeGame__NoSuperNftToClaim");
                  superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  console.log("`Super Pet NFT` claim attempt failed - transaction reverted!");
                  console.log(`Reason: superNftClaimFlag = ${superNftClaimFlag.toString()}`);
                  assert.equal(superNftClaimFlag, false);

                  console.log("-------------------------------------------------------------");

                  // 13) FINAL PLAYER'S GAME TOKENS BALANCES
                  console.log("13) FINAL PLAYER'S GAME TOKENS BALANCES");
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  // FRUIT balance: 0 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  // Snake NFT balance: 0 SNFT
                  snakeNftBalance = await snakeNft.balanceOf(deployer);
                  console.log("SNFT balance:", snakeNftBalance.toString());
                  // Supet Pet NFT balance: 1 SNFT
                  superPetNftBalance = await superPetNft.balanceOf(deployer);
                  console.log("SPET balance:", superPetNftBalance.toString());

                  console.log("-------------------------------------------------------------");
              });
          });
      });
