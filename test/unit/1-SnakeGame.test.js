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

          describe("constructor", async () => {
              it("creates `SnakeToken` contract instance properly", async () => {
                  const snakeTokenAddress = await snakeGame.i_snakeToken();
                  const snakeTokenName = await snakeToken.name();
                  const snakeTokenSymbol = await snakeToken.symbol();
                  assert.equal(snakeToken.address, snakeTokenAddress);
                  assert.equal(snakeTokenName, "Snake Token");
                  assert.equal(snakeTokenSymbol, "SNAKE");
              });
              it("creates `FruitToken` contract instance properly", async () => {
                  const fruitTokenAddress = await snakeGame.i_fruitToken();
                  const fruitTokenName = await fruitToken.name();
                  const fruitTokenSymbol = await fruitToken.symbol();
                  assert.equal(fruitTokenAddress, fruitToken.address);
                  assert.equal(fruitTokenName, "Fruit Token");
                  assert.equal(fruitTokenSymbol, "FRUIT");
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
          });

          describe("gameStart", async () => {
              it("reverts when Player doesn't have any gameCredits", async () => {
                  await expect(snakeGame.gameStart()).to.be.revertedWith("SnakeGame__NoGameCredits");
              });
              it("decrements parameter `gameCredits` by one", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  const gameCredits = (await snakeGame.getPlayerData()).gameCredits.toString();
                  assert.equal(gameCredits, 1);
              });
              it("sets parameter `gameStartedFlag` to value `true`", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  const gameStartedFlag = (await snakeGame.getPlayerData()).gameStartedFlag;
                  assert.equal(gameStartedFlag, true);
              });
              it("emits event when game starts", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await expect(snakeGame.gameStart()).to.emit(snakeGame, "GameStarted").withArgs(deployer);
              });
          });

          describe("gameOver", async () => {
              it("reverts when Player didn't start the game", async () => {
                  const gameScore = 100;
                  await expect(snakeGame.gameOver(gameScore)).to.be.revertedWith("SnakeGame__GameNotStarted");
              });
              it("adds score to parameter `fruitToClaim`", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  const fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                  assert.equal(fruitToClaim, gameScore);
              });
              it("sets parameter `gameStartedFlag` to value `false`", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  const gameStartedFlag = (await snakeGame.getPlayerData()).gameStartedFlag;
                  assert.equal(gameStartedFlag, false);
              });
              it("increments parameter `gamesPlayed`", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  const gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                  assert.equal(gamesPlayed, 1);
              });
              it("sets parameter `lastScore` to given parameter `score` value", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  const lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                  assert.equal(lastScore, gameScore);
              });
              it("sets parameter `bestScore` to given parameter `score` value if condition passes", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  // const bestScoreBeforeGameOver = (await snakeGame.getPlayerStats()).bestScore.toString();
                  // console.log("bestScore before gameOver:", bestScoreBeforeGameOver);
                  const gameScore = 100;
                  await snakeGame.gameOver(gameScore);
                  const bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                  // console.log("bestScore after gameOver:", bestScore);
                  assert.equal(bestScore, gameScore);
              });
              it("emits event when game overs", async () => {
                  await snakeGame.snakeAirdrop();
                  await snakeToken.approve(snakeGame.address, 1000);
                  await snakeGame.buyCredits(2);
                  await snakeGame.gameStart();
                  const gameScore = 100;
                  await expect(snakeGame.gameOver(gameScore)).to.emit(snakeGame, "GameOver").withArgs(deployer);
              });
              it("increments parameter `snakeNftsToClaim` by one", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // Bought SNAKE: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // Game credits bought: 1
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score); // Game score: 100
                  // const snakeNftsToClaimBeforeCheck = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  // console.log("snakeNftsToClaimBeforeCheck:", snakeNftsToClaimBeforeCheck.toString());
                  const snakeNftsToClaimAfterCheck = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  // console.log("snakeNftsToClaimAfterCheck:", snakeNftsToClaimAfterCheck.toString());
                  assert.equal(snakeNftsToClaimAfterCheck.toString(), 1);
              });
              it("emits event after parameter `snakeNftsToClaim` incrementation`", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // Bought SNAKE: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // Game credits bought: 1
                  await snakeGame.gameStart();
                  const score = 100;
                  // const snakeNftsToClaimBeforeCheck = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  // console.log("snakeNftsToClaimBeforeCheck:", snakeNftsToClaimBeforeCheck.toString());
                  await expect(snakeGame.gameOver(score)).to.emit(snakeGame, "SnakeNftUnlocked").withArgs(deployer);
                  // const snakeNftsToClaimAfterCheck = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  // console.log("snakeNftsToClaimAfterCheck:", snakeNftsToClaimAfterCheck.toString());
              });
              it("emits event when maximum number of `Snake NFTs` already claimed", async () => {
                  const maxSnakeNfts = await snakeGame.MAX_SNAKE_NFTS();
                  // console.log("maxSnakeNfts:", maxSnakeNfts.toString());
                  // Play `maxSnakeNfts` times `Snake Game`
                  for (let i = 0; i < maxSnakeNfts; i++) {
                      await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // Bought SNAKE: 4
                      await snakeToken.approve(snakeGame.address, 4);
                      await snakeGame.buyCredits(1); // Game credits bought: 1
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // Game score: 100
                  }
                  const snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  const fruitMintFee = await snakeGame.FRUIT_MINT_FEE();
                  // console.log("snakeNftsToClaim:", snakeNftsToClaim.toString());
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, snakeNftsToClaim * fruitMintFee);
                  // `Snake NFT` claim: maxSnakeNfts
                  for (let i = 0; i < maxSnakeNfts; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  // const snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount;
                  // console.log("snakeNftsAmount:", snakeNftsAmount.toString());
                  //
                  // Play `Snake Game` one more time
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // Bought SNAKE: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // Game credits bought: 1
                  await snakeGame.gameStart();
                  const score = 100;
                  await expect(snakeGame.gameOver(score)).to.emit(snakeGame, "MaxSnakeNftsClaimed").withArgs(deployer);
                  // const snakeNftsToClaimAfter = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  // console.log("snakeNftsToClaimAfter:", snakeNftsToClaimAfter.toString()); // No more `Snake NFTs` to claim
              });
          });

          describe("snakeAirdrop", async () => {
              it("reverts when Player received airdrop earlier", async () => {
                  await snakeGame.snakeAirdrop();
                  await expect(snakeGame.snakeAirdrop()).to.be.revertedWith("SnakeGame__SnakeAirdopAlreadyClaimed");
              });
              it("sets parameter `snakeAirdropFlag` to value `true`", async () => {
                  await snakeGame.snakeAirdrop();
                  const gameStartedFlag = (await snakeGame.getPlayerData()).snakeAirdropFlag;
                  assert.equal(gameStartedFlag, true);
              });
              it("mint SNAKE airdrop tokens to Player's account", async () => {
                  await snakeGame.snakeAirdrop();
                  const snakeBalance = (await snakeToken.balanceOf(deployer)).toString();
                  assert.equal(snakeBalance, 10);
              });
              it("emits event after airdrop receive", async () => {
                  await expect(snakeGame.snakeAirdrop()).to.emit(snakeGame, "SnakeAirdropReceived").withArgs(deployer, 10);
              });
          });

          describe("buySnake", async () => {
              it("reverts when Player doesn't sent enough ETH with transaction call", async () => {
                  const snakeToBuy = 10;
                  // const snakeEthRate = await snakeGame.SNAKE_ETH_RATE();
                  // const expectedEthPayment = snakeToBuy * snakeEthRate;
                  // console.log("expectedEthPayment:", (expectedEthPayment / 1e18).toString());
                  const ethPayment = ethers.utils.parseEther("0.03"); // 0.03 ETH
                  // console.log("ethPayment:", (ethPayment / 1e18).toString());
                  await expect(snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() })).to.be.revertedWith(
                      "SnakeGame__NotEnoughEthSent"
                  );
              });
              it("mint bought SNAKE tokens to Player's account", async () => {
                  const snakeToBuy = 10;
                  const snakeEthRate = await snakeGame.SNAKE_ETH_RATE();
                  const ethPayment = snakeToBuy * snakeEthRate;
                  // console.log("ethPayment:", (ethPayment / 1e18).toString());
                  await snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() });
                  const snakeBalance = (await snakeToken.balanceOf(deployer)).toString();
                  assert.equal(snakeBalance, 10);
              });
              it("emits event after SNAKE tokens purchase", async () => {
                  const snakeToBuy = 10;
                  const snakeEthRate = await snakeGame.SNAKE_ETH_RATE();
                  const ethPayment = snakeToBuy * snakeEthRate;
                  // console.log("ethPayment:", (ethPayment / 1e18).toString());
                  await expect(snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() }))
                      .to.emit(snakeGame, "SnakeTokensBought")
                      .withArgs(deployer, snakeToBuy);
              });
          });

          describe("buyCredits", async () => {
              it("reverts when Player's SNAKE balance is less than purchase amount", async () => {
                  creditsAmount = 1; // SNAKE balance = 0
                  await expect(snakeGame.buyCredits(creditsAmount)).to.be.revertedWith("SnakeGame__SnakeTokensBalanceTooLow");
              });
              it("transfers sold SNAKE tokens from Player's account to smart contract account", async () => {
                  creditsAmount = 1;
                  await snakeGame.buySnake(8, { value: ethers.utils.parseEther("0.08") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(creditsAmount);
                  const deployerSnakeBalance = await snakeToken.balanceOf(deployer);
                  const contractSnakeBalance = await snakeToken.balanceOf(snakeGame.address);
                  assert.equal(deployerSnakeBalance.toString(), 4);
                  assert.equal(contractSnakeBalance.toString(), 0); // Tokens burned after transfer
              });
              it("reverts when SNAKE tokens transfer failed", async () => {
                  creditsAmount = 1;
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 2); // Approve less than required
                  await expect(snakeGame.buyCredits(creditsAmount)).to.be.revertedWith("ERC20: insufficient allowance");
              });
              it("burns SNAKE tokens transfered to smart contract account", async () => {
                  creditsAmount = 1;
                  await snakeGame.buySnake(10, { value: ethers.utils.parseEther("0.1") });
                  await snakeToken.approve(snakeGame.address, 10);
                  await snakeGame.buyCredits(creditsAmount);
                  const contractSnakeBalance = await snakeToken.balanceOf(snakeGame.address);
                  expect(contractSnakeBalance).to.equal(0);
              });
              it("increments parameter `gameCredits` by number of bought game credits", async () => {
                  creditsAmount = 1;
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(creditsAmount);
                  const gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                  // expect(gameCredits).to.equal(creditsAmount);
                  assert.equal(gameCredits, creditsAmount);
              });
              it("emits event after game credits purchase", async () => {
                  creditsAmount = 1;
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await expect(snakeGame.buyCredits(creditsAmount)).to.emit(snakeGame, "CreditsBought").withArgs(deployer, creditsAmount);
              });
          });

          describe("fruitClaim", async () => {
              it("reverts when Player doesn't have any FRUIT tokens to claim", async () => {
                  await expect(snakeGame.fruitClaim()).to.be.revertedWith("SnakeGame__NoFruitTokensToClaim");
              });
              it("reset parameter `fruitToClaim` to value 0", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100);
                  // const fruitToClaimBefore = (await snakeGame.getPlayerData()).fruitToClaim;
                  // console.log("fruitToClaimBefore:", fruitToClaimBefore.toString());
                  await snakeGame.fruitClaim();
                  const fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim;
                  // console.log("fruitToClaimAfter:", fruitToClaim.toString());
                  assert.equal(fruitToClaim, 0);
              });
              it("mint claimed FRUIT tokens to Player's account", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score);
                  await snakeGame.fruitClaim();
                  const fruitBalance = await fruitToken.balanceOf(deployer);
                  // console.log("fruitBalance:", fruitBalance.toString());
                  assert.equal(fruitBalance, score);
              });
              it("adds score to parameter `fruitsCollected`", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score);
                  await snakeGame.fruitClaim();
                  const fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                  // console.log("fruitsCollected:", fruitsCollected);
                  assert.equal(fruitsCollected, score);
              });
              it("emits event after FRUIT tokens collect", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score);
                  await expect(snakeGame.fruitClaim()).to.emit(snakeGame, "FruitTokensCollected").withArgs(deployer, score);
              });
          });

          describe("fruitToSnakeSwap", async () => {
              it("reverts when Player's FRUIT tokens balance is less than given swap amount", async () => {
                  const fruitAmountToSwap = 1;
                  await expect(snakeGame.fruitToSnakeSwap(fruitAmountToSwap)).to.be.revertedWith("SnakeGame__FruitTokensBalanceTooLow");
              });
              it("reverts when given FRUIT amount to swap is not a multiple of `FRUIT_SNAKE_RATE`", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score);
                  await snakeGame.fruitClaim();
                  const fruitAmountToSwap = 33; // Incorrect amount of FRUIT to swap, fruitAmountToSwap % FRUIT_SNAKE_RATE != 0
                  await fruitToken.approve(snakeGame.address, fruitAmountToSwap);
                  await expect(snakeGame.fruitToSnakeSwap(fruitAmountToSwap)).to.be.revertedWith("SnakeGame__FruitAmountIncorrect");
              });
              it("transfers swapped FRUIT tokens to smart contract account", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score);
                  await snakeGame.fruitClaim();
                  const fruitAmountToSwap = 20;
                  await fruitToken.approve(snakeGame.address, fruitAmountToSwap);
                  await snakeGame.fruitToSnakeSwap(fruitAmountToSwap);
                  const deployerFruitBalance = await fruitToken.balanceOf(deployer);
                  const contractFruitBalance = await fruitToken.balanceOf(snakeGame.address);
                  // console.log("JS: deployerFruitBalance:", deployerFruitBalance.toString());
                  // console.log("JS: contractFruitBalance:", contractFruitBalance.toString());
                  assert.equal(deployerFruitBalance.toString(), 80);
                  assert.equal(contractFruitBalance.toString(), 0); // Tokens burned after transfer
              });
              it("mint claimed FRUIT tokens to Player's account", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score);
                  await snakeGame.fruitClaim();
                  // const snakeBalanceBeforeSwap = await snakeToken.balanceOf(deployer);
                  // console.log("snakeBalanceBeforeSwap:", snakeBalanceBeforeSwap.toString());
                  const fruitAmountToSwap = 20;
                  await fruitToken.approve(snakeGame.address, fruitAmountToSwap);
                  await snakeGame.fruitToSnakeSwap(fruitAmountToSwap);
                  const snakeBalance = await snakeToken.balanceOf(deployer);
                  // console.log("snakeBalance:", snakeBalance.toString());
                  assert.equal(snakeBalance, 1);
              });
              it("burns FRUIT tokens transfered to smart contract account", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1);
                  await snakeGame.gameStart();
                  const score = 100;
                  await snakeGame.gameOver(score);
                  await snakeGame.fruitClaim();
                  const fruitAmountToSwap = 20;
                  await fruitToken.approve(snakeGame.address, fruitAmountToSwap);
                  await snakeGame.fruitToSnakeSwap(fruitAmountToSwap);
                  const contractFruitBalance = await snakeToken.balanceOf(snakeGame.address);
                  expect(contractFruitBalance).to.equal(0);
              });
              it("emits event after FRUIT => SNAKE tokens swap succeed", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") });
                  await snakeToken.approve(snakeGame.address, 4); // SNAKE bought: 5
                  await snakeGame.buyCredits(1); // game credits bought: 1
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game score: 100
                  await snakeGame.fruitClaim();
                  const fruitAmountToSwap = 20;
                  await fruitToken.approve(snakeGame.address, fruitAmountToSwap);
                  const receivedSnakeAmount = fruitAmountToSwap / (await snakeGame.FRUIT_SNAKE_RATE());
                  // console.log("receivedSnakeAmount:", receivedSnakeAmount);
                  await expect(snakeGame.fruitToSnakeSwap(fruitAmountToSwap))
                      .to.emit(snakeGame, "FruitsToSnakeSwapped")
                      .withArgs(deployer, fruitAmountToSwap, receivedSnakeAmount);
              });
          });

          describe("snakeNftClaim", async () => {
              it("reverts when Player doesn't have `Snake NFT` to claim", async () => {
                  await expect(snakeGame.snakeNftClaim()).to.be.revertedWith("SnakeGame__NoSnakeNftsToClaim");
              });
              it("reverts when Player doesn't have enough FRUIT tokens to pay mint fee", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // SNAKE bought: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // game credits bought: 1
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game score: 100, `Snake NFT` unlocked
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 20);
                  await snakeGame.fruitToSnakeSwap(20); // swapped 20 FRUIT to 1 SNAKE
                  // const fruitTokenBalance = await fruitToken.balanceOf(deployer);
                  // console.log("fruitTokenBalance:", fruitTokenBalance.toString());
                  await expect(snakeGame.snakeNftClaim()).to.be.revertedWith("SnakeGame__FruitTokensBalanceTooLow");
              });
              it("transfers FRUIT tokens mint fee to smart contract account", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // SNAKE bought: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // game credits bought: 1
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game score: 100, `Snake NFT` unlocked
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 100);
                  await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  const deployerFruitBalance = await fruitToken.balanceOf(deployer);
                  const contractFruitBalance = await fruitToken.balanceOf(snakeGame.address);
                  // console.log("deployerFruitBalance:", deployerFruitBalance.toString());
                  // console.log("contractFruitBalance:", contractFruitBalance.toString());
                  assert.equal(deployerFruitBalance.toString(), 0);
                  assert.equal(contractFruitBalance.toString(), 0); // Tokens burned after transfer
              });
              it("decrements parameter `snakeNftsToClaim` by number of claimed `Snake NFTs`", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // SNAKE bought: 4
                  await snakeToken.approve(snakeGame.address, 10);
                  await snakeGame.buyCredits(1); // game credits bought: 1
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game score: 100, 1x `Snake NFT` unlocked
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 100);
                  // const snakeNftsToClaimBeforeClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  // console.log("snakeNftsToClaimBeforeClaim:", snakeNftsToClaimBeforeClaim.toString());
                  await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  const snakeNftsToClaimAfterClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                  // console.log("snakeNftsToClaimAfterClaim:", snakeNftsToClaimAfterClaim.toString());
                  assert.equal(snakeNftsToClaimAfterClaim.toString(), 0);
              });
              it("mint unlocked `Snake NFTs` to Player's account", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // SNAKE bought: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // game credits bought: 1
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 100);
                  await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  const snakeNftsBalance = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftsBalance:", snakeNftsBalance.toString());
                  assert.equal(snakeNftsBalance.toString(), 1);
              });
              it("increments parameter `snakeNftsAmount` by number of claimed `Snake NFTs`", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // SNAKE bought: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // game credits bought: 1
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 100);
                  await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  const snakeNftsClaimedAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount;
                  // console.log("snakeNftsClaimedAmount:", snakeNftsClaimedAmount.toString());
                  assert.equal(snakeNftsClaimedAmount, 1);
              });
              it("burns FRUIT tokens mint fee transfered to smart contract account", async () => {
                  await snakeGame.buySnake(4, { value: ethers.utils.parseEther("0.04") }); // SNAKE bought: 4
                  await snakeToken.approve(snakeGame.address, 4);
                  await snakeGame.buyCredits(1); // game credits bought: 1
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 100);
                  await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  const contractFruitBalance = await snakeToken.balanceOf(snakeGame.address);
                  // expect(contractFruitBalance).to.equal(0);
                  assert.equal(contractFruitBalance.toString(), 0);
              });
              it("emits event after `Snake NFTs` claim succeed", async () => {
                  await snakeGame.buySnake(15, { value: ethers.utils.parseEther("0.15") }); // SNAKE bought: 15
                  await snakeToken.approve(snakeGame.address, 15);
                  await snakeGame.buyCredits(3); // game credits bought: 3
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game2 score: 100, 1x `Snake NFT` unlocked
                  await snakeGame.gameStart();
                  await snakeGame.gameOver(100); // game3 score: 100, 1x `Snake NFT` unlocked
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 300);
                  const snakeNftsAmount = 3;
                  await expect(snakeGame.snakeNftClaim()).to.emit(snakeGame, "SnakeNftsClaimed").withArgs(deployer);
                  // const snakeNftsBalance = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftsBalance:", snakeNftsBalance.toString());
              });
          });

          describe("checkSuperNftClaim", async () => {
              it("sets parameter `superNftClaimFlag` to value `true` if all conditions met", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  // Conditions
                  const superNftsAmount = (await snakeGame.getPlayerStats()).superNftsAmount;
                  const maxSuperNfts = await snakeGame.MAX_SUPER_NFTS();
                  const superNftClaimFlagBeforeCheck = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  // console.log("superNftsAmount:", superNftsAmount.toString());
                  // console.log("maxSuperNfts:", maxSuperNfts.toString());
                  // console.log("superNftClaimFlagBeforeCheck:", superNftClaimFlagBeforeCheck);
                  assert(superNftsAmount < maxSuperNfts);
                  assert.equal(superNftClaimFlagBeforeCheck, false);
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  }
                  const snakeNftBalance = await snakeNft.balanceOf(deployer);
                  const snakeNftsRequired = await snakeGame.SNAKE_NFTS_REQUIRED();
                  // console.log("snakeNftBalance:", snakeNftBalance.toString());
                  // console.log("snakeNftsRequired:", snakeNftsRequired);
                  assert(snakeNftBalance >= snakeNftsRequired);
                  await snakeGame.checkSuperNftClaim();
                  const superNftClaimFlagAfterCheck = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  // console.log("superNftClaimFlagAfterCheck:", superNftClaimFlagAfterCheck);
                  assert.equal(superNftClaimFlagAfterCheck, true);
              });
              it("emits event after set `superNftClaimFlag` value to `true`", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  }
                  // const superNftClaimFlagBeforeCheck = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  // console.log("superNftClaimFlagBeforeCheck:", superNftClaimFlagBeforeCheck);
                  await expect(snakeGame.checkSuperNftClaim()).to.emit(snakeGame, "SuperNftUnlocked").withArgs(deployer);
                  // const superNftClaimFlagAfterCheck = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  // console.log("superNftClaimFlagAfterCheck:", superNftClaimFlagAfterCheck);
              });
              it("emits event when maximum number of `Super Pet NFTs` already claimed", async () => {
                  await snakeGame.buySnake(200, { value: ethers.utils.parseEther("2") }); // SNAKE bought: 200
                  await snakeToken.approve(snakeGame.address, 200);
                  await snakeGame.buyCredits(40); // game credits bought: 40
                  // Play the game 30x
                  for (let i = 0; i < 40; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 4000);
                  // `Snake NFT` claim: 10
                  for (let i = 0; i < 40; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  // Get 3x `Super Pet NFT`
                  for (let i = 0; i < 3; i++) {
                      await snakeGame.checkSuperNftClaim();
                      // const superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                      // console.log("superNftClaimFlag:", superNftClaimFlag);
                      let burnTokenIds = [];
                      for (let i = 0; i < 10; i++) {
                          burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                          await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                      }
                      await snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1").toString() });
                      // const superPetNftBalance = await superPetNft.balanceOf(deployer);
                      // console.log("superPetNftBalance:", superPetNftBalance.toString());
                  }
                  // await snakeGame.checkSuperNftClaim();
                  // const superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  // console.log("superNftClaimFlag:", superNftClaimFlag);
                  await expect(snakeGame.checkSuperNftClaim()).to.emit(snakeGame, "MaxSuperNftsClaimed").withArgs(deployer);
              });
          });

          describe("superPetNftClaim", async () => {
              it("reverts when Player doesn't have `Super Pet NFT` to claim", async () => {
                  await expect(snakeGame.superPetNftClaim()).to.be.revertedWith("SnakeGame__NoSuperNftToClaim");
              });
              it("reverts when Player doesn't sent enough ETH with transaction call to pay mint fee", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim(); // `Snake NFT` claim
                  }
                  await snakeGame.checkSuperNftClaim();
                  // const superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  // console.log("superNftClaimFlag:", superNftClaimFlag);
                  await expect(snakeGame.superPetNftClaim()).to.be.revertedWith("SnakeGame__NotEnoughEthSent");
              });
              it("reverts when Player doesn't have enough `Snake NFTs` to burn them as a mint fee", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  // `Snake NFT` claim: 10
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  await snakeGame.checkSuperNftClaim();
                  // const snakeNftBalance = await snakeNft.balanceOf(deployer);
                  // const snakeNftsRequired = await snakeGame.SNAKE_NFTS_REQUIRED();
                  // console.log("snakeNftBalance:", snakeNftBalance.toString());
                  // console.log("snakeNftsRequired:", snakeNftsRequired);
                  // Burn one "Snake NFT"
                  const tokenId = await snakeNft.tokenOfOwnerByIndex(deployer, 0); // Burn one `Snake NFT` owned by `deployer`
                  // console.log("tokenId:", tokenId.toString());
                  await snakeNft.approve(snakeGame.address, tokenId);
                  await snakeNft.burn(tokenId);
                  // const snakeNftBalanceAfterBurn = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftBalanceAfterBurn:", snakeNftBalanceAfterBurn.toString());
                  await expect(snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1") })).to.be.revertedWith(
                      "SnakeGame__SnakeNftBalanceTooLow"
                  ); // ETH mint fee: 0.1 ETH
              });
              it("burn Player's `Snake NFTs` as a `Super Pet NFT` mint fee", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  // `Snake NFT` claim: 10
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  await snakeGame.checkSuperNftClaim();
                  // const snakeNftBalance = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftBalance:", snakeNftBalance.toString());
                  let burnTokenIds = [];
                  for (let i = 0; i < 10; i++) {
                      burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                      await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                  }
                  await snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1") }); // ETH mint fee: 0.1 ETH
                  const snakeNftBalanceAfterBurn = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftBalanceAfterBurn:", snakeNftBalanceAfterBurn.toString());
                  assert.equal(snakeNftBalanceAfterBurn.toString(), 0);
              });
              it("sets parameter `superNftClaimFlag` to value `false`", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  // `Snake NFT` claim: 10
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  await snakeGame.checkSuperNftClaim();
                  // const snakeNftBalance = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftBalance:", snakeNftBalance.toString());
                  let burnTokenIds = [];
                  for (let i = 0; i < 10; i++) {
                      burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                      await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                  }
                  await snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1") }); // ETH mint fee: 0.1 ETH
                  const superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                  // console.log("superNftClaimFlag:", superNftClaimFlag.toString());
                  assert.equal(superNftClaimFlag, false);
              });
              it("mint unlocked `Super Pet NFT` to Player's account", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  // `Snake NFT` claim: 10
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  await snakeGame.checkSuperNftClaim();
                  // const snakeNftBalance = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftBalance:", snakeNftBalance.toString());
                  let burnTokenIds = [];
                  for (let i = 0; i < 10; i++) {
                      burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                      await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                  }
                  await snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1") }); // ETH mint fee: 0.1 ETH
                  const superNftBalance = await superPetNft.balanceOf(deployer);
                  // console.log("superNftBalance:", superNftBalance.toString());
                  assert.equal(superNftBalance, 1);
              });
              it("increments parameter `superNftsAmount` by one`", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  // `Snake NFT` claim: 10
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  await snakeGame.checkSuperNftClaim();
                  // const snakeNftBalance = await snakeNft.balanceOf(deployer);
                  // console.log("snakeNftBalance:", snakeNftBalance.toString());
                  let burnTokenIds = [];
                  for (let i = 0; i < 10; i++) {
                      burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                      await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                  }
                  await snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1") }); // ETH mint fee: 0.1 ETH
                  const superNftsAmount = (await snakeGame.getPlayerStats()).superNftsAmount;
                  // console.log("superNftsAmount:", superNftsAmount.toString());
                  assert.equal(superNftsAmount, 1);
              });
              it("emits event after `Snake NFTs` claim succeed", async () => {
                  await snakeGame.buySnake(40, { value: ethers.utils.parseEther("0.4") }); // SNAKE bought: 40
                  await snakeToken.approve(snakeGame.address, 40);
                  await snakeGame.buyCredits(10); // game credits bought: 10
                  // Play the game 10x
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(100); // game1 score: 100, 1x `Snake NFT` unlocked
                  }
                  await snakeGame.fruitClaim();
                  await fruitToken.approve(snakeGame.address, 1000);
                  // `Snake NFT` claim: 10
                  for (let i = 0; i < 10; i++) {
                      await snakeGame.snakeNftClaim();
                  }
                  await snakeGame.checkSuperNftClaim();
                  let burnTokenIds = [];
                  for (let i = 0; i < 10; i++) {
                      burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                      await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                  }
                  await expect(snakeGame.superPetNftClaim({ value: ethers.utils.parseEther("0.1") }))
                      .to.emit(snakeGame, "SuperNftClaimed")
                      .withArgs(deployer); // ETH mint fee: 0.1 ETH
              });
          });

          describe("getter functions", async () => {
              it("function `getAnyPlayerData` returns private game parameters of any given Player", async () => {
                  const getAnyPlayerData = await snakeGame.getAnyPlayerData(player1);
                  const gameCredits = getAnyPlayerData.gameCredits;
                  const gameStartedFlag = getAnyPlayerData.gameStartedFlag;
                  const fruitToClaim = getAnyPlayerData.fruitToClaim;
                  const snakeAirdropFlag = getAnyPlayerData.snakeAirdropFlag;
                  const snakeNftsToClaim = getAnyPlayerData.snakeNftsToClaim;
                  const superNftClaimFlag = getAnyPlayerData.superNftClaimFlag;
                  assert.equal(gameCredits.toString(), 0);
                  assert.equal(gameStartedFlag, false);
                  assert.equal(fruitToClaim.toString(), 0);
                  assert.equal(snakeAirdropFlag, false);
                  assert.equal(snakeNftsToClaim.toString(), 0);
                  assert.equal(superNftClaimFlag, false);
              });
              it("function `getPlayerData` returns private game parameters of current Player", async () => {
                  const getPlayerData = await snakeGame.getPlayerData(); // Default Player: deployer
                  const gameCredits = getPlayerData.gameCredits;
                  const gameStartedFlag = getPlayerData.gameStartedFlag;
                  const fruitToClaim = getPlayerData.fruitToClaim;
                  const snakeAirdropFlag = getPlayerData.snakeAirdropFlag;
                  const snakeNftsToClaim = getPlayerData.snakeNftsToClaim;
                  const superNftClaimFlag = getPlayerData.superNftClaimFlag;
                  assert.equal(gameCredits.toString(), 0);
                  assert.equal(gameStartedFlag, false);
                  assert.equal(fruitToClaim.toString(), 0);
                  assert.equal(snakeAirdropFlag, false);
                  assert.equal(snakeNftsToClaim.toString(), 0);
                  assert.equal(superNftClaimFlag, false);
              });
              it("function `getAnyPlayerStats` returns public game statistics of any given Player", async () => {
                  const getAnyPlayerStats = await snakeGame.getAnyPlayerStats(player1);
                  const gamesPlayed = getAnyPlayerStats.gamesPlayed;
                  const fruitsCollected = getAnyPlayerStats.fruitsCollected;
                  const lastScore = getAnyPlayerStats.lastScore;
                  const bestScore = getAnyPlayerStats.bestScore;
                  const snakeNftsAmount = getAnyPlayerStats.snakeNftsAmount;
                  const superNftsAmount = getAnyPlayerStats.snakeNftsAmount;
                  assert.equal(gamesPlayed.toString(), 0);
                  assert.equal(fruitsCollected.toString(), 0);
                  assert.equal(lastScore.toString(), 0);
                  assert.equal(bestScore.toString(), 0);
                  assert.equal(snakeNftsAmount.toString(), 0);
                  assert.equal(superNftsAmount.toString(), 0);
              });
              it("function `getPlayerStats` returns public game statistics of current Player", async () => {
                  const getPlayerStats = await snakeGame.getPlayerStats(); // Default Player: deployer
                  const gamesPlayed = getPlayerStats.gamesPlayed;
                  const fruitsCollected = getPlayerStats.fruitsCollected;
                  const lastScore = getPlayerStats.lastScore;
                  const bestScore = getPlayerStats.bestScore;
                  const snakeNftsAmount = getPlayerStats.snakeNftsAmount;
                  const superNftsAmount = getPlayerStats.snakeNftsAmount;
                  assert.equal(gamesPlayed.toString(), 0);
                  assert.equal(fruitsCollected.toString(), 0);
                  assert.equal(lastScore.toString(), 0);
                  assert.equal(bestScore.toString(), 0);
                  assert.equal(snakeNftsAmount.toString(), 0);
                  assert.equal(superNftsAmount.toString(), 0);
              });
              it("function `getBalance` returns ETH balance of this `SnakeGame` contract", async () => {
                  await snakeGame.fallback({ value: ethers.utils.parseEther("1") });
                  const ethBalance = await snakeGame.getBalance(); // BigNumber
                  // const ethBalanceConverted = ethers.utils.formatEther(ethBalance).toString(); // Number
                  // console.log("ethBalance:", ethBalanceConverted);
                  expectedEthBalance = ethers.utils.parseEther("1"); // 1 ETH
                  assert.equal(ethBalance.toString(), expectedEthBalance.toString());
              });
              it("function `getRandomNumber` returns pseudo rundom number in given range", async () => {
                  // NOTE: Function give random numbers, if is called only once in one block!
                  // Multiple calls in one block give the same random numbers.
                  const range = 10;
                  const randomNumberBigNumber = await snakeGame.getRandomNumber(range); // BigNumber
                  const randomNumber = ethers.BigNumber.from(randomNumberBigNumber).toNumber(); // Number
                  console.log("randomNumber:", randomNumber.toString());
                  // `randomNumberBigNumber` is not integer!
                  const checkInteger1 = Number.isInteger(randomNumberBigNumber);
                  // console.log("checkInteger1:", checkInteger1);
                  // `randomNumber` after conversion is integer
                  const checkInteger2 = Number.isInteger(randomNumber);
                  // console.log("checkInteger2:", checkInteger2);
                  // Random number output is a bigNumber, not integer and have to be in the range: 0 <= randomNumber < range
                  assert(Number.isInteger(randomNumberBigNumber) == false);
                  assert(Number.isInteger(randomNumber) == true);
                  assert(randomNumberBigNumber >= 0 && randomNumberBigNumber < range);
                  assert(randomNumber >= 0 && randomNumber < range);
              });
          });

          describe("withdrawEth", async () => {
              it("allows `onlyOwner` to withdraw ETH balance of `Snake Game` contract", async () => {
                  await snakeGame.fallback({ value: ethers.utils.parseEther("2") });
                  const ethBalanceBefore = await snakeGame.getBalance(); // BigNumber
                  // const ethBalanceBeforeConverted = ethers.utils.formatEther(ethBalanceBefore).toString(); // Number
                  // console.log("ethBalanceBefore:", ethBalanceBeforeConverted);
                  const withdrawalAmount = ethers.utils.parseEther("1"); // 1 ETH
                  await snakeGame.withdrawEth(withdrawalAmount);
                  const ethBalanceAfter = await snakeGame.getBalance(); // BigNumber
                  // const ethBalanceAfterConverted = ethers.utils.formatEther(ethBalanceAfter).toString(); // Number
                  // console.log("ethBalanceAfter:", ethBalanceAfterConverted);
                  const expectedEthBalanceAfter = ethers.utils.parseEther("1"); // 1 ETH
                  assert.equal(ethBalanceAfter.toString(), expectedEthBalanceAfter.toString());
              });
              it("should revert when ETH withdrawal transaction failed", async () => {
                  await snakeGame.fallback({ value: ethers.utils.parseEther("1") });
                  // const ethBalanceBefore = await snakeGame.getBalance(); // BigNumber
                  // const ethBalanceBeforeConverted = ethers.utils.formatEther(ethBalanceBefore).toString(); // Number
                  // console.log("ethBalanceBefore:", ethBalanceBeforeConverted);
                  const withdrawalAmount = ethers.utils.parseEther("2"); // 1 ETH
                  await expect(snakeGame.withdrawEth(withdrawalAmount)).to.be.revertedWith("SnakeGame__EthWithdrawalFailed");
                  // const ethBalanceAfter = await snakeGame.getBalance(); // BigNumber
                  // const ethBalanceAfterConverted = ethers.utils.formatEther(ethBalanceAfter).toString(); // Number
                  // console.log("ethBalanceAfter:", ethBalanceAfterConverted);
              });
          });

          describe("receive", async () => {
              it("should invoke the `receive` function and receive ETH payment", async () => {
                  const [signer] = await ethers.getSigners();
                  const ethAmount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeGame.address, data: "0x", value: ethAmount });
                  await expect(tx).to.emit(snakeGame, "TransferReceived").withArgs(ethAmount);
                  // const ethBalance = ethers.utils.formatEther(await snakeGame.getBalance()).toString();
                  // console.log("ethBalance:", ethBalance.toString());
              });
          });

          describe("fallback", async () => {
              it("should invoke the `fallback` function and receive ETH payment", async () => {
                  const [signer] = await ethers.getSigners();
                  const ethAmount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeGame.address, data: "0x01", value: ethAmount });
                  await expect(tx).to.emit(snakeGame, "TransferReceived").withArgs(ethAmount);
                  // const ethBalance = ethers.utils.formatEther(await snakeGame.getBalance()).toString();
                  // console.log("ethBalance:", ethBalance.toString());
              });
          });
      });
