// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/* Imports */
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./tokens/SnakeToken.sol";
import "./tokens/FruitToken.sol";
import "./nfts/SnakeNft.sol";
import "./nfts/SuperPetNft.sol";

/* Errors */
error SnakeGame__SnakeTokenBalanceTooLow(uint256 requiredSnakeBalance);
error SnakeGame__FundGame_GameFundingFailed(
    address player,
    address snakeGameContract,
    uint256 amount
);
error SnakeGame__NoGamesFunded(address player);
error SnakeGame__PlayerDidNotPlaySnakeGame(address player);
error SnakeGame__NoFruitTokensToClaim(address player);
error SnakeGame__SnakeTokensAlreadyClaimed(address player);
error SnakeGame__TokenSwap_FruitTransferFailed(
    address player,
    address snakeGameContract,
    uint256 amount
);
error SnakeGame__EthWithdrawalFailed(address owner, uint256 amount);
error SnakeGame__NotEnoughEthSent(uint256 ethSent, uint256 ethRequied);
error SnakeGame__NoNftAwardsToClaim(address player);
error SnakeGame__NoSuperPetNtfToClaim(address player);
error SnakeGame__CalledFunctionDoesNotExist();

contract SnakeGame is Ownable, ReentrancyGuard {
    /* Structs */
    struct PlayerData {
        bool snakeAirdropCollected;
        bool gameStartedFlag;
        uint8 numberOfPaidGames;
        uint256 fruitTokensToClaim;
        uint8 nftAwardsToClaim;
        bool superPetNftAwardFlag;
    }

    struct PlayerStats {
        uint8 numberOfGamesPlayed;
        uint256 fruitTokensCollected;
        uint8 nftAwardsCollected;
        bool superPetNftAwardCollected;
        uint256 highScore;
    }

    /* Events */
    event SnakeTokensClaimed(address indexed player);
    event SnakeTokensBought(address indexed player, uint256 snakeAmount);
    event GameFunded(address indexed player, uint8 indexed numberOfGamesFunded);
    event GameStarted(address indexed player);
    event GameOver(address indexed player);
    event FruitTokensClaimed(address indexed player);
    event FruitsToSnakeSwapped(
        address indexed player,
        uint256 indexed fruitAmount,
        uint256 indexed snakeAmount
    );
    event SnakeNftUnlocked(address indexed player);
    event SuperPetNtfUnlocked(address indexed player);

    /* Mappings */
    mapping(address => PlayerData) private s_players; // private player data
    mapping(address => PlayerStats) public s_stats; // public player stats

    /* Variables */
    SnakeToken public s_snakeToken;
    FruitToken public s_fruitToken;
    SnakeNft public s_snakeNft;
    SuperPetNft public s_superPetNft;
    address private s_player; // current player
    uint8 private constant SNAKE_TOKEN_AIRDROP = 5;
    uint8 private constant SNAKE_GAME_FEE = 1;
    uint8 private constant FRUIT_SNAKE_RATE = 10; // 10 FRUIT => 1 SNAKE
    uint8 private constant SNAKE_ETH_RATE = 100; // 1 ETH => 100 SNAKE
    uint8 private constant MIN_SCORE_TO_CLAIM_NFT = 50; // require score 50 to unlock NftAward
    uint8 private constant MAX_NUMBER_NFT_AWARDS = 5; // maximum number of NftAwards to claim

    /* Modifiers */
    modifier isPlayer() {
        s_player = msg.sender;
        _;
    }

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
            revert SnakeGame__SnakeTokensAlreadyClaimed(s_player);
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
            revert SnakeGame__NotEnoughEthSent(msg.value, ethPayment);
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
            revert SnakeGame__SnakeTokenBalanceTooLow(chargedFee);
        }
        // Transfer SNAKE tokens to contract address
        bool fundStatus = s_snakeToken.transferFrom(s_player, address(this), chargedFee);
        if (!fundStatus) {
            revert SnakeGame__FundGame_GameFundingFailed(s_player, address(this), chargedFee);
        }
        // Burn SNAKE tokens by SnakeGame contract
        s_snakeToken.burn(chargedFee);
        s_players[s_player].numberOfPaidGames += _numberOfGames;
        emit GameFunded(s_player, _numberOfGames);
    }

    // Function: Game Start
    function gameStart() external isPlayer {
        // Check if player paid to play the game
        if (s_players[s_player].numberOfPaidGames < 1) {
            revert SnakeGame__NoGamesFunded(s_player);
        }
        s_players[s_player].numberOfPaidGames--;
        s_players[s_player].gameStartedFlag = true;
        emit GameStarted(s_player);
    }

    // Function: Game Over
    function gameOver(uint256 _score) external isPlayer {
        // Check if player played the game
        if (s_players[s_player].gameStartedFlag == false) {
            revert SnakeGame__PlayerDidNotPlaySnakeGame(s_player);
        }
        s_players[s_player].gameStartedFlag = false;
        s_players[s_player].fruitTokensToClaim += _score;
        // Set SnakeNft claim
        if (
            _score >= MIN_SCORE_TO_CLAIM_NFT &&
            s_players[s_player].nftAwardsToClaim <= MAX_NUMBER_NFT_AWARDS
        ) {
            s_players[s_player].nftAwardsToClaim++;
            emit SnakeNftUnlocked(s_player);
        }
        s_stats[s_player].numberOfGamesPlayed += 1;
        s_stats[s_player].fruitTokensCollected += _score;
        // Set HighScore
        if (_score >= s_stats[s_player].highScore) {
            s_stats[s_player].highScore = _score;
        }
        emit GameOver(s_player);
    }

    // Function: Claim FruitTokens earned in the game
    function fruitTokenClaim() external nonReentrant isPlayer {
        // Check if player has FRUIT to claim
        if (s_players[s_player].fruitTokensToClaim < 1) {
            revert SnakeGame__NoFruitTokensToClaim(s_player);
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
            revert SnakeGame__TokenSwap_FruitTransferFailed(s_player, address(this), _fruitAmount);
        }
        // Mint SNAKE tokens for player account
        s_snakeToken.mint(s_player, snakeAmount);
        // Burn received FRUIT tokens by SnakeGame contract
        s_fruitToken.burn(_fruitAmount);
        emit FruitsToSnakeSwapped(s_player, _fruitAmount, snakeAmount);
    }

    // Function: Claim NFT award
    function snakeNftClaim() external nonReentrant isPlayer {
        uint8 ntfAmountToClaim = s_players[s_player].nftAwardsToClaim;
        // Check if player has SnakeNft to claim
        if (ntfAmountToClaim < 1) {
            revert SnakeGame__NoNftAwardsToClaim(s_player);
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
            emit SnakeNftUnlocked(s_player);
        }
    }

    // Function: Claim Super NFT award
    function superPetNftClaim() external nonReentrant isPlayer {
        bool superPetNftClaimFlag = s_players[s_player].superPetNftAwardFlag;
        // Check if player has SuperPetNtf to claim
        if (superPetNftClaimFlag != true) {
            revert SnakeGame__NoSuperPetNtfToClaim(s_player);
        }
        // Mint superPetNft
        s_superPetNft.safeMint(s_player);
    }

    // Function: Withdraw ETH from game contract by the owner
    function withdraw(uint256 _amount) external nonReentrant onlyOwner {
        address owner = payable(owner());
        (bool success, ) = payable(owner).call{value: _amount}("");
        if (!success) {
            revert SnakeGame__EthWithdrawalFailed(owner, _amount);
        }
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    // Function shows private, sensitive data - can ONLY be called by player
    function getPlayerData(address _player) external isPlayer returns (PlayerData memory) {
        return s_players[_player];
    }

    // Function shows public player stats - can be called by everyone
    function getPlayerStats(address _player) external view returns (PlayerStats memory) {
        return s_stats[_player];
    }

    function getSnakeTokenContractAddress() external view returns (address) {
        return address(s_snakeToken);
    }

    function getFruitTokenContractAddress() external view returns (address) {
        return address(s_fruitToken);
    }

    function getSnakeNftContractAddress() external view returns (address) {
        return address(s_snakeNft);
    }

    function getSuperPetNftContractAddress() external view returns (address) {
        return address(s_superPetNft);
    }

    function getCurrentPlayerAddress() external view returns (address) {
        return s_player;
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

    function getMinScoreToClaimNft() external pure returns (uint8) {
        return MIN_SCORE_TO_CLAIM_NFT;
    }

    function getMaxNumberNftAwards() external pure returns (uint8) {
        return MAX_NUMBER_NFT_AWARDS;
    }

    function getSnakeGameEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /* Receive and Fallback Functions */
    receive() external payable {}

    fallback() external payable {
        revert SnakeGame__CalledFunctionDoesNotExist();
    }
}
