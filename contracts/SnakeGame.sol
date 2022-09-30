// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./tokens/SnakeToken.sol";
import "./tokens/FruitToken.sol";

contract SnakeGame {
    /* Structs */
    struct PlayerData {
        bool snakeTokensCollected;
        bool gameStartedFlag;
        uint8 numberOfPaidGames;
        uint8 numberOfGamesPlayed;
        uint256 fruitTokensToClaim;
        uint8 nftAwardsToClaim;
        bool superNtfAwardsToClaim;
    }

    /* Mappings */
    mapping(address => PlayerData) private players;

    /* Variables */
    SnakeToken public snakeToken;
    FruitToken public fruitToken;
    uint8 public constant SNAKE_GAME_FEE = 1;
    uint8 public constant SNAKE_TOKEN_AIRDROP = 10;
    address private player;

    /* Errors */
    error SnakeGame__SnakeTokenBalanceTooLow(uint256 requiredSnakeBalance);
    error SnakeGame__GameFundingFailed();
    error SnakeGame__NoGamesFunded();
    error SnakeGame__PlayerDidNotPlaySnakeGame();
    error SnakeGame__NoFruitTokensToClaim();
    error SnakeGame__SnakeTokensAlreadyClaimed();

    /* Events */
    event GameFunded(address indexed player, uint8 indexed numberOfGamesFunded);
    event GameStarted(address indexed player);
    event GameOver(address indexed player);
    event FruitTokensClaimed(address indexed player);
    event SnakeTokensClaimed(address indexed player);

    /* Functions */
    constructor() {
        snakeToken = new SnakeToken();
        fruitToken = new FruitToken();
    }

    function gameStart() public {
        player = msg.sender;
        if (players[player].numberOfPaidGames < 1) {
            revert SnakeGame__NoGamesFunded();
        }
        players[player].gameStartedFlag = true;
        players[player].numberOfPaidGames--;
        emit GameStarted(player);
    }

    function fundGame(uint8 _numberOfGames) public {
        player = msg.sender;
        // Check if player have anough SNAKE to pay a fee
        uint256 chargedFee = _numberOfGames * SNAKE_GAME_FEE;
        if (snakeToken.balanceOf(player) < chargedFee) {
            revert SnakeGame__SnakeTokenBalanceTooLow(chargedFee);
        }
        // Transfer SNAKE tokens to contract address
        bool fundStatus = snakeToken.transferFrom(player, address(this), chargedFee);
        if (!fundStatus) {
            revert SnakeGame__GameFundingFailed();
        }
        snakeToken.burn(SNAKE_GAME_FEE);
        players[player].numberOfPaidGames += _numberOfGames;
        // Emit event GameFunded
        emit GameFunded(player, _numberOfGames);
    }

    function gameOver(uint256 _score) public {
        player = msg.sender;
        // Check if player played the game
        if (players[player].gameStartedFlag == false) {
            revert SnakeGame__PlayerDidNotPlaySnakeGame();
        }
        players[player].gameStartedFlag = false;
        players[player].numberOfGamesPlayed += 1;
        players[player].fruitTokensToClaim += _score;
        emit GameOver(player);
    }

    function fruitTokenClaim() public {
        player = msg.sender;
        // Check if player has FRUIT to claim
        if (players[player].fruitTokensToClaim < 1) {
            revert SnakeGame__NoFruitTokensToClaim();
        }
        fruitToken.mint(player, players[player].fruitTokensToClaim);
        players[player].fruitTokensToClaim = 0;
        // Emit event FruitTokensClaimed
        emit FruitTokensClaimed(player);
    }

    function snakeTokenClaim() public {
        player = msg.sender;
        // Check if player didn't claimed SNAKE airdrop before
        if (players[player].snakeTokensCollected == true) {
            revert SnakeGame__SnakeTokensAlreadyClaimed();
        }
        snakeToken.mint(player, SNAKE_TOKEN_AIRDROP);
        players[player].snakeTokensCollected = true;
        // Emit event FruitTokensClaimed
        emit SnakeTokensClaimed(player);
    }

    function getPlayerData(address _player) public view returns (PlayerData memory) {
        return players[_player];
    }
}
