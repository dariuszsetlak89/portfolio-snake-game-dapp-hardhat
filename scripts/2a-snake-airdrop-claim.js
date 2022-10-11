const { getNamedAccounts } = require("hardhat");

async function snakeAirdropClaim() {
    console.log(`!!! Script: 1a-snake-airdrip-claim !!!`);

    // 1) Deploy and get game smart contracts
    const { deployer, player1, player2, player3 } = await getNamedAccounts();
    await deployments.fixture(["snakegame", "gametokens"]);
    console.log(`Deployed Snake Game Smart Contracts:`);

    // Get SnakeGame contract
    const snakeGame = await ethers.getContract("SnakeGame", deployer);
    const snakeGameAddress = await snakeGame.getSnakeGameAddress();
    console.log(`SnakeGame: ${snakeGameAddress}`);

    // Get GameTokens contract
    const gameTokens = await ethers.getContract("GameTokens", deployer);
    const gameTokensAddress = await gameTokens.getGameTokensAddress();
    console.log(`GameTokens: ${gameTokensAddress}`);

    // Get SnakeToken contract
    const snakeToken = await ethers.getContract("GameTokens", deployer);
    const snakeTokenAddress = await gameTokens.getSnakeTokenAddress();
    console.log(`SnakeToken: ${snakeTokenAddress}`);

    // Get FruitToken contract
    const fruitToken = await ethers.getContract("GameTokens", deployer);
    const fruitTokenAddress = await gameTokens.getSnakeTokenAddress();
    console.log(`FruitToken: ${snakeTokenAddress}`);

    console.log("------------------------------------------------------------------------");
}

snakeAirdropClaim()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
