require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "https://eth-goerli/";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

module.exports = {
    solidity: "0.8.17",
    defaultNetwork: "hardhat",
    paths: {
        deploy: "deploy",
        deployments: "deployments",
    },
    networks: {
        localhost: {
            live: false,
            saveDeployments: true,
            tags: ["local"],
            chainId: 31337,
        },
        hardhat: {
            live: false,
            saveDeployments: true,
            tags: ["test", "local"],
            chainId: 31337,
            blockConfirmations: 1,
        },
        goerli: {
            live: true,
            saveDeployments: true,
            tags: ["staging", "live"],
            chainId: 5,
            url: GOERLI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            blockConfirmations: 6,
        },
    },
    etherscan: {
        apiKey: "ETHERSCAN_API_KEY",
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS ? true : false,
        outputFile: "gas-report.txt",
        currency: "USD",
        noColors: true,
        token: "ETH", // ETH (default), BNB, MATIC, AVAX
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: 0,
        player1: 1,
        player2: 2,
        player3: 3,
    },
    mocha: {
        timeout: 200000, // 200 seconds max
    },
};
