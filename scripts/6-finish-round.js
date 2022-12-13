const { ethers } = require("hardhat");

async function finishRound() {
    let deployer,
        snakeGame,
        snakeTokenAddress,
        snakeToken,
        snakeNftAddress,
        snakeNft,
        superPetNftAddress,
        superPetNft,
        gameRound,
        roundGamesPlayed,
        roundBestPlayer,
        bestPlayerEver,
        developer,
        roundHighestScore,
        contractBalance,
        roundBestPlayersBalance,
        roundBestPlayersPrize,
        bestPlayersEverBalance,
        bestPlayerEverPrize,
        developersBalance,
        developersTip,
        gamesPlayedTotal,
        highestScoreEver;

    // Get accounts: deployer
    deployer = (await getNamedAccounts()).deployer;

    ///////////////////////////////////////////////////
    // Set function caller: deployer
    const CALLER = deployer;
    ///////////////////////////////////////////////////

    // Get contracts
    snakeGame = await ethers.getContract("SnakeGame", CALLER);
    snakeTokenAddress = await snakeGame.i_snakeToken();
    snakeToken = await ethers.getContractAt("Token", snakeTokenAddress, CALLER);
    snakeNftAddress = await snakeGame.i_snakeNft();
    snakeNft = await ethers.getContractAt("Nft", snakeNftAddress, CALLER);
    superPetNftAddress = await snakeGame.i_superPetNft();
    superPetNft = await ethers.getContractAt("Nft", superPetNftAddress, CALLER);

    console.log("-------------------------------------------------------");

    console.log("!!! FINISH ROUND !!!");

    // Current CALLER
    console.log(`Current function CALLER: ${CALLER}`);
    // Game round before
    gameRound = await snakeGame.getGameRound();
    console.log(`Game round before: ${gameRound.toString()}`);
    // Round games played
    roundGamesPlayed = (await snakeGame.getGameRoundData(gameRound)).gamesPlayed;
    console.log(`Games played in this round: ${roundGamesPlayed.toString()}`);
    // Round best Player
    roundBestPlayer = (await snakeGame.getGameRoundData(gameRound)).bestPlayer;
    console.log(`Round best Player: ${roundBestPlayer}`);
    // Best Player ever before
    bestPlayerEver = await snakeGame.getBestPlayerEver();
    console.log(`Best Player ever before: ${bestPlayerEver}`);
    // Developer's address
    developer = await snakeGame.DEV();
    console.log(`Developer's address: ${developer}`);
    // Round best Player's score
    roundHighestScore = (await snakeGame.getGameRoundData(gameRound)).highestScore;
    console.log(`Round highest score: ${roundHighestScore}`);

    console.log("---");

    // Get `SnakeGame` contract balance
    contractBalance = await snakeGame.getBalance();
    console.log(`SnakeGame contract balance before: ${ethers.utils.formatEther(contractBalance)} ETH`);
    // Round best Player's balance before
    roundBestPlayersBalance = await ethers.provider.getBalance(roundBestPlayer);
    console.log(`Round best Player's balance before: ${ethers.utils.formatEther(roundBestPlayersBalance)} ETH`);
    // Best Player ever's balance before
    bestPlayersEverBalance = await ethers.provider.getBalance(bestPlayerEver);
    console.log(`Best Player's ever balance before: ${ethers.utils.formatEther(bestPlayersEverBalance)} ETH`);
    // Developer's balance before
    developersBalance = await ethers.provider.getBalance(developer);
    console.log(`Developers balance before: ${ethers.utils.formatEther(developersBalance)} ETH`);

    // Round best Player's prize amount
    roundBestPlayersPrize = contractBalance.div(10).mul(7);
    console.log(`Round best Player's prize: ${ethers.utils.formatEther(roundBestPlayersPrize)} ETH`);
    // Best Player ever's prize amount
    bestPlayerEverPrize = contractBalance.div(10).mul(2);
    console.log(`Best Player ever prize: ${ethers.utils.formatEther(bestPlayerEverPrize)} ETH`);
    // Developer's tip amount
    developersTip = contractBalance.div(10).mul(1);
    console.log(`Developer tip amount: ${ethers.utils.formatEther(developersTip)} ETH`);

    console.log("---");

    // FINISH ROUND
    tx = await snakeGame.finishRound();
    await tx.wait(1);
    console.log("ROUND FINISHED!");

    console.log("---");

    // Game round after
    gameRound = await snakeGame.getGameRound();
    console.log(`Game round after: ${gameRound.toString()}`);
    // Get `SnakeGame` contract balance after
    contractBalance = await snakeGame.getBalance();
    console.log(`SnakeGame contract balance after: ${ethers.utils.formatEther(contractBalance)} ETH`);
    // Games played total
    gamesPlayedTotal = await snakeGame.getGamePlayedTotal();
    console.log(`Games played total: ${gamesPlayedTotal.toString()}`);
    // Highest score ever
    highestScoreEver = await snakeGame.getGameHighestScoreEver();
    console.log(`Highest score ever: ${highestScoreEver.toString()}`);
    // Best player ever
    bestPlayerEver = await snakeGame.getBestPlayerEver();
    console.log(`Best player ever: ${bestPlayerEver.toString()}`);

    console.log("---");

    // Round best Player's balance and prize amount after
    roundBestPlayersBalance = await ethers.provider.getBalance(roundBestPlayer);
    console.log(`Round best Player's balance after: ${ethers.utils.formatEther(roundBestPlayersBalance)} ETH`);
    // Best Player ever's balance and prize amount after
    bestPlayersEverBalance = await ethers.provider.getBalance(bestPlayerEver);
    console.log(`Best Player's ever balance after: ${ethers.utils.formatEther(bestPlayersEverBalance)} ETH`);
    // Developer's balance and tip amount after
    developersBalance = await ethers.provider.getBalance(developer);
    console.log(`Developer's balance after: ${ethers.utils.formatEther(developersBalance)} ETH`);

    console.log("-------------------------------------------------------");
}

finishRound()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
