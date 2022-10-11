const { ethers, network } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");
const { developmentChains } = require("../helper-hardhat-config");

const TOKEN_ID = 2;

// Choose dogContractName (uncomment):
// const dogContractName = "BasicNftDogPug";
// const dogContractName = "BasicNftDogShibaInu";
const dogContractName = "BasicNftDogStBernard";

async function gameStart() {
    const nftMarketplace = await ethers.getContract("NftMarketplace");
    const basicNft = await ethers.getContract(dogContractName);
    const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID);
    const price = listing.price.toString();
    const tx = await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: price });
    await tx.wait(1);
    console.log(`NFT Bought! TokenID: ${TOKEN_ID}, NFT address: ${basicNft.address}`);
    if (developmentChains.includes(network.name)) {
        await moveBlocks(1, (sleepAmount = 1000));
    }
}

buyItem()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
