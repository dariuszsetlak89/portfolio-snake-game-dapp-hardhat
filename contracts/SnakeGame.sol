// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./tokens/Token.sol";
import "./tokens/Nft.sol";

//////////////
//  Errors  //
//////////////
error SnakeGame__TransferFailed(address recipient);
error SnakeGame__SnakeBalanceTooLow(uint256 snakeBalance);
error SnakeGame__GameNotStarted();
error SnakeGame__SnakeAirdopAlreadyReceived();
error SnakeGame__NotEnoughCurrencySent(uint256 sentAmount, uint256 requiredAmount);
error SnakeGame__NoSuperNftToClaim();
error SnakeGame__NotEnoughMintFeeSent(uint256 mintFeeSent, uint256 mintFeeRequied);
error SnakeGame__SnakeNftBalanceTooLow(uint256 snakeNftBalance, uint256 requiredSnakeNftBalance);

////////////////////
// Smart Contract //
////////////////////

/**
 * @title SnakeGame contract
 * @author Dariusz Setlak
 * @notice The main Snake Game Smart Contract
 * @dev The main smart contract of Snake Game Dapp containing the following functions:
 * Deployment Functions:
 * Game functions:
 * Token functions:
 * NFT functions:
 * Private functions:
 * Getter functions:
 * getEthBalance,
 * Other functions:
 */
contract SnakeGame is Ownable, ReentrancyGuard {
    //////////////
    //  Events  //
    //////////////
    event GameStarted(address indexed player);
    event GameOver(address indexed player);
    event SnakeAirdropReceived(address indexed player, uint256 indexed snakeAmount);
    event SnakeTokensBought(address indexed player, uint256 indexed snakeAmount);
    event SnakeNftMinted(address indexed player);
    event SuperPetNftUnlocked(address indexed player);
    event SuperPetNftMinted(address indexed player);

    ///////////////
    //  Scructs  //
    ///////////////

    /**
     * @dev Struct of Game round parameters.
     * uint32 gamesPlayed - the number of games played in this round (sum of all Player's played games)
     * uint32 highestScore - the highest game score in this round
     * address bestPlayer - address of the Player with the highest score in this round
     */
    struct GameData {
        uint32 gamesPlayed;
        uint32 highestScore;
        address bestPlayer;
    }

    /**
     * @dev Struct of Player's gameplay parameters.
     * bool snakeAirdropFlag - the status of free SNAKE tokens airdrop: false - not received, true - received.
     * bool gameStartedFlag - the game running status: false - game not started (or finished), true - game started.
     * bool superPetNftClaimFlag - the Super Pet NFT claim status: 0 - nothing to claim, 1 - claim avaliable
     * uint32 gamesPlayed - the total number of games played by the Player so far
     * uint32 lastScore - the last game score
     * uint32 bestScore - the highest Player's score ever
     * uint32 mintedSnakeNfts - the number of Snake NFTs minted by the Player at all
     * uint32 mintedSuperPetNfts - the number of Super Pet NFTs minted by the Player at all
     */
    struct PlayerData {
        bool snakeAirdropFlag;
        bool gameStartedFlag;
        bool superPetNftClaimFlag;
        uint32 gamesPlayed;
        uint32 lastScore;
        uint32 bestScore;
        uint32 mintedSnakeNfts;
        uint32 mintedSuperPetNfts;
    }

    ////////////////
    //  Mappings  //
    ////////////////

    /// @dev Mapping Game round consecutive number to game's current round parameters struct.
    mapping(uint32 => GameData) public s_gameRounds;

    /// @dev Mapping Player's address to Player's game parameters struct.
    mapping(address => PlayerData) public s_players;

    //////////////////////
    // Global variables //
    //////////////////////

    /// @dev The total number of played games
    uint64 private s_gamesPlayedTotal;

    /// @dev The Game highest score ever
    uint32 private s_highestScoreEver;

    /// @dev The Player's address with the Game highest score ever
    address private s_bestPlayerEver;

    /// @dev Current Game round (Game round counter)
    uint32 private s_currentRound;

    ////////////////////////
    // Contract variables //
    ////////////////////////

    /// @dev Deployed Token contract instance `SnakeToken`.
    Token public immutable i_snakeToken;

    /// @dev Deployed Nft contract instance `SnakeNft`.
    Nft public immutable i_snakeNft;

    /// @dev Deployed Nft contract instance `SuperPetNft`.
    Nft public immutable i_superPetNft;

    /////////////////////////
    // Immutable variables //
    /////////////////////////

    /// @dev Minimum game score required to mint Snake NFT [SNFT].
    uint32 public immutable i_scoreRequired; // default: 100

    /// @dev Minimum balance of Snake NFT [SNFT] required to unlock Super Pet NFT [SPET].
    uint32 public immutable i_snakeNftRequired; // default: 5

    /**
     * @dev SNAKE token exchange rate. Depends on the type of deployment network:
     * Ethereum TESTNET Goerli: 1 ETH => 100 SNAKE, 0.01 ETH => 1 SNAKE = about $12 (11.2022)
     * Polygon TESTNET Mumbai: 1 MATIC => 0.1 SNAKE, 10 MATIC => 1 SNAKE = about $9 (11.2022)
     */
    uint256 public immutable i_snakeExchangeRate; // default: ETH - 1e16 = 0.01, MATIC - 1e19 = 1

    /**
     * @dev Mint fee in ETH required to mint Super Pet NFT. Depends on the type of deployment network:
     * Ethereum TESTNET Goerli: 0.1 ETH = about $120 (11.2022)
     * Polygon TESTNET Mumbai: 10 MATIC = about $9 (11.2022)
     */
    uint256 public immutable i_superPetNftMintFee; // default: ETH - 1e17 = 0.1, MATIC - 1e19 = 10

    ////////////////////////
    // Constant variables //
    ////////////////////////

    /// @dev SNAKE tokens airdrop amount
    uint32 public constant SNAKE_AIRDROP = 12;

    /// @dev Game base fee paid in SNAKE tokens.
    uint32 public constant GAME_BASE_FEE = 4;

    /// @dev Maximum number of Snake NFT tokens possible to mint in the Game by one Player.
    uint32 public constant MAX_SNAKE_NFTS = 16;

    /// @dev Maximum number of Super Pet NFT tokens possible to mint in the Game by one Player.
    uint32 public constant MAX_SUPER_PET_NFTS = 3;

    /// @dev Developer account address.
    address public constant DEV = 0xEb79FD91fc34F9A74c5A046eB0c88a20B9D8f778;

    ///////////////////
    //  Constructor  //
    ///////////////////

    /**
     * @dev SnakeGame contract constructor. Sets given parameters to appropriate variables, when contract deploys.
     * // NFT Tokens URI data arrays
     * @param snakeNftUris given uris array parameter to create Snake NFT using `Nft` contract
     * @param superPetNftUris given uris array parameter to create Super Pet NFT using `Nft` contract
     * // Game immutable parameters
     * @param scoreRequired given minimum game score required to mint Snake NFT
     * @param snakeNftRequired given minimum balance of Snake NFT [SNFT] required to unlock Super Pet NFT [SPET].
     * @param snakeExchangeRate given SNAKE token exchange rate, depends on the type of deployment network
     * @param superPetNftMintFee given mint fee in native blockchain currency required to mint Super Pet NFT,
     * depends on the type of deployment network
     */
    constructor(
        // NFT Tokens URI data arrays
        string[] memory snakeNftUris,
        string[] memory superPetNftUris,
        // Game immutable parameters
        uint32 scoreRequired,
        uint32 snakeNftRequired,
        uint256 snakeExchangeRate,
        uint256 superPetNftMintFee
    ) {
        // Create game tokens
        i_snakeToken = createToken("Snake Token", "SNAKE");
        i_snakeNft = createNft("Snake NFT", "SNFT", snakeNftUris);
        i_superPetNft = createNft("Super Pet NFT", "SPET", superPetNftUris);
        // Set game immutable parameters
        i_scoreRequired = scoreRequired;
        i_snakeNftRequired = snakeNftRequired;
        i_snakeExchangeRate = snakeExchangeRate;
        i_superPetNftMintFee = superPetNftMintFee;
    }

    //////////////////////////
    // Deployment Functions //
    //////////////////////////

    /**
     * @dev Function deploys `Token` contract and using given constructor parameters creates contract instance,
     * which is a standard ERC-20 token implementation.
     * @param _name token name constructor parameter
     * @param _symbol token symbol constructor parameter
     */
    function createToken(string memory _name, string memory _symbol) private returns (Token) {
        Token token = new Token(_name, _symbol);
        return token;
    }

    /**
     * @dev Function deploys `Nft` contract and using given constructor parameters creates contract instance,
     * which is a standard ERC-721 token implementation.
     * @param _name token name constructor parameter
     * @param _symbol token symbol constructor parameter
     * @param _uris token uris array constructor parameter
     */
    function createNft(
        string memory _name,
        string memory _symbol,
        string[] memory _uris
    ) private returns (Nft) {
        Nft nft = new Nft(_name, _symbol, _uris);
        return nft;
    }

    ////////////////////
    // Game Functions //
    ////////////////////

    /**
     * @notice Function to automaticly operate game rounds, pick the best player to send him a prize.
     * @dev Function to automaticly operate Game rounds by using Chainlink Automation time-based trigger
     * mechanism. The time of execution is immutable and set in variable i_roundDuration.
     * This is an external function called by Chainlink Automation node, when the fixed time has passed.
     *
     * Function execution:
     * 1) Update global Game parameters: s_gamesPlayedTotal, s_highestScoreEver and s_bestPlayerEver.
     * 2) Set `SnakeGame` contract balance transfer amounts.
     * 3) Transfer prize to current best Player's account - 60% of current contract balance.
     * 4) Transfer prize to best ever Player's account - 30% of current contract balance.
     * 5) Transfer tip to developer's account - 10% of current contract balance.
     * 6) Update current Game round counter - next Game round START.
     *
     * Function is protected from reentrancy attack, by using nonReentrant modifier from OpenZeppelin library.
     */
    function gameRoundsAutomation() external nonReentrant {
        // Update global Game parameters: s_gamesPlayedTotal, s_highestScoreEver, s_bestPlayerEver
        // Update global number of played games parameter
        s_gamesPlayedTotal += s_gameRounds[s_currentRound].gamesPlayed;
        // Update global highest score ever and best Player's address parameters
        if (s_gameRounds[s_currentRound].highestScore > s_highestScoreEver) {
            s_highestScoreEver = s_gameRounds[s_currentRound].highestScore;
            s_bestPlayerEver = s_gameRounds[s_currentRound].bestPlayer;
        }
        // Set `SnakeGame` contract balance transfer amounts
        uint256 snakeGameBalance = address(this).balance;
        uint256 lastBestPlayerPrize = (snakeGameBalance / 10) * 6; // 60%
        uint256 bestPlayerEverPrize = (snakeGameBalance / 10) * 3; // 30%
        uint256 developerTip = snakeGameBalance / 10; // 10%
        // Current best Player prize transfer
        address currentBestPlayer = s_gameRounds[s_currentRound].bestPlayer;
        (bool successTransferCurrentBestPlayer, ) = currentBestPlayer.call{value: lastBestPlayerPrize}("");
        if (!successTransferCurrentBestPlayer) {
            revert SnakeGame__TransferFailed(currentBestPlayer);
        }
        // Best Player ever prize transfer
        address bestPlayerEver = s_bestPlayerEver;
        (bool successTransferBestPlayerEver, ) = bestPlayerEver.call{value: bestPlayerEverPrize}("");
        if (!successTransferBestPlayerEver) {
            revert SnakeGame__TransferFailed(bestPlayerEver);
        }
        // Developer tip transfer
        address developer = DEV;
        (bool successTransferDeveloperTip, ) = developer.call{value: developerTip}("");
        if (!successTransferDeveloperTip) {
            revert SnakeGame__TransferFailed(developer);
        }
        // Update current Game round counter
        s_currentRound++;
    }

    /**
     * @notice Function to start the game.
     * @dev Function allows Player to pay for the game and start the game.
     * This is an external function called by the Player, using front-end application.
     *
     * Function execution:
     * 1) Call private function _gameFeeCalculation to calculate Player's game fee.
     * 2) Check if Player's SNAKE tokens balance is enough to pay gameFee, if not then transaction reverts.
     * 3) Transfer gameFee in SNAKE tokens to `SnakeGame` contract.
     * 4) Set Player's parameter gameStartedFlag to true.
     * 5) Burn gameFee amount of SNAKE tokens from Player's account.
     * 6) Emit an event GameStarted.
     *
     * Function is protected from reentrancy attack, by using nonReentrant modifier from OpenZeppelin library.
     */
    function gameStart() external nonReentrant {
        uint256 snakeBalance = i_snakeToken.balanceOf(msg.sender);
        uint256 gameFee = _gameFeeCalculation();
        // Check if player has enough SNAKE tokens to pay game fee
        if (snakeBalance >= gameFee) {
            revert SnakeGame__SnakeBalanceTooLow(snakeBalance);
        }
        // Switch gamePaidFlag parameter to true
        s_players[msg.sender].gameStartedFlag = true;
        // Burn gameFee amount of SNAKE tokens from Player's account
        i_snakeToken.burnFrom(msg.sender, gameFee);
        emit GameStarted(msg.sender);
    }

    /**
     * @notice Function to end the current game.
     * @dev Function allows Player to pay for the Game and start the Game.
     * This is an external function called by the Player, using front-end application.
     *
     * !!! IMPORTANT !!!
     * Player's first 3 game scores can't be saved as a highScore, even if it was the highest score!
     * That forces every Player to pay for a game at least once to be able to win the highest score prize
     * when the Game round ends. Snake airdrop tokens are ONLY used for game test purposes,
     * not for competition in the game to win the prize.
     *
     * Function execution:
     * 1) Check if Player started the game before call gameOver function.
     * 2) Update Player's game parameters: gameStartedFlag, gamesPlayed, lastScore and bestScore.
     * 3) Update Game round parameters: gamesPlayed, bestPlayer and highestScore
     * 4) Mint Snake NFT if the Player met required conditions.
     * 5) Call private function to check Super Pet NFT mint eligibility.
     * 6) Emit an event GameOver.
     *
     * Function is protected from reentrancy attack, by using nonReentrant modifier from OpenZeppelin library.
     */
    function gameOver(uint32 _score) external nonReentrant {
        // Check if Player started the game before
        if (s_players[msg.sender].gameStartedFlag != true) {
            revert SnakeGame__GameNotStarted();
        }
        // Update Player's game parameters: gameStartedFlag, gamesPlayed, lastScore and bestScore
        s_players[msg.sender].gameStartedFlag = false;
        s_players[msg.sender].gamesPlayed++;
        s_players[msg.sender].lastScore = _score;
        if (_score > s_players[msg.sender].bestScore) {
            s_players[msg.sender].bestScore = _score;
        }
        // Update Game round parameters: gamesPlayed, bestPlayer and highestScore
        s_gameRounds[s_currentRound].gamesPlayed++;
        if (_score > s_gameRounds[s_currentRound].highestScore && s_players[msg.sender].gamesPlayed++ > 3) {
            s_gameRounds[s_currentRound].bestPlayer = msg.sender;
            s_gameRounds[s_currentRound].highestScore = _score;
        }
        // Mint Snake NFT if the conditions are met: required score and under Snake NFT mint limit.
        _mintSnakeNft(msg.sender);
        // Check Super Pet NFT mint eligibility
        _checkSuperPetNft(msg.sender);
        //
        emit GameOver(msg.sender);
    }

    /////////////////////
    // Token Functions //
    /////////////////////

    /**
     * @notice Free SNAKE tokens airdrop for every new Player.
     * @dev Function allows every new Player claim for free SNAKE airdrop. Airdrop amount equals immutable
     * variable SNAKE_AIRDROP.
     * This is an external function called by the Player, using front-end application.
     *
     * Function execution:
     * 1) Check if Player already received SNAKE airdrop, if yes then transaction reverts.
     * 2) Mint SNAKE tokens to Player's account.
     * 3) Emit an event SnakeAirdropReceived.
     *
     * Function is protected from reentrancy attack, by using nonReentrant modifier from OpenZeppelin library.
     */
    function snakeAirdrop() external nonReentrant {
        // Check if Player already received SNAKE airdrop.
        if (s_players[msg.sender].snakeAirdropFlag == true) {
            revert SnakeGame__SnakeAirdopAlreadyReceived();
        }
        // Mint SNAKE tokens to Player's account
        s_players[msg.sender].snakeAirdropFlag = true;
        i_snakeToken.mint(msg.sender, SNAKE_AIRDROP);
        emit SnakeAirdropReceived(msg.sender, SNAKE_AIRDROP);
    }

    /**
     * @notice Buy SNAKE tokens for native blockchain currency.
     * @dev Function allows buy SNAKE tokens for native blockchain currency using fixed price. Exchange rate
     * is stored in an immutable variable i_snakeExchangeRate. This is a payable function, which allows Player
     * to send currency with function call.
     * This is an external function called by the Player, using front-end application.
     *
     * Function execution:
     * 1) Check if Player sent enough currency amount with function call, if not then transaction reverts.
     * 2) Mint bought amount of SNAKE tokens to Player's account.
     * 3) Emit an event SnakeTokensBought.
     *
     * Function is protected from reentrancy attack, by using nonReentrant modifier from OpenZeppelin library.
     *
     * @param _snakeAmount SNAKE tokens amount that Player wants to buy
     */
    function buySnake(uint256 _snakeAmount) public payable nonReentrant {
        uint256 payment = _snakeAmount * i_snakeExchangeRate;
        // Check if Player sent enough currency amount with function call.
        if (msg.value < payment) {
            revert SnakeGame__NotEnoughCurrencySent(msg.value, payment);
        }
        // Mint bought amount of SNAKE tokens to Player's account
        i_snakeToken.mint(msg.sender, _snakeAmount);
        emit SnakeTokensBought(msg.sender, _snakeAmount);
    }

    ///////////////////
    // NFT Functions //
    ///////////////////

    /**
     * @dev Function mints Snake NFT if Player reached required score and hasn't reached Snake NFT mint limit.
     * Private function called ONLY by this `SnakeGame` contract.
     * @param _player the Player's address
     */
    function _mintSnakeNft(address _player) private {
        // Random choice of Snake NFT URI's array index
        uint256 snakeNftUriIndex = _randomNumber(i_snakeNft.getNftUrisArrayLength());
        // Update Player's game parameter: number of minted Snake NFTs
        s_players[msg.sender].mintedSnakeNfts++;
        // SafeMint Snake NFT with randomly chosen URI data
        i_snakeNft.safeMint(_player, snakeNftUriIndex);
        emit SnakeNftMinted(_player);
    }

    /**
     * @dev Function burns Snake NFT as a SuperPetNft mint fee.
     * Private function called ONLY by this `SnakeGame` contract.
     *
     * Function execution:
     * 1) Create new burnTokenIds memory array.
     * 2) Fill the array with Snake NFT IDs by calling tokenOfOwnerByIndex function in the FOR loop.
     * 3) Burn i_snakeNftRequired amount of Snake NFTs in the FOR loop
     *
     * @param _player the Player's address
     */
    function _burnSnakeNfts(address _player) private {
        // Get Snake NFTs tokenIds loop
        uint256[] memory burnTokenIds = new uint256[](i_snakeNftRequired);
        for (uint256 i; i < i_snakeNftRequired; i++) {
            burnTokenIds[i] = i_snakeNft.tokenOfOwnerByIndex(_player, i);
        }
        // Burn Snake NFTs loop
        for (uint256 i; i < i_snakeNftRequired; i++) {
            i_snakeNft.burn(burnTokenIds[i]);
        }
    }

    /**
     * @dev Function checks the Player's Super Pet NFT mint eligibility.
     * Private function called ONLY by this `SnakeGame` contract.
     * @param _player the Player's address
     */
    function _checkSuperPetNft(address _player) private {
        uint256 snakeNftBalance = i_snakeNft.balanceOf(_player);
        // Check maximum Super Pet NFTs mint limit && required Snake NFT balance
        if (s_players[_player].mintedSuperPetNfts < MAX_SUPER_PET_NFTS && snakeNftBalance >= i_snakeNftRequired) {
            s_players[_player].superPetNftClaimFlag = true;
            emit SuperPetNftUnlocked(_player);
        }
    }

    /**
     * @dev Function mints Super Pet NFT.
     * Private function called ONLY by this `SnakeGame` contract.
     *
     * Function execution:
     * 1) Random choice of Super Pet NFT URI's array index.
     * 2) Update Player's game parameters: superPetNftClaimFlag and mintedSuperPetNfts.
     * 3) Mint Super Pet NFT with randomly chosen URI data from Super Pet NFT URI datas array.
     * 4) Emit event SuperPetNftMinted.
     *
     * @param _player the Player's address
     */
    function _mintSuperPetNft(address _player) private {
        // Random choice of Super Pet NFT URI's array index
        uint256 superNftUriIndex = _randomNumber(i_superPetNft.getNftUrisArrayLength());
        // Update Player's game parameters: superPetNftClaimFlag and mintedSuperPetNfts
        s_players[_player].superPetNftClaimFlag = false;
        s_players[_player].mintedSuperPetNfts++;
        // SafeMint Super Pet NFT with randomly chosen URI data
        i_superPetNft.safeMint(_player, superNftUriIndex);
        //
        emit SuperPetNftMinted(_player);
    }

    /**
     * @notice Function to mint Super Pet NFT.
     * @dev Function allows Player to mint Super Pet NFT if he met the conditions. This is a payable function,
     * which allows Player to send currency with function call.
     * This is an external function called by the Player, using front-end application.
     *
     * Function execution:
     * 1) Call private function to check Super Pet NFT mint eligibility.
     * 2) Check if Player has unlocked Super Pet NFT for minting.
     * 3) Check if Player has sent enough currency amount with function call, to pay Super Pet NFT mint fee.
     * If not then transaction reverts.
     * 4) Check if Player's Snake NFT balance is enough to pay Super Pet NFT mint fee (burn Snake NFTs).
     * If not then transaction reverts.
     * 5) Burn required amount of Snake NFTs as Super Pet NFT mint fee.
     * 6) Mint Super Pet NFT with randomly chosen URI data
     * 7) Emit an event GameOver.
     *
     * Function is protected from reentrancy attack, by using nonReentrant modifier from OpenZeppelin library.
     */
    function mintSuperPetNft() external payable nonReentrant {
        // Check Super Pet NFT mint eligibility
        _checkSuperPetNft(msg.sender);
        // Check if Player has unlocked Super Pet NFT for minting
        if (s_players[msg.sender].superPetNftClaimFlag != true) {
            revert SnakeGame__NoSuperNftToClaim();
        }
        // Check if Player has sent enough currency amount with function call, to pay Super Pet NFT mint fee.
        if (msg.value < i_superPetNftMintFee) {
            revert SnakeGame__NotEnoughMintFeeSent(msg.value, i_superPetNftMintFee);
        }
        // Check if Player's Snake NFT balance is enough to pay Super Pet NFT mint fee (burn Snake NFTs)
        uint256 snakeNftBalance = i_snakeNft.balanceOf(msg.sender);
        if (snakeNftBalance < i_snakeNftRequired) {
            revert SnakeGame__SnakeNftBalanceTooLow(snakeNftBalance, i_snakeNftRequired);
        }
        // Burn required amount of Snake NFTs as Super Pet NFT mint fee.
        _burnSnakeNfts(msg.sender);
        // Mint Super Pet NFT
        _mintSuperPetNft(msg.sender);
    }

    ///////////////////////
    // Private Functions //
    ///////////////////////

    /**
     * @dev Function calculates gameFee depending on the baseGameFee and Player's superPetNft balance.
     * Private function called ONLY by this `SnakeGame` contract.
     * @return gameFee the calculated fee in SNAKE tokens
     */
    function _gameFeeCalculation() private view returns (uint256) {
        uint256 superPetNftBalance = i_superPetNft.balanceOf(msg.sender);
        uint256 gameFee = GAME_BASE_FEE - superPetNftBalance;
        if (gameFee >= 1) return gameFee;
        else return 1;
    }

    /**
     * @dev Function generates random integer number within the range specified in _range input parameter.
     * Can be replaced by random number delivered by Chainlink VRF, to ensure more reliable randomness.
     * Private function called ONLY by this `SnakeGame` contract.
     *
     * Function uses keccak256 hash function to generate pseudo random integer number, in the range specified
     * by input variable _range.
     *
     * @param _range range of the random number
     * @return random the random integer number within specified range
     */
    function _randomNumber(uint256 _range) private view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(block.difficulty, block.timestamp))) % _range;
        return random;
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /**
     * @dev Getter function to get current game round.
     * @return Game round.
     */
    function getGameRound() public view returns (uint32) {
        return s_currentRound;
    }

    /**
     * @dev Getter function to get the Game highest score ever.
     * @return Game highest score ever.
     */
    function getGameHighestScoreEver() public view returns (uint64) {
        return s_highestScoreEver;
    }

    /**
     * @dev Getter function to get the total number of games played by all Players.
     * @return Game total games played.
     */
    function getGamePlayedTotal() public view returns (uint64) {
        return s_gamesPlayedTotal;
    }

    /**
     * @dev Getter function to get GameData parameters of given round.
     * @return Game parameters of given game round.
     */
    function getGameData(uint32 _gameRound) public view returns (GameData memory) {
        return s_gameRounds[_gameRound];
    }

    /**
     * @dev Getter function to get GameData parameters of given round.
     * @return Player's game parameters of given Player's address.
     */
    function getPlayerData(address _player) public view returns (PlayerData memory) {
        return s_players[_player];
    }

    /**
     * @dev Getter function to get this `SnakeGame` smart contract balance.
     * @return Balnace of this smart contract.
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Getter function to get private `_randomNumber` result of given range
     * Mainly for test purposes
     *
     * @param _range range of random number
     * @return Function `_randomNumber` result.
     */
    function getRandomNumber(uint256 _range) public view returns (uint256) {
        return _randomNumber(_range);
    }
}
