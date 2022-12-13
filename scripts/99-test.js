const { ethers } = require("hardhat");

async function test() {
    let deployer,
        player1,
        snakeGame,
        snakeTokenAddress,
        snakeToken,
        snakeNftAddress,
        snakeNft,
        superPetNftAddress,
        superPetNft,
        contractBalance,
        latestBestPlayersPrize,
        bestPlayerEverPrize,
        developerTip;

    const provider = ethers.getDefaultProvider();

    // Get accounts: deployer, player
    deployer = (await getNamedAccounts()).deployer;
    player1 = (await getNamedAccounts()).player1;
    // Get contracts
    snakeGame = await ethers.getContract("SnakeGame", deployer);
    snakeTokenAddress = await snakeGame.i_snakeToken();
    snakeToken = await ethers.getContractAt("Token", snakeTokenAddress);
    snakeNftAddress = await snakeGame.i_snakeNft();
    snakeNft = await ethers.getContractAt("Nft", snakeNftAddress);
    superPetNftAddress = await snakeGame.i_superPetNft();
    superPetNft = await ethers.getContractAt("Nft", superPetNftAddress);

    console.log("-------------------------------------------------------");

    console.log("!!! TEST !!!");

    // Game round after function call
    gameRound = await snakeGame.getGameRound();
    console.log(`Game round: ${gameRound.toString()}`);

    // Get `SnakeGame` contract balance
    contractBalance = await snakeGame.getBalance();
    console.log(`SnakeGame contract balance: ${ethers.utils.formatEther(contractBalance)} ETH`);
    // Latest best Player's prize amount
    latestBestPlayersPrize = contractBalance.div(10).mul(7);
    console.log(`Latest best Player's prize: ${ethers.utils.formatEther(latestBestPlayersPrize)}`);
    latestBestPlayer = (await snakeGame.getGameRoundData(gameRound)).bestPlayer;
    latestBestPlayersBalance = await provider.getBalance(latestBestPlayer);
    console.log(`Latest best Player's balance: ${latestBestPlayersBalance} ETH`);
    // Best Player ever prize amount
    bestPlayerEverPrize = contractBalance.div(10).mul(2);
    console.log(`Best Player ever prize: ${ethers.utils.formatEther(bestPlayerEverPrize)}`);
    bestPlayerEver = await snakeGame.getBestPlayerEver();
    bestPlayersEverBalance = await provider.getBalance(bestPlayerEver);
    console.log(`Best Player's ever balance: ${bestPlayersEverBalance} ETH`);
    // Developer tip amount
    developerTip = contractBalance.div(10).mul(1);
    console.log(`Developer tip amount: ${ethers.utils.formatEther(developerTip)}`);
    developer = await snakeGame.DEV();
    developersBalance = await provider.getBalance(developer);
    console.log(`Developer's balance: ${developersBalance} ETH`);

    console.log("-------------------------------------------------------");
}

test()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
