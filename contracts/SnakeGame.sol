// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/* Imports */
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/* Errors */
error SnakeGame__NoGamesFunded(address player);
error SnakeGame__PlayerDidNotPlayGame(address player);
error SnakeGame__EthWithdrawalFailed(address owner, uint256 amount);
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
        uint256 lastScore;
        uint256 bestScore;
    }

    /* Events */
    event GameStarted(address indexed player);
    event SnakeNftUnlocked(address indexed player);
    event GameOver(address indexed player);

    /* Mappings */
    mapping(address => PlayerData) internal s_players; // private player data
    mapping(address => PlayerStats) public s_stats; // public player stats

    /* State Variables */
    address internal s_player;
    uint8 internal constant MIN_SCORE_TO_CLAIM_NFT = 50; // require score 50 to unlock NftAward
    uint8 internal constant MAX_NUMBER_NFT_AWARDS = 5; // maximum number of NftAwards to claim

    /* Modifiers */
    modifier isPlayer() {
        // Set current player
        s_player = msg.sender;
        _;
    }

    /* Constructor */
    constructor() {}

    ////////////////////
    // Main Functions //
    ////////////////////

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
            revert SnakeGame__PlayerDidNotPlayGame(s_player);
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
        // Set lastScore and bestScore
        _score = s_stats[s_player].lastScore;
        if (_score > s_stats[s_player].bestScore) {
            s_stats[s_player].bestScore = _score;
        }
        emit GameOver(s_player);
    }

    // Function: Withdraw ETH from game contract by the owner
    function withdrawEth(uint256 _amount) external nonReentrant onlyOwner {
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

    function getSnakeGameContractAddress() external view returns (address) {
        return address(this);
    }

    function getCurrentPlayerAddress() external view returns (address) {
        return s_player;
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
