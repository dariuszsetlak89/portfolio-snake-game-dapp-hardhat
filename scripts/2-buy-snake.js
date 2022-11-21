const { ethers } = require("hardhat");

async function buySnake() {
    let deployer, player1, snakeGame, snakeTokenAddress, snakeToken, snakeToBuy, snakeEthRate, ethPayment, snakeBalance;

    // Get accounts: deployer, player1
    deployer = (await getNamedAccounts()).deployer;
    player1 = (await getNamedAccounts()).player1;

    //////////////////////////////////////////
    // Set PLAYER: deployer, player1
    const PLAYER = deployer;
    //////////////////////////////////////////

    ///////////////////////////
    // Set snakeToBuy amount:
    snakeToBuy = 100;
    ///////////////////////////

    // Get contract: SnakeGame
    snakeGame = await ethers.getContract("SnakeGame", PLAYER);
    // Get contract: SnakeToken
    snakeTokenAddress = await snakeGame.i_snakeToken();
    snakeToken = await ethers.getContractAt("Token", snakeTokenAddress, PLAYER);

    console.log("-------------------------------------------------------");

    console.log("!!! BUY SNAKE !!!");

    // Current Player
    console.log(`Current PLAYER: ${PLAYER}`);
    // SNAKE tokens to buy amount
    console.log(`Snake tokens to buy: ${snakeToBuy}`);
    // SNAKE/ETH exchange rate
    snakeEthRate = await snakeGame.i_snakeExchangeRate();
    console.log(`SNAKE/ETH exchange rate: ${(snakeEthRate / 1e18).toString()} SNAKE/ETH`);
    // ETH payment
    ethPayment = snakeToBuy * snakeEthRate;
    console.log(`ETH payment: ${(ethPayment / 1e18).toString()} ETH`);

    console.log("---");

    // BUY SNAKE
    await snakeGame.buySnake(snakeToBuy, { value: ethPayment.toString() });
    snakeBalance = (await snakeToken.balanceOf(PLAYER)).toString();
    console.log(`SNAKE TOKENS BOUGHT! +${snakeToBuy} SNAKE`);

    console.log("---");

    // SNAKE balance
    snakeBalance = await snakeToken.balanceOf(PLAYER);
    console.log("SNAKE tokens balance:", snakeBalance.toString());
    // Get `SnakeGame` contract balance
    contractBalance = await snakeGame.getBalance();
    console.log(`SnakeGame contract balance: ${ethers.utils.formatEther(contractBalance)} ETH`);

    console.log("-------------------------------------------------------");
}

buySnake()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
