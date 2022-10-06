const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    // Constructor parameters
    const scoreToClaimNft = 50;

    // Deploy contract SnakeGame
    let args = [scoreToClaimNft];
    const snakeGame = await deploy("SnakeGame", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.waitBlockConfirmations || 1,
    });

    // Verify deployed contract on Etherscan
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(snakeToken.address, args);
    }

    log("-------------------------------------------------------");
};

module.exports.tags = ["all", "snakegame"];
