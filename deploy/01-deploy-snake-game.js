const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("-------------------------------------------------------");

    // Constructor parameters

    // Authorized caller address
    // const authorizedCallerAddress = "0x0000000000000000000000000000000000000000";

    // Snake Token imputs
    const snakeTokenName = "Snake Token";
    const snakeTokenSymbol = "SNAKE";
    // Fruit Token inputs
    const fruitTokenName = "Fruit Token";
    const fruitTokenSymbol = "FRUIT";
    // Snake NFT inputs
    const snakeNftName = "Snake NFT";
    const snakeNftSymbol = "SNFT";
    const snakeNftUris = ["snakeNftUri0", "snakeNftUri1", "snakeNftUri2"];
    // Super Pet NFT inputs
    const superPetNftName = "Super Pet NFT";
    const superPetNftSymbol = "SPET";
    const superPetNftUris = ["superPetNftUri0", "superPetNftUri1", "superPetNftUri2"];

    // Deployment arguments array
    const args = [
        // authorizedCallerAddress,
        snakeTokenName,
        snakeTokenSymbol,
        fruitTokenName,
        fruitTokenSymbol,
        snakeNftName,
        snakeNftSymbol,
        snakeNftUris,
        superPetNftName,
        superPetNftSymbol,
        superPetNftUris,
    ];

    // Deploy `SnakeGame` contract
    const snakeGame = await deploy("SnakeGame", {
        from: deployer,
        args: args,
        log: true,
        // gasLimit: 4000000,
        autoMine: true, // speed up deployment on local network, no effect on live networks
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    // Verify deployed contract on Etherscan
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(snakeGame.address, args);
    }

    log("-------------------------------------------------------");
};

module.exports.tags = ["all", "snakegame"];
