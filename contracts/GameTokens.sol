// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/* Imports */
import "./SnakeGame.sol";
import "./tokens/SnakeToken.sol";
import "./tokens/FruitToken.sol";

/* Errors */
error GameTokens__SnakeTokenBalanceTooLow(uint256 requiredSnakeBalance);
error GameTokens__FundGame_GameFundingFailed(
    address player,
    address gameTokensContract,
    uint256 amount
);
error GameTokens__NoFruitTokensToClaim(address player);
error GameTokens__SnakeTokensAlreadyClaimed(address player);
error GameTokens__TokenSwap_FruitTransferFailed(
    address player,
    address gameTokensContract,
    uint256 amount
);
error GameTokens__NotEnoughEthSent(uint256 ethSent, uint256 ethRequied);

contract GameTokens is SnakeGame {
    /* Events */
    event SnakeTokensClaimed(address indexed player);
    event SnakeTokensBought(address indexed player, uint256 snakeAmount);
    event GameFunded(address indexed player, uint8 indexed numberOfGamesFunded);
    event FruitTokensClaimed(address indexed player);
    event FruitsToSnakeSwapped(
        address indexed player,
        uint256 indexed fruitAmount,
        uint256 indexed snakeAmount
    );

    /* Mappings */

    /* Variables */
    SnakeToken public s_snakeToken;
    FruitToken public s_fruitToken;
    uint8 private constant SNAKE_TOKEN_AIRDROP = 5;
    uint8 private constant SNAKE_GAME_FEE = 1;
    uint8 private constant FRUIT_SNAKE_RATE = 10; // 10 FRUIT => 1 SNAKE
    uint8 private constant SNAKE_ETH_RATE = 100; // 1 ETH => 100 SNAKE

    /* Modifiers */

    /* Constructor */
    constructor() {
        s_snakeToken = new SnakeToken();
        s_fruitToken = new FruitToken();
    }

    ////////////////////
    // Main Functions //
    ////////////////////

    // Function: Claim free SnakeTokens airdrop for new players
    function snakeAirdropClaim() external nonReentrant isPlayer {
        // Check if player didn't claimed SNAKE airdrop before
        if (s_players[s_player].snakeAirdropCollected == true) {
            revert GameTokens__SnakeTokensAlreadyClaimed(s_player);
        }
        // Mint SnakeToken airdrop tokens to player account
        s_snakeToken.mint(s_player, SNAKE_TOKEN_AIRDROP);
        s_players[s_player].snakeAirdropCollected = true;
        emit SnakeTokensClaimed(s_player);
    }

    // Function: Buy SnakeTokens for ETH
    function buySnakeTokens(uint256 _snakeAmount) external payable nonReentrant isPlayer {
        // One way exchange: ETH -> Snake Token
        uint256 ethPayment = _snakeAmount / SNAKE_ETH_RATE;
        if (msg.value < ethPayment) {
            revert GameTokens__NotEnoughEthSent(msg.value, ethPayment);
        }
        // Mint bought SnakeTokens to player account
        s_snakeToken.mint(s_player, _snakeAmount);
        emit SnakeTokensBought(s_player, _snakeAmount);
    }

    // Function: Fund game contract using SnakeTokens to play the game
    function fundGame(uint8 _numberOfGames) external nonReentrant isPlayer {
        uint256 chargedFee = _numberOfGames * SNAKE_GAME_FEE;
        // Check if player have anough SNAKE to pay a fee
        if (s_snakeToken.balanceOf(s_player) < chargedFee) {
            revert GameTokens__SnakeTokenBalanceTooLow(chargedFee);
        }
        // Transfer SNAKE tokens to contract address
        bool fundStatus = s_snakeToken.transferFrom(s_player, address(this), chargedFee);
        if (!fundStatus) {
            revert GameTokens__FundGame_GameFundingFailed(s_player, address(this), chargedFee);
        }
        // Burn SNAKE tokens by SnakeGame contract
        s_snakeToken.burn(chargedFee);
        s_players[s_player].numberOfPaidGames += _numberOfGames;
        emit GameFunded(s_player, _numberOfGames);
    }

    // Function: Claim FruitTokens earned in the game
    function fruitTokenClaim() external nonReentrant isPlayer {
        // Check if player has FRUIT to claim
        if (s_players[s_player].fruitTokensToClaim < 1) {
            revert GameTokens__NoFruitTokensToClaim(s_player);
        }
        // Mint FRUIT tokens for player account
        s_fruitToken.mint(s_player, s_players[s_player].fruitTokensToClaim);
        s_players[s_player].fruitTokensToClaim = 0;
        emit FruitTokensClaimed(s_player);
    }

    // Function: One way token swap: Fruit Token -> Snake Token
    function tokenSwap(uint256 _fruitAmount) external nonReentrant isPlayer {
        uint256 snakeAmount = _fruitAmount / FRUIT_SNAKE_RATE;
        // Transfer FRUIT to SnakeGame contract
        bool fruitTransferStatus = s_fruitToken.transferFrom(s_player, address(this), _fruitAmount);
        if (!fruitTransferStatus) {
            revert GameTokens__TokenSwap_FruitTransferFailed(s_player, address(this), _fruitAmount);
        }
        // Mint SNAKE tokens for player account
        s_snakeToken.mint(s_player, snakeAmount);
        // Burn received FRUIT tokens by SnakeGame contract
        s_fruitToken.burn(_fruitAmount);
        emit FruitsToSnakeSwapped(s_player, _fruitAmount, snakeAmount);
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    function getGameTokensContractAddress() external view returns (address) {
        return address(this);
    }

    function getSnakeTokenContractAddress() external view returns (address) {
        return address(s_snakeToken);
    }

    function getFruitTokenContractAddress() external view returns (address) {
        return address(s_fruitToken);
    }

    function getSnakeAirdropAmount() external pure returns (uint8) {
        return SNAKE_TOKEN_AIRDROP;
    }

    function getSnakeGameFee() external pure returns (uint8) {
        return SNAKE_GAME_FEE;
    }

    function getFruitSnakeRate() external pure returns (uint8) {
        return FRUIT_SNAKE_RATE;
    }

    function getSnakeEthRate() external pure returns (uint8) {
        return SNAKE_ETH_RATE;
    }

    function getGameTokensEthBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
