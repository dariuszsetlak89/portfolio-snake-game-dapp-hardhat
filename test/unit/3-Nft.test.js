const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect, should } = require("chai");
const { expectRevert } = require("@openzeppelin/test-helpers");

const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Unit Tests", function () {
          beforeEach(async () => {
              // Deploy smart contracts
              await deployments.fixture(["SnakeGame"]);
              // Get accounts: deployer, player
              deployer = (await getNamedAccounts()).deployer;
              player1 = (await getNamedAccounts()).player1;
              // Get contract: SnakeGame
              snakeGame = await ethers.getContract("SnakeGame", deployer);
              // Get contract: SnakeNft
              snakeNftAddress = await snakeGame.s_snakeNft();
              snakeNft = await ethers.getContractAt("Nft", snakeNftAddress);
              // Get contract: SuperPetNft
              superPetNftAddress = await snakeGame.s_superPetNft();
              superPetNft = await ethers.getContractAt("Nft", superPetNftAddress);
          });

          describe("constructor", async () => {
              // Test for private function `_initializeContract. Works only if function visibility
              // is temporarly set to 'public'.
              //   it("should revert if `s_initialized` is `true`", async () => {
              //       const initialized = await snakeNft.getInitialized();
              //       console.log("initialized:", initialized.toString());
              //       const initialize = snakeNft._initializeContract([""]);
              //       await expect(initialize).to.be.revertedWith("Nft__AlreadyInitialized");
              //   });
          });

          describe("getInitialized", async () => {
              it("should return value of `s_initialized` variable", async () => {
                  const initialized = await snakeNft.getInitialized();
                  // console.log("initialized:", initialized);
                  assert.equal(initialized, true);
              });
          });

          describe("receive", async () => {
              it("should invoke the `receive` function and revert transaction with an error", async () => {
                  const [signer] = await ethers.getSigners();
                  const ethAmount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeNft.address, data: "0x", value: ethAmount });
                  await expect(tx).to.be.revertedWith("Nft__ReceivedEthTransferReverted");
              });
          });

          describe("fallback", async () => {
              it("should invoke the `fallback` function and revert transaction with an error", async () => {
                  const [signer] = await ethers.getSigners();
                  const ethAmount = ethers.utils.parseEther("1");
                  const tx = signer.sendTransaction({ to: snakeNft.address, data: "0x01", value: ethAmount });
                  await expect(tx).to.be.revertedWith("Nft__InvalidFunctionCall");
              });
          });
      });
