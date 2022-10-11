const { getNamedAccounts } = require("hardhat");

async function playSnakeGame() {
    console.log(`!!! Script: 10-play-snake-game !!!`);

    ////////////////////////////
    //  Game call parameters  //
    ////////////////////////////

    // Deployer and players accounts
    const { deployer, player1, player2, player3 } = await getNamedAccounts();

    // Game parameters - only for information, not used in script
    const snakeAirdropAmount = 10; // 10 SNAKE
    const gameCreditBaseFee = 5; // [5, 3, 1] SNAKE fee for 1 game credit, depends on game level
    const scoreToClaimNft = 50; // 50 score to claim 1 SNFT
    const snakeEthRate = 100; // 100 SNAKE for 1 ETH
    const fruitSnakeRate = 20; // 20 FRUIT for 1 SNAKE
    const superPetNftFruitFee = 200; // 200 FRUIT for NPET mint + 5 SNFT burn

    // Player1 game parameters
    const player1_creditsNumber1 = 2;
    const player1_score1 = 60;
    const player1_creditsNumber2 = 1;
    const player1_score2 = 40;
    const player1_swapAmount3 = 100;
    const player1_score3 = 70;
    const player1_snakeAmount4 = 15;
    const player1_creditsNumber4 = 3;
    const player1_score4 = 80;
    const player1_score5 = 50;
    const player1_score6 = 50;
    const player1_score7 = 100;
    const player1_creditsNumber7 = 1;
    const player1_swapAmount7 = 100;

    ///////////////////////////
    //  Game functions call  //
    ///////////////////////////

    // 1) Snake Game Smart Contracts deployments
    deployContracts(deployer);

    console.log("------------------------------------------------------------------------");

    // 2) Player1 gameplay - game level1: SPET = 0 => gameCreditFee = gameCreditFees[1] = 5
    // First play
    console.log("Player1: Game Play 1");
    snakeAirdropClaim(); // SNAKE = 10
    tokensApprovals(player1);
    buyCredits(creditsNumber1); // gameCredits = 2
    gameStart(player1); // gameCredits = 1
    gameOver(player1, score1); // FRUIT = 60
    snakeNftClaim(player1); // SNFT = 1
    gameStats(player1); // Game stats: gameCredits = 1, SNAKE = 0, FRUIT = 60, SNFT = 1, SPET = 0

    // Second play
    console.log("Player1: Game Play 2");
    gameStart(player1); // gameCredits = 0
    gameOver(player1, score2); // FRUIT = 40
    gameStats(player1); // Game stats: gameCredits = 0, SNAKE = 0, FRUIT = 100, SNFT = 1, SPET = 0

    // Third play
    console.log("Player1: Game Play 3");
    tokenSwap(player1, swapAmount3); // FRUIT = 0, SNAKE = 5
    buyCredits(creditsNumber2); // gameCredits = 1, SNAKE = 0
    gameStart(player1); // gameCredits = 0, SNAKE = 0
    gameOver(player1, score3); // FRUIT = 70
    snakeNftClaim(player1); // SNFT = 2
    gameStats(player1); // Game stats: gameCredits = 0, SNAKE = 0, FRUIT = 70, SNFT = 2, SPET = 0

    // Fourth play
    console.log("Player1: Game Play 4");
    buySnake(player1, snakeAmount4); // SNAKE = 15
    buyCredits(creditsNumber4); // gameCredits = 3, SNAKE = 0
    gameStart(player1); // gameCredits = 2
    gameOver(player1, score4); // FRUIT = 150
    snakeNftClaim(player1); // SNFT = 3
    gameStats(player1); // Game stats: gameCredits = 2, SNAKE = 0, FRUIT = 150, SNFT = 3, SPET = 0

    // Fifth play
    console.log("Player1: Game Play 5");
    gameStart(player1); // gameCredits = 1, SNAKE = 0
    gameOver(player1, score5); // FRUIT = 200
    gameStats(player1); // Game stats: gameCredits = 1, SNAKE = 0, FRUIT = 200, SNFT = 3, SPET = 0

    // Sixth play
    console.log("Player1: Game Play 6");
    gameStart(player1); // gameCredits = 0, SNAKE = 0
    gameOver(player1, score6); // FRUIT = 300
    gameStats(player1); // Game stats: gameCredits = 1, SNAKE = 0, FRUIT = 300, SNFT = 3, SPET = 0

    // Seventh play
    console.log("Player1: Game Play 7");
    tokenSwap(player1, swapAmount7); // FRUIT = 200, SNAKE = 5
    buyCredits(creditsNumber7); // gameCredits = 1, SNAKE = 0
    gameStart(player1); // gameCredits = 1, SNAKE = 0
    gameOver(player1, score7); // FRUIT = 400
    snakeNftClaim(player1); // SNFT = 6
    superPetNftClaim(player1); // FRUIT = 200, SNFT = 1, SPET = 1
    gameStats(player1); // Game stats: gameCredits = 1, SNAKE = 0, FRUIT = 200, SNFT = 1, SPET = 1 - game level2

    console.log("------------------------------------------------------------------------");
}

playSnakeGame()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
