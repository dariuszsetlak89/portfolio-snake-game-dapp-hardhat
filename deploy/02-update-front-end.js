const { network } = require("hardhat");
require("dotenv").config();
const fs = require("fs");
const { frontEndContractsFile, frontEndAbiLocation } = require("../helper-hardhat-config");

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...");
        updateContractAddresses();
        updateAbi();
        console.log("Front end updated!");
    }
    console.log("-------------------------------------------------------");
};

async function updateContractAddresses() {
    // Get contract: SnakeGame
    const snakeGame = await ethers.getContract("SnakeGame");
    // Get contract: SnakeToken
    const snakeTokenAddress = await snakeGame.i_snakeToken();
    const snakeToken = await ethers.getContractAt("Token", snakeTokenAddress);
    // Get contract: FruitToken
    const fruitTokenAddress = await snakeGame.i_fruitToken();
    const fruitToken = await ethers.getContractAt("Token", fruitTokenAddress);
    // Get contract: SnakeNft
    const snakeNftAddress = await snakeGame.i_snakeNft();
    const snakeNft = await ethers.getContractAt("Nft", snakeNftAddress);
    // Get contract: SuperPetNft
    const superPetNftAddress = await snakeGame.i_superPetNft();
    const superPetNft = await ethers.getContractAt("Nft", superPetNftAddress);

    const chainId = network.config.chainId.toString();
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"));

    if (chainId in contractAddresses) {
        //// Update game contract addresses
        // SnakeGame address update
        const snakeGameChainAddress = contractAddresses[chainId]["SnakeGame"];
        if (!snakeGameChainAddress.includes(snakeGame.address)) {
            snakeGameChainAddress.pop();
            snakeGameChainAddress.push(snakeGame.address);
        }
        // SnakeToken address update
        const snakeTokenChainAddress = contractAddresses[chainId]["SnakeToken"];
        if (!snakeTokenChainAddress.includes(snakeToken.address)) {
            snakeTokenChainAddress.pop();
            snakeTokenChainAddress.push(snakeToken.address);
        }
        // FruitToken address update
        const fruitTokenChainAddress = contractAddresses[chainId]["FruitToken"];
        if (!fruitTokenChainAddress.includes(fruitToken.address)) {
            fruitTokenChainAddress.pop();
            fruitTokenChainAddress.push(fruitToken.address);
        }
        // SnakeNft address update
        const snakeNftChainAddress = contractAddresses[chainId]["SnakeNft"];
        if (!snakeNftChainAddress.includes(snakeNft.address)) {
            snakeNftChainAddress.pop();
            snakeNftChainAddress.push(snakeNft.address);
        }
        // SuperPetNft address update
        const superPetNftChainAddress = contractAddresses[chainId]["SuperPetNft"];
        if (!superPetNftChainAddress.includes(superPetNft.address)) {
            superPetNftChainAddress.pop();
            superPetNftChainAddress.push(superPetNft.address);
        }
    } else {
        //// Save game contract addresses
        contractAddresses[chainId] = {
            SnakeGame: [snakeGame.address],
            SnakeToken: [snakeToken.address],
            FruitToken: [fruitToken.address],
            SnakeNft: [snakeNft.address],
            SuperPetNft: [superPetNft.address],
        };
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
}

async function updateAbi() {
    // Get contract: SnakeGame
    snakeGame = await ethers.getContract("SnakeGame");
    // Get contract: SnakeToken
    snakeTokenAddress = await snakeGame.i_snakeToken();
    snakeToken = await ethers.getContractAt("Token", snakeTokenAddress);
    // Get contract: SnakeNft
    snakeNftAddress = await snakeGame.i_snakeNft();
    snakeNft = await ethers.getContractAt("Nft", snakeNftAddress);

    // Write to file
    fs.writeFileSync(`${frontEndAbiLocation}SnakeGame.json`, snakeGame.interface.format(ethers.utils.FormatTypes.json));
    fs.writeFileSync(`${frontEndAbiLocation}Token.json`, snakeToken.interface.format(ethers.utils.FormatTypes.json));
    fs.writeFileSync(`${frontEndAbiLocation}Nft.json`, snakeNft.interface.format(ethers.utils.FormatTypes.json));
}

module.exports.tags = ["all", "frontend"];
