// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/* Imports */
import "./SnakeGame.sol";
import "./tokens/SnakeNft.sol";
import "./tokens/SuperNft.sol";
import "hardhat/console.sol";

/* Errors */
error GameNfts__NoNftAwardsToClaim(address player);
error GameNfts__NoSuperNftToClaim(address player);

contract GameNfts is SnakeGame {
    /* Structs */
    struct SnakeNftData {
        string name;
        string symbol;
        string[] uri;
        uint256 mintFee;
    }

    struct SuperNftData {
        string name;
        string symbol;
        string[] uri;
        uint256 mintFee;
    }

    /* Events */
    event SuperNftUnlocked(address indexed player);

    /* Mappings */

    /* Variables */
    SnakeNft public s_snakeNft;
    SuperNft public s_superNft;
    SnakeNftData public s_snakeNftData;
    SuperNftData public s_superNftData;

    /* Modifiers */

    ////////////////////
    //  Constructor   //
    ////////////////////

    constructor(SnakeNftData memory snakeNftData, SuperNftData memory superNftData) {
        s_snakeNftData = snakeNftData;
        s_superNftData = superNftData;

        // Deploy NFTs' contracts
        s_snakeNft = new SnakeNft(s_snakeNftData.name, s_snakeNftData.symbol, s_snakeNftData.uri);
        s_superNft = new SuperNft(superNftData.name, superNftData.symbol, superNftData.uri);
    }

    ////////////////////
    // Main Functions //
    ////////////////////

    // Function: Claim NFT award
    function snakeNftClaim() external nonReentrant isPlayer {
        uint256 nftAmountToClaim = s_players[s_player].numberOfSnakeNftsToClaim;
        // Check if player has SnakeNft to claim
        if (nftAmountToClaim < 1) {
            revert GameNfts__NoNftAwardsToClaim(s_player);
        }
        // Mint one or more snakeNfts
        for (uint8 i = 1; i <= nftAmountToClaim; i++) {
            uint256 snakeNftUriIndex = randomNumber(s_snakeNftData.uri.length);
            s_snakeNft.safeMint(s_player, snakeNftUriIndex);
        }
        // Set superNft claim
        if (s_snakeNft.balanceOf(s_player) >= NFT_OWN_TO_CLAIM_SUPER_NFT) {
            s_players[s_player].superNftAwardFlag = true;
            emit SuperNftUnlocked(s_player);
        }
    }

    // Function: Claim Super NFT award
    function superNftClaim() external nonReentrant isPlayer {
        bool superNftClaimFlag = s_players[s_player].superNftAwardFlag;
        // Check if player has superNft to claim
        if (superNftClaimFlag != true) {
            revert GameNfts__NoSuperNftToClaim(s_player);
        }
        // Mint superNft
        // uint256 superNftUriIndex = randomNumber(s_superNftData.uri.length);
        // s_superNft.safeMint(s_player, superNftUriIndex);
    }

    function randomNumber(uint256 range) public view returns (uint256) {
        uint256 random = uint256(
            keccak256(abi.encodePacked(msg.sender, block.difficulty, block.timestamp))
        ) % range;
        return random;
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    function getGameNftsContractAddress() external view returns (address) {
        return address(this);
    }

    function getSnakeNftContractAddress() external view returns (address) {
        return address(s_snakeNft);
    }

    function getSuperNftContractAddress() external view returns (address) {
        return address(s_superNft);
    }

    function getGameNftsEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
