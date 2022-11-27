const { ethers } = require("hardhat");

async function gameOver() {
    let deployer,
        player1,
        snakeGame,
        snakeTokenAddress,
        snakeToken,
        snakeNftAddress,
        snakeNft,
        superPetNftAddress,
        superPetNft,
        gameStartedFlag,
        playersGamesPlayed,
        playersLastScore,
        playersBestScore,
        currentRound,
        roundGamesPlayed,
        roundBestPlayer,
        roundHighestScore,
        mintedSnakeNfts,
        snakeNftBalance,
        superPetNftClaimFlag;

    // Get accounts: deployer, player
    deployer = (await getNamedAccounts()).deployer;
    player1 = (await getNamedAccounts()).player1;

    //////////////////////////////////////////
    // Set PLAYER: deployer, player1
    const PLAYER = deployer;
    //////////////////////////////////////////

    /////////////////////////
    // Set game score:
    const GAME_SCORE = 1000;
    /////////////////////////

    // Get contract: SnakeGame
    snakeGame = await ethers.getContract("SnakeGame", PLAYER);
    // Get contract: SnakeToken
    snakeTokenAddress = await snakeGame.i_snakeToken();
    snakeToken = await ethers.getContractAt("Token", snakeTokenAddress, PLAYER);
    // Get contract: SnakeNft
    snakeNftAddress = await snakeGame.i_snakeNft();
    snakeNft = await ethers.getContractAt("Nft", snakeNftAddress, PLAYER);
    // Get contract: SuperPetNft
    superPetNftAddress = await snakeGame.i_superPetNft();
    superPetNft = await ethers.getContractAt("Nft", superPetNftAddress, PLAYER);

    console.log("-------------------------------------------------------");

    console.log("!!! GAME OVER !!!");

    // Current Player
    console.log(`Current PLAYER: ${PLAYER}`);
    // Game started flag before
    gameStartedFlag = (await snakeGame.getPlayerData(PLAYER)).gameStartedFlag;
    console.log("Game started flag before:", gameStartedFlag.toString());

    console.log("---");

    // GAME OVER
    await snakeGame.gameOver(GAME_SCORE);
    console.log("GAME OVER!");

    console.log("---");

    //// Player's game data
    // Game started flag
    gameStartedFlag = (await snakeGame.getPlayerData(PLAYER)).gameStartedFlag;
    console.log("Game started flag after:", gameStartedFlag.toString());
    // Games played by Player
    playersGamesPlayed = (await snakeGame.getPlayerData(PLAYER)).playerGamesPlayed;
    console.log("Games played by Player:", playersGamesPlayed.toString());
    // Last Player's score
    playersLastScore = (await snakeGame.getPlayerData(PLAYER)).playerLastScore;
    console.log("Last score:", playersLastScore.toString());
    // Best Player's score
    playersBestScore = (await snakeGame.getPlayerData(PLAYER)).playerBestScore;
    console.log("Best score:", playersBestScore.toString());

    //// Global game data
    // Current game round
    currentRound = await snakeGame.getGameRound();
    console.log("Current game round number:", currentRound.toString());
    // Games played in this game round
    roundGamesPlayed = (await snakeGame.getGameRoundData(currentRound)).roundGamesPlayed;
    console.log("Round games played:", roundGamesPlayed.toString());
    // Best player in this game round
    roundBestPlayer = (await snakeGame.getGameRoundData(currentRound)).roundBestPlayer;
    console.log("Round best player:", roundBestPlayer.toString());
    // Highest score in this game round
    roundHighestScore = (await snakeGame.getGameRoundData(currentRound)).roundHighestScore;
    console.log("Round best score:", roundHighestScore.toString());

    //// Player's NFTs data
    // Minted Snake NFTs amount parameter
    mintedSnakeNfts = (await snakeGame.getPlayerData(PLAYER)).mintedSnakeNfts;
    console.log(`Minted Snake NFTs amount: ${mintedSnakeNfts.toString()}`);
    // Snake NFT balance
    snakeNftBalance = await snakeNft.balanceOf(PLAYER);
    console.log(`Snake NFT balance: ${snakeNftBalance.toString()}`);
    // Super Pet NFT claim status
    superPetNftClaimFlag = (await snakeGame.getPlayerData(PLAYER)).superPetNftClaimFlag;
    console.log(`Super Pet NFT claim flag: ${superPetNftClaimFlag.toString()}`);

    console.log("-------------------------------------------------------");
}

gameOver()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
