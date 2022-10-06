// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

//////////////
//  Errors  //
//////////////
error SnakeGame__NoGamesCredits();
error SnakeGame__GameNotStarted();
error SnakeGame__EthWithdrawalFailed();
error SnakeGame__CalledFunctionDoesNotExist();

////////////////////
// Smart Contract //
////////////////////

/**
 * @title SnakeGame contract
 * @author Dariusz Setlak
 * @notice The main Smart Contract that manages game start and game over.
 * @dev The main smart contract containing functions that manages game start and game over.
 * Main functions: gameStart, gameOver, withdrawEth
 * Getter functions: getPlayerData, getPlayerStats, getSnakeGameContractAddress, getCurrentPlayerAddress,
 * getMinScoreToClaimNft, getMaxNumberNftAwards, getSnakeGameEthBalance
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
     * uint8 snakeNftsCollected - number of Snake NFTs [SNFT] collected in the game (sell or burn don't decrease this parameter)
     * uint8 superNftCollected - number of Super Pet NFTs [SPET] collected in the game (sell or burn don't decrese this parameter)
     */
    struct PlayerStats {
        uint8 gamesPlayed;
        uint256 lastScore;
        uint256 bestScore;
        uint256 fruitTokensCollected;
        uint8 snakeNftsCollected;
        uint8 superNftCollected;
    }

    //////////////
    //  Events  //
    //////////////
    event GameStarted(address indexed player);
    event SnakeNftUnlocked(address indexed player);
    event GameOver(address indexed player);

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
    address internal s_player;

    /// @dev Minimum score obtained in single game required to unlock one snakeNft [SNFT].
    uint8 internal immutable s_scoreToClaimNft; // 50

    /////////////////
    //  Modifiers  //
    /////////////////

    /// @dev Modifier sets msg.sender as current player
    modifier isPlayer() {
        s_player = msg.sender;
        _;
    }

    ///////////////////
    //  Constructor  //
    ///////////////////

    /**
     * @dev SnakeGame contract constructor.
     * Sets given parameter to appropriate storage immutable variables.
     * @param scoreToClaimNft minimum score in last game to claim SnakeNFT
     */
    constructor(uint8 scoreToClaimNft) {
        s_scoreToClaimNft = scoreToClaimNft;
    }

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
        if (s_players[s_player].gameCredits < 1) {
            revert SnakeGame__NoGamesCredits();
        }
        s_players[s_player].gameCredits--;
        s_players[s_player].gameStartedFlag = true;
        emit GameStarted(s_player);
    }

    /**
     * @notice Function ends the current Snake Game.
     * @dev Function ends the current game and sets update Player game parameters and stats.
     *
     * Normally the function is called by front-end application automaticly, after current game is over.
     *
     * First the function checks, if Player started the game before function gameOver is called.
     * Then function updates games paramenter and game statistics.
     * Next function checks SnakeNft claim eligibility, sets appropriate parameter if conditions
     * are fulfilled and emit an event.
     * Finally function sets `lastScore` parameter, checks if current Player's score is higher than
     * his best score and if yes updates appropriate parameter.
     * Finally function emit GameOver event.
     *
     * @param _score gives function number of points gained in last game
     */
    function gameOver(uint256 _score) external isPlayer {
        // Check if player actually played the game
        if (s_players[s_player].gameStartedFlag == false) {
            revert SnakeGame__GameNotStarted();
        }
        // Game parameters update
        s_players[s_player].gameStartedFlag = false;
        s_players[s_player].fruitToClaim += _score;
        // Game stats update
        s_stats[s_player].gamesPlayed++;
        s_stats[s_player].fruitTokensCollected += _score;
        // Check SnakeNft claim
        if (_score >= s_scoreToClaimNft) {
            s_players[s_player].snakeNftsToClaim++;
            emit SnakeNftUnlocked(s_player);
        }
        // Set lastScore and bestScore
        s_stats[s_player].lastScore = _score;
        if (_score > s_stats[s_player].bestScore) {
            s_stats[s_player].bestScore = _score;
        }
        emit GameOver(s_player);
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

    //////////////////////
    // Getter Functions //
    //////////////////////

    /**
     * @dev Getter function to get PlayerData parameters for any given Player
     * Can ONLY be called by owner of smart contract.
     * @param _player address of Player to check game parameters
     * @return Private game parameters of any given Player
     */
    function getAnyPlayerData(address _player) external view returns (PlayerData memory) {
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
     * @notice Function to get Player's public game statistics.
     * @dev Getter function to get current PlayerStats public statistics.
     * Can be called by anyone and shows public game statistics of any given Player's address.
     * @return Public game statistics of any given Player.
     */
    function getPlayerStats(address _player) external view returns (PlayerStats memory) {
        return s_stats[_player];
    }

    /**
     * @dev Getter function to get current Player's address.
     * @return s_player the address of current Player
     */
    function getCurrentPlayerAddress() external view returns (address) {
        return s_player;
    }

    /**
     * @dev Getter function to get immutable parameter s_scoreToClaimNft.
     * @return s_scoreToClaimNft required game score to claim SnakeNFT
     */
    function getScoreToClaimNft() external view returns (uint8) {
        return s_scoreToClaimNft;
    }

    /**
     * @dev Getter function to get this smart contract address.
     * @return This smart contract address.
     */
    function getSnakeGameContractAddress() external view returns (address) {
        return address(this);
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
    fallback() external payable {
        revert SnakeGame__CalledFunctionDoesNotExist();
    }

    /////////////////////
    // Test Functions  //
    /////////////////////

    /**
     * @dev Test function only for unit tests purposed, not for production.
     * @return Private game parameters of current Player.
     */
    function setPlayerData() external returns (PlayerData memory) {
        // Simulate call function gameFund: Add 1 gameCredits
        s_players[msg.sender].gameCredits++;
        return s_players[msg.sender];
    }
}
