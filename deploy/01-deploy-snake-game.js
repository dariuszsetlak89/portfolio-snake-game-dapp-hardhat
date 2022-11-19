const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");
const { BigNumber } = require("ethers");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("-------------------------------------------------------");

    // Constructor parameters

    // Snake NFT URI data array
    const snakeNftUris = [
        "snakeNftUri0",
        "snakeNftUri1",
        "snakeNftUri2",
        "snakeNftUri3",
        "snakeNftUri4",
        "snakeNftUri5",
        "snakeNftUri6",
        "snakeNftUri7",
        "snakeNftUri8",
        "snakeNftUri9",
    ];
    // Super Pet NFT URI data array
    const superPetNftUris = [
        "superPetNftUri0",
        "superPetNftUri1",
        "superPetNftUri2",
        "superPetNftUri3",
        "superPetNftUri4",
        "superPetNftUri5",
        "superPetNftUri6",
        "superPetNftUri7",
        "superPetNftUri8",
        "superPetNftUri9",
    ];
    // Game immutable parameters
    const scoreRequired = 100;
    const snakeNftRequired = 5;
    const snakeExchangeRate = ethers.utils.parseEther("0.01"); // Goerli TESTNET: 0.01 ETH = 1e16
    const superPetNftMintFee = ethers.utils.parseEther("0.1"); // Goerli TESTNET: 0.1 ETH = 1e17

    // Deployment arguments array
    const args = [
        // NFT's URI data arrays
        snakeNftUris,
        superPetNftUris,
        // Game immutable parameters
        scoreRequired,
        snakeNftRequired,
        snakeExchangeRate,
        superPetNftMintFee,
    ];

    // Deploy `SnakeGame` contract
    const snakeGame = await deploy("SnakeGame", {
        from: deployer,
        args: args,
        log: true,
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
