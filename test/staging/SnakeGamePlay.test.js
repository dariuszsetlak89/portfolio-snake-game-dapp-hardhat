const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SnakeGame Staging Tests", function () {
          beforeEach(async () => {
              // Deploy smart contracts
              await deployments.fixture(["SnakeGame"]);
              // Get accounts: deployer, player
              deployer = (await getNamedAccounts()).deployer;
              player1 = (await getNamedAccounts()).player1;
              // Get contract: SnakeGame
              snakeGame = await ethers.getContract("SnakeGame", deployer);
              // Get contract: SnakeToken
              snakeTokenAddress = await snakeGame.s_snakeToken();
              snakeToken = await ethers.getContractAt("Token", snakeTokenAddress);
              // Get contract: FruitToken
              fruitTokenAddress = await snakeGame.s_fruitToken();
              fruitToken = await ethers.getContractAt("Token", fruitTokenAddress);
              // Get contract: SnakeNft
              snakeNftAddress = await snakeGame.s_snakeNft();
              snakeNft = await ethers.getContractAt("Nft", snakeNftAddress);
              // Get contract: SuperPetNft
              superPetNftAddress = await snakeGame.s_superPetNft();
              superPetNft = await ethers.getContractAt("Nft", superPetNftAddress);
          });

          describe("Play Snake Game", async () => {
              it.only("Gameplay simulation of new Player", async () => {
                  console.log("-------------------------------------------------------------");
                  console.log("               !!! Snake Game Gameplay !!!");
                  console.log("-------------------------------------------------------------");

                  // 1) Player gets SNAKE airdrop: +10 SNAKE
                  console.log("1) Player get SNAKE airdrop: +10 SNAKE");
                  await snakeGame.snakeAirdrop();
                  // SNAKE balance: 10 SNAKE
                  let snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 10);

                  console.log("-------------------------------------------------------------");

                  // 2) Player buys gameCredits: gameCredits += 2
                  console.log("2) Player buys gameCredits:  gameCredits += 2");
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
                  assert.equal(snakeBalance.toString(), 0);

                  console.log("-------------------------------------------------------------");

                  // 3) Player plays the game first time: game1
                  console.log("3) Player plays the game first time: game1");
                  //
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
                  //
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

                  // 5) Player swap FRUIT to SNAKE: 100 FRUIT => 5 SNAKE
                  console.log("5) Player swap FRUIT to SNAKE: 100 FRUIT => 5 SNAKE");
                  // Approve `SnakeGame` to transfer 100 FRUIT tokens
                  await fruitToken.approve(snakeGame.address, fruitBalance);
                  // fruitToSnakeRate = 20
                  const fruitToSnakeRate = snakeGame.FRUIT_SNAKE_RATE();
                  console.log("fruitToSnakeRate:", fruitToSnakeRate.toString());
                  // Swap FRUIT to SNAKE: 100 FRUIT => 5 SNAKE
                  await snakeGame.fruitToSnakeSwap(fruitBalance);
                  // FRUIT balance: 0 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 0);
                  // SNAKE balance: 5 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 5);

                  console.log("-------------------------------------------------------------");

                  // 6) Player buys gameCredits: gameCredits += 1 = 2
                  console.log("6) Player buys gameCredits: gameCredits += 1 = 2");
                  // Approve `SnakeGame` to transfer 5 SNAKE tokens
                  await snakeToken.approve(snakeGame.address, snakeBalance);
                  // gameCredits += 1
                  await snakeGame.buyCredits(1);
                  // gameCredits += 1 = 2
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 2);
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 0);

                  console.log("-------------------------------------------------------------");

                  // 7) Player buys SNAKE: +40 SNAKE
                  console.log("7) Player buys SNAKE: +40 SNAKE");
                  // snakeToBuy = 40 SNAKE
                  const snakeToBuy = 40;
                  console.log("snakeToBuy:", snakeToBuy.toString());
                  // snakeEthRate = 0.01 * 1e18 = 1e16
                  const snakeEthRate = await snakeGame.SNAKE_ETH_RATE();
                  console.log("snakeEthRate:", snakeEthRate.toString());
                  // ethPayment = 0.40 ETH
                  const ethPayment = snakeToBuy * snakeEthRate;
                  console.log("ethPayment:", (ethPayment / 1e18).toString());
                  // Buy SNAKE: +40 SNAKE
                  await snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() });
                  // SNAKE balance: 40 SNAKE
                  snakeBalance = (await snakeToken.balanceOf(deployer)).toString();
                  console.log("snakeBalance:", snakeBalance.toString());
                  assert.equal(snakeBalance, 40);

                  console.log("-------------------------------------------------------------");

                  // 8) Player buys gameCredits: gameCredits += 8 = 10
                  console.log("8) Player buys gameCredits: gameCredits += 8 = 10");
                  // Approve `SnakeGame` to transfer 40 SNAKE tokens
                  await snakeToken.approve(snakeGame.address, snakeBalance);
                  // gameCredits += 8
                  await snakeGame.buyCredits(8);
                  // gameCredits += 8 = 10
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 10);
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 0);

                  console.log("-------------------------------------------------------------");

                  // 9) Player plays the game 10x: game2 to game11
                  console.log("9) Player plays the game 10x: game2 to game11");
                  // Player plays the game 10x
                  gameScore = 100;
                  numberOfGames = 10;
                  for (let i = 2; i <= 11; i++) {
                      // console.log("Game nr:", i.toString());
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(gameScore);
                  }
                  // gameCredits -= 10 = 0
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 0);
                  // fruitToClaim += gameScore * numberOfGames = 1000
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, gameScore * numberOfGames);
                  // gamesPlayed += numberOfGames = 11
                  gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                  console.log("gamesPlayed:", gamesPlayed.toString());
                  assert.equal(gamesPlayed, 11);
                  // lastScore += gameScore * numberOfGames = 1000
                  lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                  console.log("lastScore:", lastScore.toString());
                  assert.equal(lastScore, gameScore);
                  // bestScore += gameScore
                  bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                  console.log("bestScore:", bestScore.toString());
                  assert.equal(bestScore, gameScore);
                  // snakeNftsToClaim += numberOfGames = 11
                  snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim.toString();
                  console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  assert.equal(snakeNftsToClaim, 11);

                  console.log("-------------------------------------------------------------");

                  // 10) Player claims FRUIT tokens: +1000 FRUIT
                  console.log("10) Player claims FRUIT tokens: +1000 FRUIT");
                  // FRUIT tokens claim
                  await snakeGame.fruitClaim();
                  // FRUIT balance: 1000 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 1000);
                  // fruitsCollected += fruitToClaim = 100 + 1000 = 1100
                  fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                  console.log("fruitsCollected:", fruitsCollected.toString());
                  assert.equal(fruitsCollected, 1100);
                  // fruitToClaim == 0
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, 0);

                  console.log("-------------------------------------------------------------");

                  // 11) Player claims `Snake NFTs`: +10 SNFT
                  console.log("11) Player claims `Snake NFTs`: +10 SNFT");
                  // fruitMintFee = 100
                  let fruitMintFee = await snakeGame.FRUIT_MINT_FEE();
                  console.log("fruitMintFee:", fruitMintFee.toString());
                  // Approve `SnakeGame` to transfer 1000 FRUIT tokens
                  await fruitToken.approve(snakeGame.address, 1000);
                  // Claim `Snake NFTs`: 10 x FOR loop inside function
                  let snakeNftsAmount = 10;
                  await snakeGame.snakeNftClaim(snakeNftsAmount); // `Snake NFT` claim
                  // `Snake NFT` balance = 10 SNFT
                  let snakeNftsBalance = await snakeNft.balanceOf(deployer);
                  console.log("snakeNftsBalance:", snakeNftsBalance.toString());
                  assert.equal(snakeNftsBalance.toString(), 10);
                  // FRUIT balance: 0 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 0);
                  // snakeNftsAmount += 10 = 10
                  snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount.toString();
                  console.log("snakeNftsAmount:", snakeNftsAmount.toString());
                  assert.equal(snakeNftsAmount, 10);

                  console.log("-------------------------------------------------------------");

                  // 12) Player checks `Super Pet NFT` claim eligibility
                  console.log("12) Player checks `Super Pet NFT` claim eligibility");
                  // Check `Super Pet NFT` claim eligibility
                  await snakeGame.checkSuperNftClaim();
                  // superNftClaimFlag = true
                  let superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  console.log("superNftClaimFlag:", superNftClaimFlag.toString());
                  assert.equal(superNftClaimFlag, true);

                  console.log("-------------------------------------------------------------");

                  // 13) Player claims `Super Pet NFT`
                  console.log("13) Player claims `Super Pet NFT`");
                  // ethMintFee = 0.1 ETH = 0.1 * e18 = 1e17
                  let ethMintFee = await snakeGame.ETH_MINT_FEE();
                  console.log("ethMintFee:", ethMintFee.toString());
                  // requiredSnakeNfts = 10
                  let requiredSnakeNfts = await snakeGame.SNAKE_NFTS_REQUIRED();
                  console.log("requiredSnakeNfts:", requiredSnakeNfts.toString());
                  // Approve `Snake NFTs` to burn as a `Super Pet NFT` mint fee
                  let burnTokenIds = [];
                  for (let i = 0; i < 10; i++) {
                      burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                      await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                  }
                  // Claim `Super Pet NFT`
                  await snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1") });
                  // superNftClaimFlag = false
                  superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  console.log("superNftClaimFlag:", superNftClaimFlag.toString());
                  assert.equal(superNftClaimFlag, false);
                  // snakeNftsAmount += 1 = 1
                  superNftsAmount = (await snakeGame.getPlayerStats()).superNftsAmount.toString();
                  console.log("superNftsAmount:", superNftsAmount.toString());
                  assert.equal(superNftsAmount, 1);
                  // `Snake NFT` balance: 0 SNFT
                  let snakeNftBalance = await snakeNft.balanceOf(deployer);
                  console.log("Snake NFT` balance:", snakeNftBalance.toString());
                  assert.equal(snakeNftBalance.toString(), 0);
                  // `Super Pet NFT` balance: 1 SNFT
                  let superPetNftBalance = await superPetNft.balanceOf(deployer);
                  console.log("Super Pet NFT balance`:", superPetNftBalance.toString());
                  assert.equal(superPetNftBalance.toString(), 1);

                  console.log("-------------------------------------------------------------");

                  // 14) FINAL PLAYER'S GAME BALANCES
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
