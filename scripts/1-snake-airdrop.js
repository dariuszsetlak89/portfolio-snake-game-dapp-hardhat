const { ethers } = require("hardhat");

async function snakeAirdrop() {
    let deployer, player1, snakeGame, snakeTokenAddress, snakeToken, snakeAirdropFlag, snakeBalance;

    // Get accounts: deployer, player1
    deployer = (await getNamedAccounts()).deployer;
    player1 = (await getNamedAccounts()).player1;

    //////////////////////////////////////////
    // Set PLAYER: deployer, player1
    const PLAYER = deployer;
    //////////////////////////////////////////

    // Get contracts
    snakeGame = await ethers.getContract("SnakeGame", PLAYER);
    snakeTokenAddress = await snakeGame.i_snakeToken();
    snakeToken = await ethers.getContractAt("Token", snakeTokenAddress, PLAYER);

    console.log("-------------------------------------------------------");

    console.log("!!! SNAKE AIRDROP !!!");

    // Current Player
    console.log(`Current PLAYER: ${PLAYER}`);
    // SNAKE airdrop flag
    snakeAirdropFlag = (await snakeGame.getPlayerData(PLAYER)).snakeAirdropFlag;

    // SNAKE AIRDROP
    await snakeGame.snakeAirdrop();
    console.log("SNAKE AIRDROP RECEIVED!");

    // SNAKE balance
    snakeBalance = await snakeToken.balanceOf(PLAYER);
    console.log("SNAKE balance:", snakeBalance.toString());

    console.log("-------------------------------------------------------");
}

snakeAirdrop()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
