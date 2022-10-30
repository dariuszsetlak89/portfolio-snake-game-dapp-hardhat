const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("SnakeGame Staging Test: Play Snake Game 1x", function () {
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
              await deployments.fixture(["SnakeGame"]);
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
              it("Snake Game gameplay simulation - 1x", async () => {
                  console.log("-------------------------------------------------------------");
                  console.log("              !!! Snake Game Gameplay - 1x !!!");
                  console.log("-------------------------------------------------------------");

                  // Test description:
                  // 1) Player gets SNAKE airdrop: +10 SNAKE
                  // 2) Player buys gameCredits: +1
                  // 3) Player plays the game first time: game1
                  // 4) Player claims FRUIT tokens: +100 FRUIT
                  // 5) Player claims `Snake NFT`: +1 SNFT
                  // 6) Player checks `Super Pet NFT` claim eligibility
                  // 7) Player try to claim `Super Pet NFT` - transaction should revert
                  // 8) FINAL PLAYER'S GAME TOKENS BALANCES

                  // -------------------------------------------------------------------------

                  // 1) Player gets SNAKE airdrop: +10 SNAKE
                  console.log("1) Player get SNAKE airdrop: +10 SNAKE");
                  await snakeGame.snakeAirdrop();
                  // SNAKE balance: 10 SNAKE
                  let snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 10);

                  console.log("-------------------------------------------------------------");

                  // 2) Player buys gameCredits: gameCredits += 1
                  console.log("2) Player buys gameCredits:  gameCredits += 1");
                  let snakeBalanceBeforeBuy = await snakeToken.balanceOf(deployer);
                  console.log("snakeBalanceBeforeBuy:", snakeBalanceBeforeBuy.toString());
                  // Approve `SnakeGame` to transfer 5 SNAKE tokens
                  await snakeToken.approve(snakeGame.address, snakeBalance);
                  // gameCredits += 1
                  await snakeGame.buyCredits(1);
                  // gameCredits = 1
                  let gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 1);
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 6);
                  // Calculate Game Credit price
                  let superPetNftBalance = await superPetNft.balanceOf(deployer);
                  let gameCreditBasePrice = await snakeGame.GAME_CREDIT_BASE_PRICE();
                  console.log("gameCreditBasePrice:", gameCreditBasePrice.toString());
                  let gameCreditPrice = gameCreditBasePrice - superPetNftBalance;
                  console.log("gameCreditPrice:", gameCreditPrice.toString());

                  console.log("-------------------------------------------------------------");

                  // 3) Player plays the game first time: game1
                  console.log("3) Player plays the game first time: game1");
                  // Game start: game nr1
                  console.log("GameStart game nr: 1");
                  await snakeGame.gameStart();
                  // gameCredits -= 1
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 0);
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
                  // bestScore += gameScore
                  let bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                  console.log("bestScore:", bestScore.toString());
                  assert.equal(bestScore, gameScore);
                  // snakeNftsToClaim += 1
                  let snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim.toString();
                  console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  assert.equal(snakeNftsToClaim, 1);

                  console.log("-------------------------------------------------------------");

                  // 4) Player claims FRUIT tokens: +100 FRUIT
                  console.log("4) Player claims FRUIT tokens: +100 FRUIT");
                  // FRUIT tokens claim
                  await snakeGame.fruitClaim();
                  // FRUIT balance: 100 FRUIT
                  let fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 100);
                  // fruitsCollected += fruitToClaim = 100
                  let fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                  console.log("fruitsCollected:", fruitsCollected.toString());
                  assert.equal(fruitsCollected, fruitToClaim);
                  // fruitToClaim == 0
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, 0);

                  console.log("-------------------------------------------------------------");

                  // 5) Player claims `Snake NFT`: +1 SNFT
                  console.log("5) Player claims `Snake NFTs`: +1 SNFT");
                  // fruitMintFee = 100
                  let fruitMintFee = await snakeGame.FRUIT_MINT_FEE();
                  console.log("fruitMintFee:", fruitMintFee.toString());
                  // Approve `SnakeGame` to transfer 100 FRUIT tokens
                  await fruitToken.approve(snakeGame.address, 100);
                  // Claim `Snake NFTs`: 1 SNFT
                  await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  // `Snake NFT` balance = 1 SNFT
                  let snakeNftsBalance = await snakeNft.balanceOf(deployer);
                  console.log("snakeNftsBalance:", snakeNftsBalance.toString());
                  assert.equal(snakeNftsBalance.toString(), 1);
                  // FRUIT balance: 0 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 0);
                  // snakeNftsAmount += 1 = 1
                  snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount.toString();
                  console.log("snakeNftsAmount:", snakeNftsAmount.toString());
                  assert.equal(snakeNftsAmount, 1);

                  console.log("-------------------------------------------------------------");

                  // 6) Player checks `Super Pet NFT` claim eligibility
                  console.log("6) Player checks `Super Pet NFT` claim eligibility");
                  // Check `Super Pet NFT` claim eligibility
                  await snakeGame.checkSuperNftClaim();
                  // superNftClaimFlag = false
                  let superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  console.log("superNftClaimFlag:", superNftClaimFlag.toString());
                  assert.equal(superNftClaimFlag, false);

                  console.log("-------------------------------------------------------------");

                  // 7) Player try to claim `Super Pet NFT` - transaction should revert
                  console.log("7) Player try to claim `Super Pet NFT` - transaction should revert");
                  await expect(snakeGame.superPetNftClaim()).to.be.revertedWith("SnakeGame__NoSuperNftToClaim");
                  superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  console.log("`Super Pet NFT` claim attempt failed - transaction reverted!");
                  console.log(`Reason: superNftClaimFlag = ${superNftClaimFlag.toString()}`);
                  assert.equal(superNftClaimFlag, false);

                  console.log("-------------------------------------------------------------");

                  // 14) FINAL PLAYER'S GAME TOKENS BALANCES
                  console.log("14) FINAL PLAYER'S GAME TOKENS BALANCES");
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  // FRUIT balance: 0 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  // Snake NFT balance: 0 SNFT
                  snakeNftBalance = await snakeNft.balanceOf(deployer);
                  console.log("SNFT` balance:", snakeNftBalance.toString());
                  // Supet Pet NFT balance: 1 SNFT
                  superPetNftBalance = await superPetNft.balanceOf(deployer);
                  console.log("SPET` balance:", superPetNftBalance.toString());

                  console.log("-------------------------------------------------------------");
              });
          });
      });
