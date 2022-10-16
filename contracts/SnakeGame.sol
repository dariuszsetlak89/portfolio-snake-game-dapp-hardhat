// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
import "./tokens/Token.sol";
import "./tokens/Nft.sol";

//////////////
//  Errors  //
//////////////
error SnakeGame__NoGameCredits();
error SnakeGame__GameNotStarted();
error SnakeGame__SnakeAirdopAlreadyClaimed();
error SnakeGame__NotEnoughEthSent(uint256 ethSent, uint256 ethRequied);
error SnakeGame__SnakeTokensBalanceTooLow(uint256 snakeBalance, uint256 requiredSnakeBalance);
error SnakeGame__NoFruitTokensToClaim();
error SnakeGame__FruitTokensBalanceTooLow(uint256 fruitBalance, uint256 requiredFruitBalance);
error SnakeGame__FruitAmountIncorrect();
error SnakeGame__NoSnakeNftsToClaim();
error SnakeGame__NoSuperNftToClaim();
error SnakeGame__SnakeNftBalanceTooLow(uint256 snakeNftBalance, uint256 requiredSnakeNftBalance);
error SnakeGame__EthWithdrawalFailed();

////////////////////
// Smart Contract //
////////////////////

/**
 * @title SnakeGame contract
 * @author Dariusz Setlak
 * @notice The main Snake Game Smart Contract
 * @dev The main smart contract of `Snake Game Dapp` containing the following functions:
 * Deployment Functions: createToken, createNft
 * Game functions: gameStart, gameOver
 * Token functions: snakeAirdrop, buySnake, buyCredits, fruitClaim, fruitToSnakeSwap
 * NFT functions: snakeNftClaim, checkSuperNftClaim, superPetNftClaim
 * Private functions: gameCreditPriceReducer, randomNumber
 * Getter functions: getAnyPlayerData, getPlayerData, getAnyPlayerStats, getPlayerStats, getEthBalance
 * Other functions: withdrawEth, receive, fallback
 */
contract SnakeGame is Ownable, ReentrancyGuard {
    ///////////////
    //  Scructs  //
    ///////////////

    /**
     * @dev Struct of private Player's game parameters.
     * uint256 gameCredits - number of games that Player already paid for using SNAKE tokens.
     * bool gameStartedFlag - Player's game status: 0 - game not started or finished, 1 - game started.
     * uint256 fruitToClaim - number of FRUIT tokens avaliable to claim
     * bool snakeAirdropFlag - Player's free SNAKE airdrop status: 0 - not received, 1 - received.
     * uint256 snakeNftsToClaim - number of `Snake NFTs` avaliable to claim
     * uint256 superNftClaimFlag - Player's `Super Pet NFT` claim status: 0 - nothing to claim, 1 - claim avaliable.
     */
    struct PlayerData {
        uint256 gameCredits;
        bool gameStartedFlag;
        uint256 fruitToClaim;
        bool snakeAirdropFlag;
        uint256 snakeNftsToClaim;
        bool superNftClaimFlag;
    }

    /**
     * @dev Struct of public Player's game statistics.
     * uint256 gamesPlayed - number of games played by the Player.
     * uint256 fruitsCollected - sum of FRUIT tokens collected in all played games.
     * uint256 lastScore - Player's last game score
     * uint256 bestScore - Player's best game score
     * uint256 snakeNftsAmount - number of `Snake NFTs` awards claimed
     * uint256 superNftsAmount - number of `Super Pet NFTs` awards claimed
     */
    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 fruitsCollected;
        uint256 lastScore;
        uint256 bestScore;
        uint256 snakeNftsAmount;
        uint256 superNftsAmount;
    }

    //////////////
    //  Events  //
    //////////////
    event GameStarted(address indexed player);
    event GameOver(address indexed player);
    event SnakeNftUnlocked(address indexed player);
    event MaxSnakeNftsClaimed(address indexed player);
    event SuperNftUnlocked(address indexed player);
    event MaxSuperNftsClaimed(address indexed player);
    event SnakeAirdropReceived(address indexed player, uint256 indexed snakeAmount);
    event SnakeTokensBought(address indexed player, uint256 indexed snakeAmount);
    event CreditsBought(address indexed player, uint256 indexed creditsAmount);
    event FruitTokensClaimed(address indexed player, uint256 indexed fruitAmount);
    event FruitsToSnakeSwapped(address indexed player, uint256 indexed fruitAmount, uint256 indexed snakeAmount);
    event SnakeNftsClaimed(address indexed player, uint256 indexed snakeNftsAmount);
    event SuperNftClaimed(address indexed player);
    event EthTransferReceived(uint256 ethAmount);

    ////////////////
    //  Mappings  //
    ////////////////

    /// @dev Mapping Player's address to Player's private game parameters struct.
    mapping(address => PlayerData) private s_players;

    /// @dev Mapping Player's address to Player's public game statistics struct.
    mapping(address => PlayerStats) public s_stats;

    ///////////////////////
    //  State variables  //
    ///////////////////////

    /// @dev Current Player's address
    address private player;

    ////////////////////////
    // Contract variables //
    ////////////////////////

    /// @dev Deployed `Token` contract instance `SnakeToken`
    Token public s_snakeToken;

    /// @dev Deployed `Token` contract instance `FruitToken`
    Token public s_fruitToken;

    /// @dev Deployed `Nft` contract instance `SnakeNft`
    Nft public s_snakeNft;

    /// @dev Deployed `Nft` contract instance `SuperPetNft`
    Nft public s_superPetNft;

    /////////////////////////
    // Constant variables  //
    /////////////////////////

    /// @dev Minimum game score required to unlock for mint one `Snake NFT`.
    uint256 public constant SCORE_TO_CLAIM_SNAKE_NFT = 100;

    /// @dev SNAKE tokens airdrop amount
    uint256 public SNAKE_AIRDROP_AMOUNT = 10;

    /// @dev Game credit base cost paid in SNAKE tokens.
    uint256 public GAME_CREDIT_PRICE = 5;

    /// @dev ETH to SNAKE token exchange rate
    /// 1 ETH => 100 SNAKE, 0.01 ETH => 1 SNAKE
    uint256 public SNAKE_ETH_RATE = 1e16; // 0.01 * 1e18

    /// @dev FRUIT token to SNAKE token exchange rate
    /// 20 FRUIT => 1 SNAKE, 1 FRUIT => 0.05 SNAKE
    uint256 public constant FRUIT_SNAKE_RATE = 20;

    /// @dev Maximum number of `Snake NFT` tokens possible to claim in the game by one Player
    uint256 public constant MAX_SNAKE_NFTS = 30;

    /// @dev Maximum number of `Super Pet NFT` tokens possible to claim in the game by one Player.
    uint256 public constant MAX_SUPER_NFTS = 3;

    /// @dev Mint fee in FRUIT tokens required to mint `Snake NFT`.
    uint256 public constant FRUIT_MINT_FEE = 100;

    /// @dev Mint fee in ETH required to mint `Super Pet NFT`: 0.1 ETH = 0.1e18 WEI = 1e17 WEI
    uint256 public constant ETH_MINT_FEE = 1e17;

    /// @dev Minimum balance of Snake NFT [SNFT] required to unlock Super Pet NFT [SPET].
    uint8 public constant SNAKE_NFTS_REQUIRED = 10;

    /////////////////
    //  Modifiers  //
    /////////////////

    /// @dev Modifier sets `msg.sender` as current Player
    modifier setPlayer() {
        player = msg.sender;
        _;
    }

    ///////////////////
    //  Constructor  //
    ///////////////////

    /**
     * @dev SnakeGame contract constructor.
     * Set given parameters to appropriate variables, when contract deploys.
     * @param snakeTokenName given name parameter to create `Snake Token` using `Token` contract
     * @param snakeTokenSymbol given symbol parameter to create `Snake Token` using `Token` contract
     * @param fruitTokenName given name parameter to create `Fruit Token` using `Token` contract
     * @param fruitTokenSymbol given symbol parameter to create `Fruit Token` using `Token` contract
     * @param snakeNftName given name parameter to create `Snake NFT` using `Nft` contract
     * @param snakeNftSymbol given symbol parameter to create `Snake NFT` using `Nft` contract
     * @param snakeNftUris given uris array parameter to create `Snake NFT` using `Nft` contract
     * @param superPetNftName given name parameter to create `Super Pet NFT` using `Nft` contract
     * @param superPetNftSymbol given symbol parameter to create `Super Pet NFT` using `Nft` contract
     * @param superPetNftUris given uris array parameter to create `Super Pet NFT` using `Nft` contract
     */
    constructor(
        string memory snakeTokenName,
        string memory snakeTokenSymbol,
        string memory fruitTokenName,
        string memory fruitTokenSymbol,
        string memory snakeNftName,
        string memory snakeNftSymbol,
        string[] memory snakeNftUris,
        string memory superPetNftName,
        string memory superPetNftSymbol,
        string[] memory superPetNftUris
    ) {
        // Create `Snake Token [SNAKE]`
        s_snakeToken = createToken(snakeTokenName, snakeTokenSymbol);
        // Create `Fruit Token [FRUIT]`
        s_fruitToken = createToken(fruitTokenName, fruitTokenSymbol);
        // Create `Snake NFT [SNFT]`
        s_snakeNft = createNft(snakeNftName, snakeNftSymbol, snakeNftUris);
        // Create `Super Pet NFT [SPET]`
        s_superPetNft = createNft(superPetNftName, superPetNftSymbol, superPetNftUris);
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
     * @notice Function starts the game.
     * @dev Function allow to start Snake Game, if conditions are fulfilled or revert if not.
     *
     * Function is called by the Player, using front-end application.
     *
     * Player has to buy at least one game credit, stored in variable `s_players.gameCredits`.
     * Game credit has to be purchased before user call this function.
     * If Player doesn't have any game credits, then function call will be reverted with an error.
     * If Player has at least one game credit, then function reduces by one parameter `gameCredits`
     * and sets parameter `gameStartedFlag` to `true`. At the end function emit `GameStarted` event.
     */
    function gameStart() external setPlayer {
        // Check if player has at least one game credit
        if (s_players[player].gameCredits < 1) {
            revert SnakeGame__NoGameCredits();
        }
        s_players[player].gameCredits--;
        s_players[player].gameStartedFlag = true;
        emit GameStarted(player);
    }

    /**
     * @notice Function ends the current game.
     * @dev Function ends the current game and update Player's game parameters and statistics.
     *
     * Function is called automaticly by the Player, using front-end application.
     *
     * Function checks, if Player started the game before function gameOver is called.
     * Next function updates game parameters and statistics. Then function sets `lastScore`
     * and `bestScore` parameters. After that function call private function to check Player's
     * `Snake NFT` claim eligibility. Finally function updates games paramenters and emits an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from
     * OpenZeppelin library.
     *
     * @param _score number of points gained by Player in the last game
     */
    function gameOver(uint256 _score) external nonReentrant setPlayer {
        // Check if Player actually played the game
        if (s_players[player].gameStartedFlag == false) {
            revert SnakeGame__GameNotStarted();
        }
        // Player's game parameters update
        s_players[player].fruitToClaim += _score;
        s_players[player].gameStartedFlag = false;
        // Player's game statistics update
        s_stats[player].gamesPlayed++;
        s_stats[player].fruitsCollected += _score;
        // Set lastScore and bestScore
        s_stats[player].lastScore = _score;
        if (_score > s_stats[player].bestScore) {
            s_stats[player].bestScore = _score;
        }
        // Emit an event
        emit GameOver(player);
        // Check Player's `Snake NFT` claim eligibility.
        uint256 snakeNftsAmount = s_stats[player].snakeNftsAmount;
        if (snakeNftsAmount < MAX_SNAKE_NFTS) {
            if (_score >= SCORE_TO_CLAIM_SNAKE_NFT) {
                s_players[player].snakeNftsToClaim++;
                emit SnakeNftUnlocked(player);
            }
        } else {
            emit MaxSnakeNftsClaimed(player);
        }
    }

    /////////////////////
    // Token Functions //
    /////////////////////

    /**
     * @notice Free SNAKE tokens airdrop for every new Player.
     * @dev Function allows every new Player claim for free SNAKE airdrop. Airdrop amount equals constant
     * variable `SNAKE_AIRDROP_AMOUNT`.
     *
     * Function is called by the Player, using front-end application.
     *
     * Function checks, if Player already received SNAKE airdrop. If yes, then transaction reverts
     * with an error message. If not, function mint SNAKE tokens to Player's account,
     * switches `airdropCollectedFlag` to `true` and emits an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     */
    function snakeAirdrop() external nonReentrant setPlayer {
        // Check if Player didn't already received SNAKE airdrop.
        if (s_players[player].snakeAirdropFlag == true) {
            revert SnakeGame__SnakeAirdopAlreadyClaimed();
        }
        // Mint SNAKE tokens to Player's account
        s_players[player].snakeAirdropFlag = true;
        s_snakeToken.mint(player, SNAKE_AIRDROP_AMOUNT);
        emit SnakeAirdropReceived(player, SNAKE_AIRDROP_AMOUNT);
    }

    /**
     * @notice Buy SNAKE tokens for Ethereum [ETH].
     * @dev Function allows buy SNAKE tokens for ETH using fixed price. Exchange rate is stored in a constant
     * variable `SNAKE_ETH_RATE`.This function is a payable function, which allows Player to send ETH with
     * function call.
     *
     * Function is called by the Player, using front-end application.
     *
     * Player calls function with appropriate ETH amount in function call of ETH to contract. The amount of ETH
     * to be send is calculated in front-end application and depends on how many SNAKE tokens Player wants to buy.
     * If sended ETH amount is not enough, then transaction reverts with an error message. If sended ETH amount
     * is correct, then function mint appropriate amount of SNAKE tokens to Player's account and emit an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     *
     * @param _snakeAmount SNAKE tokens amount that Player wants to buy
     */
    function buySnake(uint256 _snakeAmount) public payable nonReentrant setPlayer {
        uint256 ethPayment = _snakeAmount * SNAKE_ETH_RATE;
        // Check if Player sent enough ETH amount with function call.
        if (msg.value < ethPayment) {
            revert SnakeGame__NotEnoughEthSent(msg.value, ethPayment);
        }
        // Mint bought amount of SNAKE tokens to Player's account
        s_snakeToken.mint(player, _snakeAmount);
        emit SnakeTokensBought(player, _snakeAmount);
    }

    /**
     * @notice Buy game credits using SNAKE tokens.
     * @dev Function allows Player to buy game credits using SNAKE tokens using fixed price.
     * The base price for one game credit equals constant variable `GAME_CREDIT_PRICE` and
     * can be reduced depending on Player's `Super Pet Nft` tokens balance, what is calculated
     * by calling function `gameCreditPriceReducer`.
     *
     * Function is called by the Player, using front-end application.
     *
     * Function checks, if Player has enough SNAKE balance to pay for the declared amount of
     * game credits. If not, then transaction reverts with an error message. If yes, then function
     * transfer SNAKE tokens from Player's account to `SnakeGame` contract (allowance required).
     * If `transferFrom` transaction succeed, then smart contract burns received SNAKE tokens,
     * increase Player's `gameCredits` parameter by `_creditsAmount` and emit an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     *
     * @param _creditsAmount game credits amount that Player wants to buy
     */
    function buyCredits(uint256 _creditsAmount) external nonReentrant setPlayer {
        uint256 chargedFee = _creditsAmount * (GAME_CREDIT_PRICE - gameCreditPriceReducer());
        uint256 snakeBalance = s_snakeToken.balanceOf(player);
        // Check if Player have enough SNAKE to pay a `chargeFee`
        if (snakeBalance < chargedFee) {
            revert SnakeGame__SnakeTokensBalanceTooLow(snakeBalance, chargedFee);
        }
        // Transfer SNAKE tokens to `SnakeGame` contract
        s_snakeToken.transferFrom(player, address(this), chargedFee);
        // Burn SNAKE tokens fee transfered to `SnakeGame` contract
        s_snakeToken.burn(chargedFee);
        s_players[player].gameCredits += _creditsAmount;
        emit CreditsBought(player, _creditsAmount);
    }

    /**
     * @notice Claim FRUIT tokens earned in the Snake Game.
     * @dev Function allows Player to claim FRUIT tokens, gained by scoring game points.
     * The amount of FRUIT tokens avaliable to claim by Player is stored in `fruitToClaim` parameter,
     * which i updating automaticly in function `gameOver` after every game ends.
     *
     * Function is called by the Player, using front-end application.
     *
     * Function checks, if Player has at least one FRUIT token to claim. If not, then reverts with an error message.
     * If yes, then smart contract mint FRUIT tokens to Player's account in amount equal to value of `fruitToClaim`
     * parameter. Then function reset `fruitToClaim` parameter to 0 and emit an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     */
    function fruitClaim() external nonReentrant setPlayer {
        uint256 fruitAmount = s_players[player].fruitToClaim;
        // Check if player has FRUIT tokens to claim
        if (s_players[player].fruitToClaim < 1) {
            revert SnakeGame__NoFruitTokensToClaim();
        }
        // Mint FRUIT tokens to Player's account
        s_players[player].fruitToClaim = 0;
        s_fruitToken.mint(player, fruitAmount);
        emit FruitTokensClaimed(player, fruitAmount);
    }

    /**
     * @notice Swap FRUIT tokens earned in the game to SNAKE tokens.
     * @dev Function allows Player to perform one way token swap: FRUIT -> SNAKE. To swap tokens function uses fixed
     * exchange rate stored in constant variable `FRUIT_SNAKE_RATE`.
     *
     * IMPORTANT! There is intentionally not possible to perform opposite SNAKE -> FRUIT swap. With this functionlaity,
     * it would be possible, that unfair Player connects multiple new accounts only for claim SNAKE airdrop, swap airdropped
     * tokens to FRUIT tokens and mint NFTs without even playing one game. We want to avoid this situation.
     *
     * Function is called by the Player, using front-end application.
     *
     * Function checks, if Player has enough SNAKE balance to pay for the declared amount of
     * game credits. Function checks also, if given `_fruitAmount` is coorect number to give integer `snakeAmount`
     * after token swap. If any of these conditions fail, transaction reverts with an error message.
     * If both conditions pass, then function transfers FRUIT tokens from Player's account to `SnakeGame` contract
     * (allowance required). If `transferFrom` transaction succeed, then smart contract mint `snakeAmount` amount
     * of SNAKE tokens to Player's account, burns received FRUIT tokens and emit an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     *
     * @param _fruitAmount FRUIT amount that Player wants to swap from
     */
    function fruitToSnakeSwap(uint256 _fruitAmount) external nonReentrant setPlayer {
        uint256 fruitBalance = s_fruitToken.balanceOf(player);
        // Check if Player's FRUIT balance is enough to swap declared tokens amount
        if (fruitBalance < _fruitAmount) {
            revert SnakeGame__FruitTokensBalanceTooLow(fruitBalance, _fruitAmount);
        }
        // Check if `_fruitAmount` input a multiple of `FRUIT_SNAKE_RATE`
        // SNAKE amount must be integer, theresofe _fruitAmount has to be: 20, 40, 60 ...
        if ((_fruitAmount % FRUIT_SNAKE_RATE) != 0) {
            revert SnakeGame__FruitAmountIncorrect();
        }
        uint256 snakeAmount = _fruitAmount / FRUIT_SNAKE_RATE;

        // Transfer FRUIT tokens to `SnakeGame` contract
        s_fruitToken.transferFrom(player, address(this), _fruitAmount);
        // Mint SNAKE tokens for Player's account
        s_snakeToken.mint(player, snakeAmount);
        // Burn FRUIT tokens transfered to `SnakeGame` contract
        s_fruitToken.burn(_fruitAmount);
        emit FruitsToSnakeSwapped(player, _fruitAmount, snakeAmount);
    }

    ///////////////////
    // NFT Functions //
    ///////////////////

    /**
     * @notice Claim unlocked `Snake NFT` awards.
     * @dev Function allows Player to claim previously unlocked `Snake NFT` awards. The number of `Snake NFTs` to claim
     * is stored in `snakeNftsToClaim` parameter. Player can choose in front-end application how many of avaliable NFTs he wants to
     * claim. Function gets `_snakeNftAmount` imput parameter, which can't be more than `snakeNftsToClaim` parameter.
     * There is a mint fee in FRUIT tokens required to mint `Snake NFT`, which is stored in constant variable `FRUIT_MINT_FEE`.
     * The maximum number of `Snake NFTs` possible to mint by one Player in the game is stored in constant variable `MAX_SNAKE_NFTS`.
     *
     * Function is called by the Player, using front-end application.
     *
     * Function mint `_snakeNftAmount` number of `Snake NFTs` in the FOR loop.
     * Inside FOR loop function checks, if Player has at least one Snake NFT avaliable to claim, by testing `snakeNftsToClaim` parameter.
     * If there is none, then transaction reverts. After that function checks, if `fruitBalance` is enough to pay mint fee `FRUIT_MINT_FEE`.
     * If not, then transaction reverts. Then function transfer FRUIT tokens from Player's account to `SnakeGame` contract (allowance required).
     * If `transferFrom` transaction succeed, then smart contract safe mint`Snake NFT` to Player's account, with randomly choosen URI from URI's array.
     * Finally smart contract burns received mint fee in FRUIT tokens and emit an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     */
    function snakeNftClaim(uint256 _snakeNftAmount) external nonReentrant setPlayer {
        for (uint256 i = 1; i <= _snakeNftAmount; i++) {
            if (s_players[player].snakeNftsToClaim < 1) {
                revert SnakeGame__NoSnakeNftsToClaim();
            }
            // Check if Player has enough FRUIT tokens to pay `Snake NFT` mint fee.
            uint256 fruitBalance = s_fruitToken.balanceOf(player);
            if (fruitBalance < FRUIT_MINT_FEE) {
                revert SnakeGame__FruitTokensBalanceTooLow(fruitBalance, FRUIT_MINT_FEE);
            }
            // Transfer FRUIT tokens mint fee to `SnakeGame` contract
            s_fruitToken.transferFrom(player, address(this), FRUIT_MINT_FEE);
            // Random choice of `Snake NFT` URI's array index
            uint256 snakeNftUriIndex = randomNumber(i, s_snakeNft.getNftUrisArrayLength());

            // Safe mint of `Snake NFT` token
            s_players[player].snakeNftsToClaim--;
            s_snakeNft.safeMint(player, snakeNftUriIndex);
            s_stats[player].snakeNftsAmount++;
            // Burn FRUIT tokens mint fee transfered to `SnakeGame` contract
            s_fruitToken.burn(FRUIT_MINT_FEE);
        }
        emit SnakeNftsClaimed(player, _snakeNftAmount);
    }

    /**
     * @notice Function checks Player's `Super Pet NFT` claim eligibility.
     * @dev External function to check Player's `Super Pet NFT` claim eligibility.
     *
     * Function is called by the Player, using front-end application.
     *
     * Function checks, if Player did not already claimed maximum number of `Super Pet NFTs`. Then function checks,
     * if Player didn't already unlock `Super Pet NFT` and if number of `Snake NFTs` is at least `SNAKE_NFTS_REQUIRED`.
     * If yes, then function unlocks one `Super Pet NFT` and emit an event.
     * If Player already claimed maximum number of `Super Pet NFTs`, no more `Super Pet NFTs` will unlock anymore.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     */
    function checkSuperNftClaim() external nonReentrant setPlayer {
        uint256 superNftsAmount = s_stats[player].superNftsAmount;
        bool superNftClaimFlag = s_players[player].superNftClaimFlag;
        if (superNftsAmount < MAX_SUPER_NFTS) {
            uint256 snakeNftBalance = s_snakeNft.balanceOf(player);
            if (superNftClaimFlag == false && snakeNftBalance >= SNAKE_NFTS_REQUIRED) {
                s_players[player].superNftClaimFlag = true;
                emit SuperNftUnlocked(player);
            }
        } else {
            emit MaxSuperNftsClaimed(player);
        }
    }

    /**
     * @notice Claim unlocked `Super Pet NFT` award.
     * @dev Function allows Player to claim previously unlocked `Super Pet NFT` award. Information about unlocked `Super Pet NFT` is stored
     * in `superNftClaimFlag` parameter. There is a mint fee in FRUIT tokens in the amount stored in constant variable `FRUIT_MINT_FEE_SUPER_NFT`.
     * There is also a mint fee in ETH in the amount stored in constant variable `ETH_MINT_FEE`. Finally there is also requirement
     * to have `Snake NFTs` in the amount stored in `SNAKE_NFTS_REQUIRED` to burn them as a mint fee.
     * The maximum number of `Super Pet NFTs` possible to mint by one Player in the game is stored in constant variable `MAX_SUPER_NFTS`.
     *
     * Function is called by the Player, using front-end application.
     *
     * Function check, if Player has `Super Pet NFT` avaliable to claim by testing `superNftClaimFlag` parameter. If not, then transaction
     * reverts. Then function check, if Player has sent enough ETH with transaction call to pay ETH mint fee. If not, then transaction
     * reverts. And then function check, if Player has enough `Snake NFT` balance to let the contract burn it as an additional mint fee.
     * If all conditions above are met smart contract burn `SNAKE_NFTS_REQUIRED` amount of `Snake NFT` from Player's account as an additional
     * mint fee. And then smart contract mint `Super Pet NFT` to Player's account, with randomly chosen URI from URI's array. Finally function
     * emit an event.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     */
    function superPetNftClaim() external payable nonReentrant setPlayer {
        // Check if Player has Super Pet NFT to claim
        if (s_players[player].superNftClaimFlag != true) {
            revert SnakeGame__NoSuperNftToClaim();
        }
        // Check if Player has sent enough ETH with function call, to pay `Super Pet NFT` mint fee.
        if (msg.value < ETH_MINT_FEE) {
            revert SnakeGame__NotEnoughEthSent(msg.value, ETH_MINT_FEE);
        }
        // Check if Player has enough `Snake NFTs` to pay `Super Pet NFT` mint fee (burn `Snake NFTs`)
        uint256 snakeNftBalance = s_snakeNft.balanceOf(player);
        if (snakeNftBalance < SNAKE_NFTS_REQUIRED) {
            revert SnakeGame__SnakeNftBalanceTooLow(snakeNftBalance, SNAKE_NFTS_REQUIRED);
        }
        // Burn required amount of `Snake NFTs` as `Super Pet NFT` mint fee.
        // Get `Snake NFTs` tokenIds loop
        uint256[SNAKE_NFTS_REQUIRED] memory burnTokenIds;
        for (uint256 i; i < SNAKE_NFTS_REQUIRED; i++) {
            burnTokenIds[i] = s_snakeNft.tokenOfOwnerByIndex(player, i);
            // console.log("SOL: burnSnakeNftTokenId:", burnTokenIds[i]);
        }
        // Burn `Snake NFTs` loop
        for (uint256 i; i < SNAKE_NFTS_REQUIRED; i++) {
            s_snakeNft.burn(burnTokenIds[i]);
            // console.log("SOL: Burn NFT at tokenId:", burnTokenIds[i]);
        }
        // Random choice of `Super Pet NFT` URI's array index
        uint256 superNftUriIndex = randomNumber(33, s_superPetNft.getNftUrisArrayLength());
        // Safe mint of `Super Pet NFT` token
        s_players[player].superNftClaimFlag = false;
        s_superPetNft.safeMint(player, superNftUriIndex);
        s_stats[player].superNftsAmount++;
        emit SuperNftClaimed(player);
    }

    ///////////////////////
    // Private Functions //
    ///////////////////////

    /**
     * @dev Private function used to calculate appropriate discount to game credits price, depending on
     * Player's `Super Pet NFT` balance.
     *
     * Private function for internal use. Can ONLY be called by this `SnakeGame` contract.
     *
     * @return Discount to game credit price.
     */
    function gameCreditPriceReducer() public view returns (uint256) {
        uint256 superPetNftBalance = s_superPetNft.balanceOf(player);
        // console.log("SOL: superPetNftBalance:", superPetNftBalance);
        if (superPetNftBalance >= 3) return 4;
        if (superPetNftBalance == 2) return 3;
        if (superPetNftBalance == 1) return 2;
        return 0;
    }

    /**
     * @dev Function is used to generate randomly choose index of URI's data array.
     *
     * Private function for internal use. Can ONLY be called in this `SnakeGame` contract.
     *
     * Function uses keccak256 hash function to generate pseudo random integer number, in the range specified
     * by input variable `range`.
     *
     * @param _index currently minted NFT index, if multiple NFTs are minted in the FOR loop
     * @param _range range of the random number
     */
    function randomNumber(uint256 _index, uint256 _range) private view returns (uint256) {
        uint256 random = uint256(keccak256(abi.encodePacked(_index, block.difficulty, block.timestamp))) % _range;
        return random;
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
    function getPlayerStats() public view returns (PlayerStats memory) {
        return s_stats[msg.sender];
    }

    /**
     * @dev Getter function to get this `SnakeGame` smart contract ETH balance.
     * @return ETH balnace of this smart contract.
     */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /////////////////////
    // Other Functions //
    /////////////////////

    /**
     * @notice Withdraw ETH from `SnakeGame` smart contract.
     * @dev Function allows to withdraw ETH acumulated in `SnakeGame` smart contract.
     *
     * Function can ONLY be called by `owner` of contract `SnakeGame`, which is smart contract `deployer`.
     * This restriction is obtained by using `onlyOwner` modifier.
     *
     * Function is protected from reentrancy attack, by using `nonReentrant` modifier from OpenZeppelin library.
     *
     * @param _amount ETH amount to withdraw by contract `owner`
     */
    function withdrawEth(uint256 _amount) external nonReentrant onlyOwner {
        address owner = payable(owner());
        (bool success, ) = payable(owner).call{value: _amount}("");
        if (!success) {
            revert SnakeGame__EthWithdrawalFailed();
        }
    }

    /**
     * @notice Receive ETH
     * @dev Function allows to receive ETH sent to smart contract.
     */
    receive() external payable {
        // console.log("Function `receive` invoked");
        emit EthTransferReceived(msg.value);
    }

    /**
     * @notice Fallback function
     * @dev Function executes if none of the contract functions (function selector) match the intended
     * function calls.
     */
    fallback() external payable {
        // console.log("Function `fallback` invoked");
        emit EthTransferReceived(msg.value);
    }
}
