const { developmentChains } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    // Deploy contract SnakeGame
    const args = [];
    const snakeGame = await deploy("SnakeGame", {
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

module.exports.tags = ["all", "SnakeGame"];
