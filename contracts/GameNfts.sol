// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/* Imports */
import "./SnakeGame.sol";
import "./nfts/SnakeNft.sol";
import "./nfts/SuperPetNft.sol";

/* Errors */
error GameNfts__NoNftAwardsToClaim(address player);
error GameNfts__NoSuperPetNtfToClaim(address player);

contract GameNfts is SnakeGame {
    /* Structs */

    /* Events */
    event SuperPetNftUnlocked(address indexed player);

    /* Mappings */

    /* Variables */
    SnakeNft public s_snakeNft;
    SuperPetNft public s_superPetNft;

    /* Modifiers */

    /* Constructor */
    constructor() {
        s_snakeNft = new SnakeNft();
        s_superPetNft = new SuperPetNft();
    }

    ////////////////////
    // Main Functions //
    ////////////////////

    // Function: Claim NFT award
    function snakeNftClaim() external nonReentrant isPlayer {
        uint8 ntfAmountToClaim = s_players[s_player].nftAwardsToClaim;
        // Check if player has SnakeNft to claim
        if (ntfAmountToClaim < 1) {
            revert GameNfts__NoNftAwardsToClaim(s_player);
        }
        // Mint one or more snakeNfts
        for (uint8 i = 1; i <= ntfAmountToClaim; i++) {
            s_snakeNft.safeMint(s_player);
        }
        // Set SuperPetNtf claim
        if (
            s_players[s_player].nftAwardsToClaim == MAX_NUMBER_NFT_AWARDS &&
            s_snakeNft.balanceOf(s_player) >= MAX_NUMBER_NFT_AWARDS
        ) {
            s_players[s_player].superPetNftAwardFlag = true;
            emit SuperPetNftUnlocked(s_player);
        }
    }

    // Function: Claim Super NFT award
    function superPetNftClaim() external nonReentrant isPlayer {
        bool superPetNftClaimFlag = s_players[s_player].superPetNftAwardFlag;
        // Check if player has SuperPetNtf to claim
        if (superPetNftClaimFlag != true) {
            revert GameNfts__NoSuperPetNtfToClaim(s_player);
        }
        // Mint superPetNft
        s_superPetNft.safeMint(s_player);
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

    function getSuperPetNftContractAddress() external view returns (address) {
        return address(s_superPetNft);
    }

    function getGameNftsEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
