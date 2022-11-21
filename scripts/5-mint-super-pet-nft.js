const { ethers } = require("hardhat");

async function mintSuperPetNft() {
    let deployer,
        player1,
        snakeGame,
        snakeTokenAddress,
        snakeToken,
        snakeNftAddress,
        snakeNft,
        superPetNftAddress,
        superPetNft,
        snakeNftBalance,
        superPetNftClaimFlag,
        mintedSuperPetNfts,
        superPetNftBalance;

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
    // Get contract: SnakeNft
    snakeNftAddress = await snakeGame.i_snakeNft();
    snakeNft = await ethers.getContractAt("Nft", snakeNftAddress, PLAYER);
    // Get contract: SuperPetNft
    superPetNftAddress = await snakeGame.i_superPetNft();
    superPetNft = await ethers.getContractAt("Nft", superPetNftAddress, PLAYER);

    console.log("-------------------------------------------------------");

    console.log("!!! MINT SUPER PET NFT !!!");

    // Current Player
    console.log(`Current PLAYER: ${PLAYER}`);
    // Super Pet NFT claim flag before
    superPetNftClaimFlag = (await snakeGame.getPlayerData(PLAYER)).superPetNftClaimFlag;
    console.log(`Super Pet NFT claim flag before: ${superPetNftClaimFlag.toString()}`);
    // Super Pet NFT mint fee
    mintFee = await snakeGame.i_superPetNftMintFee();
    console.log(`Super Pet NFT mint fee: ${ethers.utils.formatEther(mintFee)} ETH`);
    // Snake NFT balance before
    snakeNftBalance = await snakeNft.balanceOf(PLAYER);
    console.log(`Snake NFT balance before: ${snakeNftBalance.toString()}`);
    // Approve `SnakeGame` contract to burn gameFee amount of Snake NFTs
    await snakeNft.setApprovalForAll(snakeGame.address, true);

    console.log("---");

    // MINT SUPER PET NFT
    await snakeGame.mintSuperPetNft({ value: mintFee.toString() });
    console.log("SUPER PET NFT MINTED!");

    console.log("---");

    // Super Pet NFT claim flag after
    superPetNftClaimFlag = (await snakeGame.getPlayerData(PLAYER)).superPetNftClaimFlag;
    console.log(`Super Pet NFT claim flag after: ${superPetNftClaimFlag.toString()}`);
    // Minted Super Pet NFTs amount parameter
    mintedSuperPetNfts = (await snakeGame.getPlayerData(PLAYER)).mintedSuperPetNfts;
    console.log(`Minted Super Pet NFTs amount parameter: ${mintedSuperPetNfts.toString()}`);
    // Snake NFT balance after
    snakeNftBalance = await snakeNft.balanceOf(PLAYER);
    console.log(`Snake NFT balance after: ${snakeNftBalance.toString()}`);
    // Super Pet NFT balance after
    superPetNftBalance = await superPetNft.balanceOf(PLAYER);
    console.log(`Super Pet NFT balance: ${superPetNftBalance.toString()}`);

    console.log("-------------------------------------------------------");
}

mintSuperPetNft()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
