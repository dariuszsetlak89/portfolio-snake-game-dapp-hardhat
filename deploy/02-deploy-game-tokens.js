const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { string } = require("hardhat/internal/core/params/argumentTypes");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    // Constructor parameters

    const snakeNftUris = [
        "Snake NFT URI 1",
        "Snake NFT URI 2",
        "Snake NFT URI 3",
        "Snake NFT URI 4",
        "Snake NFT URI 5",
        "Snake NFT URI 6",
        "Snake NFT URI 7",
        "Snake NFT URI 8",
        "Snake NFT URI 9",
        "Snake NFT URI 10",
    ];

    const superPetNftUris = [
        "Super Pet NFT URI 1",
        "Super Pet NFT URI 2",
        "Super Pet NFT URI 3",
        "Super Pet NFT URI 4",
        "Super Pet NFT URI 5",
        "Super Pet NFT URI 6",
        "Super Pet NFT URI 7",
        "Super Pet NFT URI 8",
        "Super Pet NFT URI 9",
        "Super Pet NFT URI 10",
    ];

    const snakeTokenData = {
        tokenName: "Snake Token",
        tokenSymbol: "SNAKE",
    };

    const fruitTokenData = {
        tokenName: "Fruit Token",
        tokenSymbol: "FRUIT",
    };

    const snakeNftTokenData = {
        tokenName: "Snake NFT",
        tokenSymbol: "SNFT",
        tokenUris: snakeNftUris,
    };

    const superPetNftTokenData = {
        tokenName: "Super Pet NFT",
        tokenSymbol: "SPET",
        tokenUris: superPetNftUris,
    };

    // Deploy contract SnakeGame
    const args = [
        snakeTokenData.tokenName,
        snakeTokenData.tokenSymbol,
        fruitTokenData.tokenName,
        fruitTokenData.tokenSymbol,
        snakeNftTokenData.tokenName,
        snakeNftTokenData.tokenSymbol,
        snakeNftTokenData.tokenUris,
        superPetNftTokenData.tokenName,
        superPetNftTokenData.tokenSymbol,
        superPetNftTokenData.tokenUris,
    ];

    const gameTokens = await deploy("GameTokens", {
        from: deployer,
        args: args,
        log: true,
        // gasLimit: 4000000,
        autoMine: true, // speed up deployment on local network, no effect on live networks
        waitConfirmations: network.config.waitBlockConfirmations || 1,
    });

    // Verify deployed contract on Etherscan
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(snakeToken.address, args);
    }

    log("-------------------------------------------------------");
};

module.exports.tags = ["all", "GameTokens"];
