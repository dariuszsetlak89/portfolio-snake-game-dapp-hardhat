const { network, deployments, ethers, getNamedAccounts } = require(`hardhat`);
const { assert } = require(`chai`);
const { developmentChains } = require(`../../helper-hardhat-config`);

/*
  This test is prepared to run both on development network like Hardhat or testnet network
  like Goerli. To run this test on development network simply put exclamation mark in front
  of first code line below like this: '!developmentChains.includes(network.name)'and change
  test 'it' to 'it.only', to run only this test, without running also all unit tests from
  'unit' folder.
  !!! Important !!!
  If you run this test on testnet network like Goerli, please set the value of parameter
  'numberOfGames' to reasonable value, like for example maximum 'numberOfGames = 5'.
  If you set the number of games parameter too high it will take you "ages" to finish
  this test.
*/
!developmentChains.includes(network.name)
    ? describe.skip
    : describe(`SnakeGame Staging Test: Play Snake Game - random score`, function () {
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
              await deployments.fixture([`snakegame`]);
              // Get accounts: deployer, player
              deployer = (await getNamedAccounts()).deployer;
              player1 = (await getNamedAccounts()).player1;
              // Get contract: SnakeGame
              snakeGame = await ethers.getContract(`SnakeGame`, deployer);
              // Get contract: SnakeToken
              snakeTokenAddress = await snakeGame.i_snakeToken();
              snakeToken = await ethers.getContractAt(`Token`, snakeTokenAddress);
              // Get contract: FruitToken
              fruitTokenAddress = await snakeGame.i_fruitToken();
              fruitToken = await ethers.getContractAt(`Token`, fruitTokenAddress);
              // Get contract: SnakeNft
              snakeNftAddress = await snakeGame.i_snakeNft();
              snakeNft = await ethers.getContractAt(`Nft`, snakeNftAddress);
              // Get contract: SuperPetNft
              superPetNftAddress = await snakeGame.i_superPetNft();
              superPetNft = await ethers.getContractAt(`Nft`, superPetNftAddress);
          });

          describe(`Play Snake Game`, async () => {
              it.only(`Gameplay simulation - random score`, async () => {
                  console.log(`--------------------------------------------------------------------------`);
                  console.log(`               !!! Snake Game Gameplay - random score !!!`);
                  console.log(`--------------------------------------------------------------------------`);

                  // Test description:
                  // Play `numberOfGames` game cycles:
                  //// 1) Buy SNAKE: gameCreditPrice
                  //// 2) Buy gameCredit: 1
                  //// 3) Play the game: 1x
                  //// 4) Claim FRUIT tokens: [random] FRUIT
                  //// 5) Claim `Snake NFTs`: [random] SNFT
                  //// 6) Check `Super Pet NFT` claim eligibility
                  //// 7) Claim `Super Pet NFT`
                  //// 8) PLAYER'S GAME TOKENS BALANCES

                  // --------------------------------------------------------------------------------------

                  //////////////////////////////////
                  ////      Game parameters     ////
                  //////////////////////////////////

                  // Constants
                  const scoreToClaimSnakeNft = await snakeGame.SCORE_TO_CLAIM_SNAKE_NFT(); // 100
                  const gameCreditBasePrice = await snakeGame.GAME_CREDIT_BASE_PRICE(); // 3
                  const snakeEthRate = await snakeGame.SNAKE_ETH_RATE(); // 0.01 * 1e18 = 1e16
                  const maxSnakeNfts = await snakeGame.MAX_SNAKE_NFTS(); // 40
                  const maxSuperNfts = await snakeGame.MAX_SUPER_NFTS(); // 3
                  const fruitMintFee = await snakeGame.FRUIT_MINT_FEE(); // 100
                  const ethMintFee = await snakeGame.ETH_MINT_FEE(); // 0.1
                  const snakeNftsRequired = await snakeGame.SNAKE_NFTS_REQUIRED(); // 10

                  // Player data
                  let gameCredits = (await snakeGame.getPlayerData()).gameCredits; // 0
                  let fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim; // 0
                  let snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim; // 0
                  let superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag; // flase

                  // Player stats
                  let gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed; // 0
                  let lastScore = (await snakeGame.getPlayerStats()).lastScore; // 0
                  let bestScore = (await snakeGame.getPlayerStats()).bestScore; // 0
                  let fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected; // 0
                  let snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount; // 0
                  let superNftsAmount = (await snakeGame.getPlayerStats()).superNftsAmount; // 0

                  // Game tokens balances
                  let snakeBalance = await snakeToken.balanceOf(deployer); // 0
                  let fruitBalance = await fruitToken.balanceOf(deployer); // 0
                  let snakeNftBalance = await snakeNft.balanceOf(deployer); // 0
                  let superPetNftBalance = await superPetNft.balanceOf(deployer); // 0

                  // Game variables
                  let gameScore;
                  let gameCreditPrice = gameCreditBasePrice;
                  let ethPayment;
                  let previousBestScore;
                  let previousFruitsCollected;
                  let previousSnakeNftBalance;
                  let previousFruitBalance;
                  let previousSnakeNftsAmount;
                  let previousSuperNftsAmount;
                  let previousSuperPetNftBalance;
                  let burnTokenIds;

                  //////////////////////////////////
                  ////      Test variables      ////
                  //////////////////////////////////

                  let numberOfGames = 33; // IMPORTANT! Set this variable carefully when test on-chain
                  let randomScoreRange = 200;

                  //////////////////////////////////////
                  //  Main FOR loop: 'numberOfGames'  //
                  //////////////////////////////////////

                  for (let i = 1; i <= numberOfGames; i++) {
                      console.log(`--------------------------------------------------------------------------`);
                      console.log(`                         !!! GAME NUMBER ${i} !!!`);
                      console.log(`--------------------------------------------------------------------------`);

                      //// 1) Buy SNAKE: gameCreditPrice
                      console.log(`1) Buy SNAKE: ${gameCreditPrice}`);
                      //// ethPayment
                      ethPayment = gameCreditPrice * snakeEthRate;
                      console.log(`ethPayment: ${ethPayment / 1e18} ETH`);
                      //// Buy SNAKE: `gameCreditPrice` SNAKE
                      await snakeGame.buySnake(gameCreditPrice, { value: ethPayment.toString() });
                      snakeBalance = (await snakeToken.balanceOf(deployer)).toString();
                      console.log(`Snake Token balance: ${snakeBalance} SNAKE`);
                      assert.equal(snakeBalance, gameCreditPrice);

                      console.log(`--------------------------------------------------------------------------`);

                      //// 2) Buy gameCredit: +1
                      console.log(`2) Buy gameCredit: +1`);
                      //// Game Credit price
                      gameCreditPrice = gameCreditBasePrice - superPetNftBalance;
                      console.log(`gameCreditPrice: ${gameCreditPrice} SNAKE`);
                      //// Approve `SnakeGame` to transfer `gameCreditPrice` SNAKE tokens
                      await snakeToken.approve(snakeGame.address, gameCreditPrice);
                      //// Buy gameCredits: 1
                      await snakeGame.buyCredits(1);
                      gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                      console.log(`gameCredits: ${gameCredits}`);
                      assert.equal(gameCredits.toString(), 1);
                      //// SNAKE balance: 0 SNAKE
                      snakeBalance = await snakeToken.balanceOf(deployer);
                      console.log(`Snake Token balance: ${snakeBalance} SNAKE`);
                      assert.equal(snakeBalance.toString(), 0);

                      console.log(`--------------------------------------------------------------------------`);

                      //// 3) Play the game: 1x
                      console.log(`3) Play the game: 1x`);
                      //// Random `gameScore` input, max 250
                      gameScore = Math.floor(Math.random() * randomScoreRange);
                      //// Play the Snake Game
                      await snakeGame.gameStart();
                      await snakeGame.gameOver(gameScore);
                      //// gameCredits -= 1 = 0
                      gameCredits = (await snakeGame.getPlayerData()).gameCredits;
                      // console.log(`gameCredits: ${gameCredits}`);
                      assert.equal(gameCredits.toString(), 0);
                      //// gamesPlayed += 1
                      gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                      console.log(`gamesPlayed: ${gamesPlayed}`);
                      assert.equal(gamesPlayed, i);
                      //// fruitToClaim += gameScore
                      fruitToClaim = (await snakeGame.getPlayerData()).fruitToClaim.toString();
                      console.log(`fruitToClaim: ${fruitToClaim} FRUIT`);
                      assert.equal(fruitToClaim, gameScore);
                      //// lastScore = gameScore
                      lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                      console.log(`lastScore: ${lastScore}`);
                      assert.equal(lastScore, gameScore);
                      //// bestScore = gameScore if >> last bestScore
                      // previousBestScore = bestScore;
                      previousBestScore = ethers.BigNumber.from(bestScore).toNumber();
                      bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                      console.log(`bestScore: ${bestScore}`);
                      assert(bestScore >= previousBestScore);
                      //// snakeNftsToClaim += 1 if gameScore >= 100
                      snakeNftsToClaim = (await snakeGame.getPlayerData()).snakeNftsToClaim;
                      console.log(`snakeNftsToClaim: ${snakeNftsToClaim} SNFT`);
                      if (snakeNftsAmount < ethers.BigNumber.from(maxSnakeNfts).toNumber()) {
                          if (gameScore >= scoreToClaimSnakeNft) {
                              console.log(`!!! 'Snake NFT' unlocked !!!`);
                              assert.equal(snakeNftsToClaim, 1);
                          } else {
                              console.log(
                                  `Minimum game score to unlock 'Snake NFT' not reached!: ${gameScore} < ${scoreToClaimSnakeNft}`
                              );
                              assert.equal(snakeNftsToClaim, 0);
                          }
                      } else {
                          console.log(`Maximum number of 'Snake NFTs' reached: ${maxSnakeNfts} SNFT`);
                      }

                      console.log(`--------------------------------------------------------------------------`);

                      //// 4) Claim FRUIT tokens: gameScore FRUIT
                      console.log(`4) Claim FRUIT tokens: ${fruitToClaim} FRUIT`);
                      if (fruitToClaim > 0) {
                          //// FRUIT tokens claim
                          await snakeGame.fruitClaim();
                          //// fruitsCollected += fruitToClaim = gameScore
                          previousFruitsCollected = ethers.BigNumber.from(fruitsCollected).toNumber();
                          fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                          console.log(`fruitsCollected: ${fruitsCollected} FRUIT`);
                          assert.equal(fruitsCollected, previousFruitsCollected + gameScore);
                          //// FRUIT balance: gameScore
                          previousFruitBalance = ethers.BigNumber.from(fruitBalance).toNumber();
                          fruitBalance = await fruitToken.balanceOf(deployer);
                          console.log(`Fruit Token balance: ${fruitBalance} FRUIT`);
                          assert.equal(fruitBalance, previousFruitBalance + gameScore);
                      } else {
                          console.log(`No 'Fruit Tokens' to claim!`);
                      }

                      console.log(`--------------------------------------------------------------------------`);

                      //// 5) Claim `Snake NFTs`: max 1 SNFT
                      console.log(`5) Claim 'Snake NFTs': ${snakeNftsToClaim} SNFT`);
                      if (snakeNftsToClaim >= 1) {
                          //// Approve `SnakeGame` to transfer `FRUIT_MINT_FEE` FRUIT tokens
                          await fruitToken.approve(snakeGame.address, fruitMintFee);
                          //// Claim `Snake NFT`: +1
                          await snakeGame.snakeNftClaim();
                          //// snakeNftsAmount += 1
                          previousSnakeNftsAmount = ethers.BigNumber.from(snakeNftsAmount).toNumber();
                          snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount.toString();
                          console.log(`snakeNftsAmount: ${snakeNftsAmount} SNFT`);
                          assert.equal(snakeNftsAmount, previousSnakeNftsAmount + 1);
                          //// `Snake NFT` balance += 1 SNFT
                          previousSnakeNftBalance = ethers.BigNumber.from(snakeNftBalance).toNumber();
                          snakeNftBalance = await snakeNft.balanceOf(deployer);
                          console.log(`Snake NFT balance: ${snakeNftBalance} SNFT`);
                          assert.equal(snakeNftBalance, previousSnakeNftBalance + 1);
                          //// FRUIT balance: -fruitMintFee FRUIT
                          previousFruitBalance = ethers.BigNumber.from(fruitBalance).toNumber();
                          fruitBalance = await fruitToken.balanceOf(deployer);
                          console.log(`Fruit Token balance: ${fruitBalance} FRUIT`);
                          assert.equal(fruitBalance, previousFruitBalance - fruitMintFee);
                      } else {
                          console.log(`No 'Snake NFTs' to claim!`);
                      }

                      console.log(`--------------------------------------------------------------------------`);

                      //// 6) Check `Super Pet NFT` claim eligibility
                      console.log(`6) Check 'Super Pet NFT' claim eligibility`);
                      //// Check `Super Pet NFT` claim eligibility
                      await snakeGame.checkSuperNftClaim();
                      //// superNftClaimFlag = true or false
                      superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                      console.log(`superNftClaimFlag: ${superNftClaimFlag}`);
                      if (superNftsAmount < maxSuperNfts) {
                          if (snakeNftBalance >= snakeNftsRequired) {
                              console.log(`!!! 'Super Pet NFT' unlocked !!!`);
                              assert.equal(superNftClaimFlag, true);
                          } else {
                              console.log(
                                  `Minimum 'Snake NFT' balance to unlock 'Super Pet NFT' not reached!: ${snakeNftBalance} < ${snakeNftsRequired}`
                              );
                              assert.equal(superNftClaimFlag, false);
                          }
                      } else {
                          console.log(`Maximum number of 'Super Pet NFTs' reached: ${superPetNftBalance} SPET`);
                      }

                      console.log(`--------------------------------------------------------------------------`);

                      //// 7) Claim `Super Pet NFT`
                      console.log(`7) Claim 'Super Pet NFT'`);
                      if (superPetNftBalance < maxSuperNfts) {
                          if (superNftClaimFlag) {
                              //// Approve `Snake NFTs` to burn as a `Super Pet NFT` mint fee
                              burnTokenIds = [];
                              for (let i = 0; i < snakeNftsRequired; i++) {
                                  burnTokenIds[i] = snakeNft.tokenOfOwnerByIndex(deployer, i);
                                  await snakeNft.approve(snakeGame.address, burnTokenIds[i]);
                              }
                              //// Claim `Super Pet NFT`
                              await snakeGame.superPetNftClaim({ value: ethers.utils.parseEther(`0.1`) });
                              //// superNftClaimFlag = false
                              superNftClaimFlag = (await snakeGame.getPlayerData()).superNftClaimFlag;
                              console.log(`superNftClaimFlag: ${superNftClaimFlag}`);
                              assert.equal(superNftClaimFlag, false);
                              //// snakeNftsAmount += 1 = 1
                              previousSuperNftsAmount = ethers.BigNumber.from(superNftsAmount).toNumber();
                              superNftsAmount = (await snakeGame.getPlayerStats()).superNftsAmount.toString();
                              console.log(`superNftsAmount: ${superNftsAmount} SNFT`);
                              assert.equal(superNftsAmount, previousSuperNftsAmount + 1);
                              //// `Snake NFT` balance: 0 SNFT
                              snakeNftBalance = await snakeNft.balanceOf(deployer);
                              console.log(`Snake NFT balance: ${snakeNftBalance} SNFT`);
                              assert.equal(snakeNftBalance.toString(), 0);
                              //// `Super Pet NFT` balance: 1 SNFT
                              previousSuperPetNftBalance = ethers.BigNumber.from(superPetNftBalance).toNumber();
                              superPetNftBalance = await superPetNft.balanceOf(deployer);
                              console.log(`Super Pet NFT balance: ${superPetNftBalance} SPET`);
                              assert.equal(superPetNftBalance, previousSuperPetNftBalance + 1);
                          } else {
                              console.log(`No 'Super Pet NFT' to claim!`);
                          }
                      } else {
                          console.log(`Maximum number of 'Super Pet NFTs' reached: ${superPetNftBalance} SPET`);
                      }

                      console.log(`--------------------------------------------------------------------------`);

                      //// 8) GAME STATISTICS & BALANCES
                      console.log(`PLAYER'S GAME STATISTICS`);
                      //// gamesPlayed
                      gamesPlayed = (await snakeGame.getPlayerStats()).gamesPlayed.toString();
                      console.log(`gamesPlayed: ${gamesPlayed}`);
                      //// Game Credit price
                      gameCreditPrice = gameCreditBasePrice - superPetNftBalance;
                      console.log(`gameCreditPrice: ${gameCreditPrice} SNAKE`);
                      //// lastScore
                      lastScore = (await snakeGame.getPlayerStats()).lastScore.toString();
                      console.log(`lastScore: ${lastScore}`);
                      //// bestScore
                      previousBestScore = bestScore;
                      bestScore = (await snakeGame.getPlayerStats()).bestScore.toString();
                      console.log(`bestScore: ${bestScore}`);
                      //// fruitsCollected
                      fruitsCollected = (await snakeGame.getPlayerStats()).fruitsCollected.toString();
                      console.log(`fruitsCollected: ${fruitsCollected} FRUIT`);
                      //// snakeNftsAmount
                      snakeNftsAmount = (await snakeGame.getPlayerStats()).snakeNftsAmount.toString();
                      console.log(`snakeNftsAmount: ${snakeNftsAmount} SNFT`);
                      //// superNftsAmount
                      superNftsAmount = (await snakeGame.getPlayerStats()).superNftsAmount.toString();
                      console.log(`superNftsAmount: ${superNftsAmount} SPET`);
                      console.log(``);
                      ////
                      console.log(`PLAYER'S GAME TOKENS BALANCES`);
                      //// SNAKE balance: 0 SNAKE
                      snakeBalance = await snakeToken.balanceOf(deployer);
                      console.log(`Snake Token balance: ${snakeBalance} SNAKE`);
                      //// FRUIT balance: 0 FRUIT
                      fruitBalance = await fruitToken.balanceOf(deployer);
                      console.log(`Fruit Token balance: ${fruitBalance} FRUIT`);
                      //// Snake NFT balance: 0 SNFT
                      snakeNftBalance = await snakeNft.balanceOf(deployer);
                      console.log(`Snake NFT balance: ${snakeNftBalance} SNFT`);
                      //// Supet Pet NFT balance: 1 SNFT
                      superPetNftBalance = await superPetNft.balanceOf(deployer);
                      console.log(`Super Pet NFT balance: ${superPetNftBalance} SPET`);

                      // console.log(`--------------------------------------------------------------------------`);
                  }
              });
          });
      });
