const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

/*
  !!! Important !!!
  This test is prepared to run ONLY on development network like Hardhat, because of
  number of game played iterations. Please better do not run this test on any of
  test networks like Goerli.
  To run this test on development chain simply put exclamation mark in front of first
  code line below like this: '!developmentChains.includes(network.name)' and change
  test 'it' to 'it.only', to run only this test, without running also all unit tests
  from 'unit' folder.
*/
developmentChains.includes(network.name)
    ? describe.skip
    : describe("SnakeGame Staging Test: Play Snake Game 10x", function () {
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
              it("Gameplay simulation - 10x", async () => {
                  console.log("-------------------------------------------------------------");
                  console.log("              !!! Snake Game Gameplay - 10x !!!");
                  console.log("-------------------------------------------------------------");

                  // Test description:
                  // 1) Player buys SNAKE: +50 SNAKE
                  // 2) Player buys gameCredits: +10
                  // 3) Player plays the game 10x
                  // 4) Player claims FRUIT tokens: +1000 FRUIT
                  // 5) Player claims `Snake NFTs`: +10 SNFT
                  // 6) Player checks `Super Pet NFT` claim eligibility
                  // 7) Player claims `Super Pet NFT`
                  // 8) PLAYER'S GAME TOKENS BALANCES

                  console.log("-------------------------------------------------------------");

                  // 1) Player buys SNAKE: +40 SNAKE
                  console.log("1) Player buys SNAKE: +50 SNAKE");
                  // snakeToBuy = 40 SNAKE
                  let snakeToBuy = 40;
                  console.log("snakeToBuy:", snakeToBuy.toString());
                  // snakeEthRate = 0.01 * 1e18 = 1e16
                  let snakeEthRate = await snakeGame.SNAKE_ETH_RATE();
                  // ethPayment = 0.40 ETH
                  let ethPayment = snakeToBuy * snakeEthRate;
                  console.log("ethPayment:", (ethPayment / 1e18).toString());
                  // Buy SNAKE: +40 SNAKE
                  await snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() });
                  // SNAKE balance: 40 SNAKE
                  let snakeBalance = (await snakeToken.balanceOf(deployer)).toString();
                  console.log("snakeBalance:", snakeBalance.toString());
                  assert.equal(snakeBalance, 40);

                  console.log("-------------------------------------------------------------");

                  // 2) Player buys gameCredits: +10
                  console.log("2) Player buys gameCredits: +10");
                  // Approve `SnakeGame` to transfer 30 SNAKE tokens
                  await snakeToken.approve(snakeGame.address, snakeBalance);
                  // gameCredits += 10
                  await snakeGame.buyCredits(10);
                  // gameCredits += 10 = 10
                  let gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 10);
                  // SNAKE balance: 0 SNAKE
                  snakeBalance = await snakeToken.balanceOf(deployer);
                  console.log("SNAKE balance:", snakeBalance.toString());
                  assert.equal(snakeBalance.toString(), 0);
                  // Calculate Game Credit price
                  let superPetNftBalance = await superPetNft.balanceOf(deployer);
                  let gameCreditBasePrice = await snakeGame.GAME_CREDIT_BASE_PRICE();
                  console.log("gameCreditBasePrice:", gameCreditBasePrice.toString());
                  let gameCreditPrice = gameCreditBasePrice - superPetNftBalance;
                  console.log("gameCreditPrice:", gameCreditPrice.toString());

                  console.log("-------------------------------------------------------------");

                  // 3) Player plays the game 10x
                  console.log("3) Player plays the game 10x");
                  // Player plays the game 10x
                  let gameScore = 100;
                  let numberOfGames = 10;
                  for (let i = 1; i <= 10; i++) {
                      // console.log("Game nr:", i.toString());
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(gameScore);
                  }
                  // gameCredits -= 10 = 0
                  gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  console.log("gameCredits:", gameCredits.toString());
                  assert.equal(gameCredits.toString(), 0);
                  // fruitToClaim += gameScore * numberOfGames = 1000
                  let fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, gameScore * numberOfGames);
                  // gamesPlayed += numberOfGames = 10
                  let gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                  console.log("gamesPlayed:", gamesPlayed.toString());
                  assert.equal(gamesPlayed, 10);
                  // lastScore += gameScore * numberOfGames = 1000
                  let lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                  console.log("lastScore:", lastScore.toString());
                  assert.equal(lastScore, gameScore);
                  // bestScore = gameScore
                  let bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                  console.log("bestScore:", bestScore.toString());
                  assert.equal(bestScore, gameScore);
                  // snakeNftsToClaim += numberOfGames = 10
                  let snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim.toString();
                  console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  assert.equal(snakeNftsToClaim, 10);

                  console.log("-------------------------------------------------------------");

                  // 4) Player claims FRUIT tokens: +1000 FRUIT
                  console.log("4) Player claims FRUIT tokens: +1000 FRUIT");
                  // FRUIT tokens claim
                  await snakeGame.fruitClaim();
                  // FRUIT balance: 1000 FRUIT
                  let fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 1000);
                  // fruitsCollected = fruitToClaim = 1000
                  let fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                  console.log("fruitsCollected:", fruitsCollected.toString());
                  assert.equal(fruitsCollected, 1000);
                  // fruitToClaim == 0
                  fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  console.log("fruitToClaim:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, 0);

                  console.log("-------------------------------------------------------------");

                  // 5) Player claims `Snake NFTs`: +10 SNFT
                  console.log("5) Player claims `Snake NFTs`: +10 SNFT");
                  // fruitMintFee = 100
                  let fruitMintFee = await snakeGame.FRUIT_MINT_FEE();
                  console.log("fruitMintFee:", fruitMintFee.toString());
                  // Approve `SnakeGame` to transfer 1000 FRUIT tokens
                  await fruitToken.approve(snakeGame.address, 1000);
                  // Claim `Snake NFTs`: 10 x FOR loop
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  }
                  // `Snake NFT` balance = 10 SNFT
                  let snakeNftsBalance = await snakeNft.balanceOf(deployer);
                  console.log("snakeNftsBalance:", snakeNftsBalance.toString());
                  assert.equal(snakeNftsBalance.toString(), 10);
                  // FRUIT balance: 0 FRUIT
                  fruitBalance = await fruitToken.balanceOf(deployer);
                  console.log("FRUIT balance:", fruitBalance.toString());
                  assert.equal(fruitBalance.toString(), 0);
                  // snakeNftsAmount += 10 = 10
                  let snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount.toString();
                  console.log("snakeNftsAmount:", snakeNftsAmount.toString());
                  assert.equal(snakeNftsAmount, 10);

                  console.log("-------------------------------------------------------------");

                  // 6) Player checks `Super Pet NFT` claim eligibility
                  console.log("6) Player checks `Super Pet NFT` claim eligibility");
                  // Check `Super Pet NFT` claim eligibility
                  await snakeGame.checkSuperNftClaim();
                  // superNftClaimFlag = true
                  let superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  console.log("superNftClaimFlag:", superNftClaimFlag.toString());
                  assert.equal(superNftClaimFlag, true);

                  console.log("-------------------------------------------------------------");

                  // 7) Player claims `Super Pet NFT`
                  console.log("7) Player claims `Super Pet NFT`");
                  // ethMintFee = 0.1 ETH = 0.1 * e18 = 1e17
                  let ethMintFee = await snakeGame.ETH_MINT_FEE();
                  console.log("ethMintFee:", ethMintFee.toString());
                  // requiredSnakeNfts = 10
                  let requiredSnakeNfts = await snakeGame.SNAKE_NFTS_REQUIRED();
                  console.log("requiredSnakeNfts:", requiredSnakeNfts.toString());
                  // Approve `Snake NFTs` to burn as a `Super Pet NFT` mint fee
                  let burnTokenIds = [];
                  for (let i = 0; i < requiredSnakeNfts; i++) {
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
                  let superNftsAmount = (await snakeGame.getPlayerStats()).superNftsAmount.toString();
                  console.log("superNftsAmount:", superNftsAmount.toString());
                  assert.equal(superNftsAmount, 1);
                  // `Snake NFT` balance: 0 SNFT
                  let snakeNftBalance = await snakeNft.balanceOf(deployer);
                  console.log("Snake NFT` balance:", snakeNftBalance.toString());
                  assert.equal(snakeNftBalance.toString(), 0);
                  // `Super Pet NFT` balance: 1 SNFT
                  superPetNftBalance = await superPetNft.balanceOf(deployer);
                  console.log("Super Pet NFT balance`:", superPetNftBalance.toString());
                  assert.equal(superPetNftBalance.toString(), 1);

                  console.log("-------------------------------------------------------------");

                  // 8) PLAYER'S GAME TOKENS BALANCES
                  console.log("8) PLAYER'S GAME TOKENS BALANCES");
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
