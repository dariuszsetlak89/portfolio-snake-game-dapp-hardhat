const { network, deployments, ethers, getNamedAccounts, hardhatArguments } = require("hardhat");
const { assert, expect } = require("chai");

const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Token Unit Tests", function () {
          let deployer, player1, snakeGame, snakeTokenAddress, snakeToken, fruitTokenAddress, fruitToken;
          beforeEach(async () => {
              // Deploy smart contracts
              await deployments.fixture(["snakegame"]);
              // Get accounts: deployer, player
              deployer = (await getNamedAccounts()).deployer;
              player1 = (await getNamedAccounts()).player1;
              // Get contract: SnakeGame
              snakeGame = await ethers.getContract("SnakeGame", deployer);
              // Get contract: SnakeToken
              snakeTokenAddress = await snakeGame.i_snakeToken();
              snakeToken = await ethers.getContractAt("Token", snakeTokenAddress);
              // Get contract: FruitToken
              fruitTokenAddress = await snakeGame.i_fruitToken();
              fruitToken = await ethers.getContractAt("Token", fruitTokenAddress);
          });

          describe("decimals", async () => {
              it("should return number of token decimals", async () => {
                  decimals = await snakeToken.decimals();
                  // console.log("decimals:", decimals.toString());
                  expect(decimals).to.equal(0);
              });
          });

          describe("receive", async () => {
              it("should invoke the `receive` function and revert transaction with an error", async () => {
                  const [signer] = await ethers.getSigners();
                  const amount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeToken.address, data: "0x", value: amount });
                  await expect(tx).to.be.revertedWith("Token__ReceivedTransferReverted");
              });
          });

          describe("fallback", async () => {
              it("should invoke the `fallback` function and revert transaction with an error", async () => {
                  const [signer] = await ethers.getSigners();
                  const amount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeToken.address, data: "0x01", value: amount });
                  await expect(tx).to.be.revertedWith("Token__InvalidFunctionCall");
              });
          });
      });
