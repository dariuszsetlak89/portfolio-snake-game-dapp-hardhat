const { ethers } = require("hardhat");

async function gameStart() {
    let deployer,
        player1,
        snakeGame,
        snakeTokenAddress,
        snakeToken,
        superPetNftAddress,
        superPetNft,
        snakeBalance,
        gameBaseFee,
        gameFee,
        gameStartedFlag;

    // Get accounts: deployer, player
    deployer = (await getNamedAccounts()).deployer;
    player1 = (await getNamedAccounts()).player1;

    //////////////////////////////////////////
    // Set PLAYER: deployer, player1
    const PLAYER = deployer;
    //////////////////////////////////////////

    // Get contract: SnakeGame
    snakeGame = await ethers.getContract("SnakeGame", PLAYER);
    // Get contract: SnakeToken
    snakeTokenAddress = await snakeGame.i_snakeToken();
    snakeToken = await ethers.getContractAt("Token", snakeTokenAddress, PLAYER);
    // Get contract: SuperPetNft
    superPetNftAddress = await snakeGame.i_superPetNft();
    superPetNft = await ethers.getContractAt("Nft", superPetNftAddress, PLAYER);

    console.log("-------------------------------------------------------");

    console.log("!!! GAME START !!!");

    // Current Player
    console.log(`Current PLAYER: ${PLAYER}`);
    // Game started flag
    gameStartedFlag = (await snakeGame.getPlayerData(PLAYER)).gameStartedFlag;
    console.log("Game started flag:", gameStartedFlag.toString());
    // SNAKE balance
    snakeBalance = await snakeToken.balanceOf(PLAYER);
    console.log(`SNAKE balance before: ${snakeBalance.toString()}`);
    // Game fee calculation
    gameBaseFee = await snakeGame.GAME_BASE_FEE();
    superPetNftBalance = await superPetNft.balanceOf(PLAYER);
    if (superPetNftBalance <= 3) {
        gameFee = gameBaseFee - superPetNftBalance;
    } else gameFee = 1;
    console.log(`Game fee: ${gameFee.toString()} SNAKE`);
    // Approve `SnakeGame` contract to burn gameFee amount of SNAKE tokens
    await snakeToken.approve(snakeGame.address, gameFee);

    console.log("---");

    // GAME START
    await snakeGame.gameStart();
    console.log("GAME STARTED!");

    console.log("---");

    // Game started flag
    gameStartedFlag = (await snakeGame.getPlayerData(PLAYER)).gameStartedFlag;
    console.log("Game started flag:", gameStartedFlag.toString());
    // SNAKE balance
    snakeBalance = await snakeToken.balanceOf(PLAYER);
    console.log(`SNAKE balance after: ${snakeBalance.toString()}`);

    // Gas estimation
    gasEstimation = await ethers.provider.getBalance(developer);
    console.log(`Gas estimation: ${gasEstimation}`);

    console.log("-------------------------------------------------------");
}

gameStart()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
