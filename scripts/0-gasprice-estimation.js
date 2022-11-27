const { ethers } = require("hardhat");

async function gameStart() {
    let deployer, player1, snakeGame;

    // Get accounts: deployer, player
    deployer = (await getNamedAccounts()).deployer;
    player1 = (await getNamedAccounts()).player1;

    //////////////////////////////////////////
    // Set PLAYER: deployer, player1
    const PLAYER = deployer;
    //////////////////////////////////////////

    // Get contract: SnakeGame
    snakeGame = await ethers.getContract("SnakeGame", PLAYER);

    console.log("-------------------------------------------------------");

    console.log("!!! GAS PRICE ESTIMATION !!!");

    const provider = ethers.getDefaultProvider();
    // const feeData = await provider.getFeeData();
    const feeData = (await provider.getFeeData()).maxFeePerGas.mul(gasLimit);
    const fee = ethers.utils.formatUnits(feeData.maxFeePerGas, "gwei");
    console.log("fee:", fee);

    console.log("-------------------------------------------------------");
}

gameStart()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
