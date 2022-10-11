// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

//////////////
//  Errors  //
//////////////
error SnakeGame__NoGameCredits();
error SnakeGame__GameNotStarted();
error SnakeGame__EthWithdrawalFailed();

////////////////////
// Smart Contract //
////////////////////

/**
 * @title SnakeGame contract
 * @author Dariusz Setlak
 * @notice The main Smart Contract that manages game start and game over.
 * @dev The main smart contract containing functions that manages game start and game over.
 * Main functions: gameStart, gameOver, withdrawEth
 * Getter functions: getAnyPlayerData, getPlayerData, getAnyPlayerStats, getPlayerStats,
 * getCurrentPlayerAddress, getScoreToClaimNft, getMaxSnakeNftsClaim, getEthBalance
 * Other: receive, fallback
 */
contract SnakeGame is Ownable, ReentrancyGuard {
    ///////////////
    //  Scructs  //
    ///////////////

    /**
     * @dev Struct of private player's game parameters.
     * bool airdropCollectedFlag - stores information if player already collected free SNAKE airdrop
     * uint8 gameCredits - number of games that player already paid for using Snake Tokens [SNAKE]
     * bool gameStartedFlag - stores information if player started the game, setted in gameStart function
     * bool gameOverFlag - stores information if player already finished the started game, set in gameOver function
     * uint256 fruitToClaim - number of Fruit Tokens [FRUIT] avaliable to claim
     * uint8 snakeNftsToClaim - number of Snake NFTs [SNFT] avaliable to claim
     * uint8 superNftToClaim - number of Super Pet NFTs [SPET] avaliable to claim
     *
     */
    struct PlayerData {
        bool airdropCollectedFlag;
        uint8 gameCredits;
        bool gameStartedFlag;
        bool gameOverFlag;
        uint256 fruitToClaim;
        uint8 snakeNftsToClaim;
        bool superNftClaimFlag;
    }

    /**
     * @dev Struct of public player's game statistics.
     * uint8 gamesPlayed - number of games that player already started and finished, set in gameOver function
     * uint256 lastScore - last player's game score
     * uint256 bestScore - best player's game score
     * uint256 fruitTokensCollected - sum of all collected and claimed Fruit Tokens [FRUIT]
     * uint8 snakeNftsCollected - number of Snake NFTs [SNFT] collected in the game
     * uint8 superPetNftsCollected - number of Super Pet NFTs [SPET] collected in the game
     * uint8[] snakeNftsTokenIds - array of Player owned Snake NFTs [SNFT] tokenIDs
     * uint8[] superNftTokenIds - array of Player owned Super Pet NFTs [SPET] token IDs
     */
    struct PlayerStats {
        uint8 gamesPlayed;
        uint256 lastScore;
        uint256 bestScore;
        uint256 fruitTokensCollected;
        uint8 snakeNftsCollected;
        uint8 superPetNftsCollected;
        uint256[] snakeNftsTokenIds;
        uint256[] superNftTokenIds;
    }

    //////////////
    //  Events  //
    //////////////
    event GameStarted();
    event GameOver();
    event SnakeNftUnlocked();
    event GetMorePoints();
    event MaxSnakeNftsClaimed(uint8 snakeNftsCollected);

    ////////////////
    //  Mappings  //
    ////////////////

    /// @dev Mapping player address to player private game parameters struct.
    mapping(address => PlayerData) public s_players;

    /// @dev Mapping player address to player public game statistics struct.
    mapping(address => PlayerStats) public s_stats;

    ///////////////////////
    //  State variables  //
    ///////////////////////

    /// @dev Current player address
    address internal player;

    /// @dev Minimum score obtained in single game required to unlock for mint one SnakeNft [SNFT].
    uint8 public constant SCORE_TO_CLAIM_SNAKE_NFT = 100;

    /// @dev Maximum number of Snake NFT [SNFT] possible to claim in the game by one Player
    /// Player can obviously buy or sell Snake NFTs, but can't gain more in the game.
    uint8 public constant MAX_SNAKE_NFTS_CLAIM = 25;

    /////////////////
    //  Modifiers  //
    /////////////////

    /// @dev Modifier sets msg.sender as current player
    modifier isPlayer() {
        player = msg.sender;
        _;
    }

    ///////////////////
    //  Constructor  //
    ///////////////////

    /// @dev SnakeGame contract constructor.
    constructor() {}

    ////////////////////
    // Main Functions //
    ////////////////////

    /**
     * @notice Function starts Snake Game.
     * @dev Function allow to start Snake Game, if conditions are fulfilled or revert if not.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * Player has to buy at least one game credit, stored in variable `s_players.gameCredits`.
     * Game credit has to be purchased before user click th `Start Game` button in front-end application.
     * If player doesn't have any gameCredits, then function call will be reverted with an error.
     * If player has at least one game Credit, then function reduces by one number of gameCredits and
     * sets gameStartedFlag to `true, which allows to start the game in front-end application.
     * Finally function emit GameStarted event.
     */
    function gameStart() external isPlayer {
        // Check if player has at least one gameCredit
        console.log("SOLIDITY:GameCredits in startGame:", s_players[player].gameCredits);
        if (s_players[player].gameCredits < 1) {
            revert SnakeGame__NoGameCredits();
        }
        s_players[player].gameCredits--;
        s_players[player].gameStartedFlag = true;
        emit GameStarted();
        console.log("GAME STARTED");
    }

    /**
     * @notice Function ends the current Snake Game.
     * @dev Function ends the current game and sets update Player game parameters and stats.
     *
     * Normally the function is called by front-end application automaticly, after current game is over.
     *
     * First the function checks, if Player started the game before function gameOver is called.
     * Then function updates games paramenter and game statistics. Then function sets `lastScore` parameter,
     * checks if current Player's score is higher than his best score and if yes updates appropriate parameter.
     * Finally function emit GameOver event.
     * At the end function checks Snake NFT claim eligibility, sets appropriate parameter `snakeNftsToClaim`
     * if conditions are fulfilled and emit an event.
     *
     * @param _score gives function number of points gained in last game
     */
    function gameOver(uint256 _score) external isPlayer {
        // Check if player actually played the game
        if (s_players[player].gameStartedFlag == false) {
            revert SnakeGame__GameNotStarted();
        }
        // Game parameters update
        s_players[player].gameStartedFlag = false;
        s_players[player].fruitToClaim += _score;
        // Game stats update
        s_stats[player].gamesPlayed++;
        s_stats[player].fruitTokensCollected += _score;
        // Set lastScore and bestScore
        s_stats[player].lastScore = _score;
        if (_score > s_stats[player].bestScore) {
            s_stats[player].bestScore = _score;
        }
        emit GameOver();
        // Check SnakeNft claim
        uint8 snakeNftsCollected = s_stats[player].snakeNftsCollected;
        if (snakeNftsCollected < MAX_SNAKE_NFTS_CLAIM) {
            if (_score >= SCORE_TO_CLAIM_SNAKE_NFT) {
                s_players[player].snakeNftsToClaim++;
                emit SnakeNftUnlocked();
            } else {
                emit GetMorePoints();
            }
        } else {
            emit MaxSnakeNftsClaimed(snakeNftsCollected);
        }
    }

    /**
     * @notice Withdraw ETH from game smart contract
     * @dev Function allows withdraw ETH acumulated in this smart contract.
     * Can also be called to withdraw ETH from derivative smart contracts.
     * Function can ONLY be called by smart contract owner, by using `onlyOwner` modifier.
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier.
     * @param _amount the amount of ETH to withdraw
     */
    function withdrawEth(uint256 _amount) external nonReentrant onlyOwner {
        address owner = payable(owner());
        (bool success, ) = payable(owner).call{value: _amount}("");
        if (!success) {
            revert SnakeGame__EthWithdrawalFailed();
        }
    }

    ///////////////////////
    // Private Functions //
    ///////////////////////

    /**
     * @dev Set PlayerData parameters
     * This is internal function, therefore can only be called by this smart contract or inherited smart contracts.
     */
    function setPlayerData(address _player) internal view onlyOwner returns (PlayerData memory) {
        return s_players[_player];
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /**
     * @dev Getter function to get PlayerData parameters for any given Player
     * Can ONLY be called by `owner` of smart contract (onlyOwner modifier),
     * which is `GameTokens` smart contract.
     * @param _player address of Player to check game parameters
     * @return Private game parameters of any given Player
     */
    function getAnyPlayerData(address _player) external view onlyOwner returns (PlayerData memory) {
        return s_players[_player];
    }

    /**
     * @notice Function to get Player's game parameters.
     * @dev Getter function to get current PlayerData parameters.
     * Can ONLY be called by current Player and shows him only his own game parameters.
     * @return Private game parameters of current Player.
     */
    function getPlayerData() external view returns (PlayerData memory) {
        return s_players[msg.sender];
    }

    /**
     * @notice Function to get Player's public game statistics for any given Player
     * @dev Getter function to get PlayerStats public statistics for any given Player
     * Can be called by anyone and shows public game statistics of any given Player's address.
     * @return Public game statistics of any given Player.
     */
    function getAnyPlayerStats(address _player) public view returns (PlayerStats memory) {
        return s_stats[_player];
    }

    /**
     * @notice Function to get Player's public game statistics.
     * @dev Getter function to get current PlayerStats public statistics.
     * Can be called by anyone and shows current Player public game statistics.
     * @return Public game statistics of any given Player.
     */
    function getPlayerStats(address _player) public view returns (PlayerStats memory) {
        return s_stats[_player];
    }

    /**
     * @dev Getter function to get this smart contract address.
     * @return This smart contract address.
     */
    function getCurrentPlayerAddress() public view returns (address) {
        return player;
    }

    /**
     * @dev Getter function to get score required to mint NFT.
     * @return Required game score to claim Snake NFT [SNFT]
     */
    function getScoreToClaimNft() public pure returns (uint8) {
        return SCORE_TO_CLAIM_SNAKE_NFT;
    }

    /**
     * @dev Getter function to get maximum amount of Snake NFT [SNFT] avaliable to claim in the game.
     * @return Maximum number of Snake NFT [SNFT] claim
     */
    function getMaxSnakeNftsClaim() public pure returns (uint8) {
        return MAX_SNAKE_NFTS_CLAIM;
    }

    /**
     * @dev Getter function to get this smart contract ETH balance.
     * @return ETH balnace of this smart contract.
     */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    ///////////////////////////
    // Receive and Fallback  //
    ///////////////////////////

    /**
     * @notice Receive ETH
     * @dev Function allows to receive ETH sent to smart contract
     */
    receive() external payable {}

    /**
     * @notice Fallback function
     * @dev Function executes if none of the other functions match the intended function calls.
     */
    fallback() external payable {}

    /////////////////////
    // Test Functions  //
    /////////////////////

    /**
     * @dev Test function only for unit tests purposed, not for production.
     * @return Private game parameters of current Player.
     */
    // function setPlayerData() external returns (PlayerData memory) {
    //     // Simulate call function gameFund: Add 1 gameCredits
    //     s_players[msg.sender].gameCredits++;
    //     return s_players[msg.sender];
    // }
}
