// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "./SnakeGame.sol";
import "./tokens/Token.sol";
import "./tokens/Nft.sol";
import "hardhat/console.sol";

//////////////
//  Errors  //
//////////////
error GameTokens__SnakeAirdopAlreadyClaimed();
error GameTokens__NotEnoughEthSent(uint256 ethSent, uint256 ethRequied);
error GameTokens__SnakeTokenBalanceTooLow(uint256 snakeBalance, uint256 requiredSnakeBalance);
error GameTokens__SnakeTokensTransferFailed();
error GameTokens__NoFruitTokensToClaim();
error GameTokens__FruitTokensTransferFailed();
error GameTokens__FruitTokensBalanceTooLow(uint256 fruitBalance, uint256 requiredFruitBalance);
error GameTokens__NoSnakeNftsToClaim();
error GameTokens__NoSuperPetNftToClaim();

////////////////////
// Smart Contract //
////////////////////

/**
 * @title GameTokens contract
 * @author Dariusz Setlak
 * @notice Smart Contract that manages game tokens creation and usage.
 * @dev GameTokens contract contain all functions for game tokens deployment and usage in application.
 * Main functions: createSnakeToken, createFruitToken, createSnakeNft, createSuperPetNft,
 * snakeAirdropClaim, buySnake, buyCredits, fruitRewardClaim, tokenSwap, snakeNftClaim,
 * checkSuperNftClaim, superNftClaim
 * Private functions: randomNumber, gameCreditFeeReducer
 * Getter functions: getSnakeContractAddress, getFruitContractAddress, getSnakeNftContractAddress,
 * getSuperPetNftContractAddress, getSnakeAirdropAmount, getSnakeCreditBaseFee, getSnakeEthRate, getFruitSnakeRate,
 * getSnakeNftsRequired, getMaxSuperNftsClaim, getSnakeNftMintFeeFruit, getSuperNftMintFeeFruit,getSuperNftMintFeeEth
 */
contract GameTokens is SnakeGame {
    ///////////////
    //  Scructs  //
    ///////////////

    /**
     * @dev Struct of `Token` data parameters.
     * string name - name of token
     * string symbol - symbol of token
     */
    struct TokenData {
        string name;
        string symbol;
    }

    /**
     * @dev Struct of `Nft` data parameters.
     * string name - name of token
     * string symbol - symbol of token
     * string[] uris - token uris array
     */
    struct NftData {
        string name;
        string symbol;
        string[] uris;
    }

    //////////////
    //  Events  //
    //////////////
    event SnakeTokensClaimed(uint256 indexed snakeAmount);
    event SnakeTokensBought(uint256 indexed snakeAmount);
    event CreditsBought(uint16 indexed creditsAmount);
    event FruitTokensClaimed(uint256 indexed fruitAmount);
    event FruitsToSnakeSwapped(uint256 indexed fruitAmount, uint256 indexed snakeAmount);
    event SuperNftUnlocked();
    event MaxSuperPetNftsCollected(uint256 indexed superPetNftsCollected);

    ///////////////////////
    //  State variables  //
    ///////////////////////

    /// @dev SnakeToken contract instance
    Token public s_snakeToken;

    /// @dev FruitToken contract instance
    Token public s_fruitToken;

    /// @dev SnakeNft contract instance
    Nft public s_snakeNft;

    /// @dev SuperPetNft contract instance
    Nft public s_superPetNft;

    /// @dev SnakeToken contract constructor parameters
    TokenData public s_snakeData;

    /// @dev SnakeToken contract constructor parameters
    TokenData public s_fruitData;

    /// @dev SnakeNft contract constructor parameters
    NftData public s_snakeNftData;

    /// @dev SuperPetNft contract constructor parameters
    NftData public s_superPetNftData;

    /// @dev SNAKE tokens airdrop amount. Default value: 10
    uint8 public SNAKE_AIRDROP_AMOUNT = 10;

    /// @dev Game credit base fee paid in SNAKE tokens. Default value: 4
    uint8 public GAME_CREDIT_BASE_FEE = 5;

    /// @dev ETH to SNAKE token exchange rate
    /// 1 ETH => 100 SNAKE
    uint8 public constant SNAKE_ETH_RATE = 100;

    /// @dev FRUIT token to SNAKE token exchange rate
    /// 20 FRUIT => 1 SNAKE
    uint8 public constant FRUIT_SNAKE_RATE = 20;

    /// @dev Minimum balance of Snake NFT [SNFT] required to unlock Super Pet NFT [SPET].
    uint8 public constant SNAKE_NFTS_REQUIRED = 5;

    /// @dev Maximum number of Super Pet NFT [SPET] possible to claim in the game by one Player.
    /// Player can obviously buy or sell Super Pet NFTs, but can't gain more in the game.
    uint8 public constant MAX_SUPER_NFTS_CLAIM = 5;

    /// @dev Snake NFT [SNFT] mint fee in FRUIT
    uint8 public constant SNAKE_NFT_MINT_FEE_FRUIT = 100;

    /// @dev Super Pet NFT [SPET] mint fee in FRUIT
    uint16 public constant SUPER_NFT_MINT_FEE_FRUIT = 500;

    /// @dev Super Pet NFT [SPET] mint fee in ETH: 0.1 ETH = 0.1e18 WEI = 1e17 WEI
    uint256 public constant SUPER_NFT_MINT_FEE_ETH = 1e17; // 0.1 ETH

    ///////////////////
    //  Constructor  //
    ///////////////////

    /**
     * @dev GameTokens contract constructor.
     * Set parameters to appropriate variables, when contract deploys.
     * @param snakeTokenName given name parameter to create Snake Token using Token contract
     * @param snakeTokenSymbol given symbol parameter to create Snake Token using Token contract
     * @param fruitTokenName given name parameter to create Fruit Token using Token contract
     * @param fruitTokenSymbol given symbol parameter to create Fruit Token using Token contract
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
    ) SnakeGame() {
        s_snakeData = TokenData(snakeTokenName, snakeTokenSymbol);
        s_fruitData = TokenData(fruitTokenName, fruitTokenSymbol);
        s_snakeNftData = NftData(snakeNftName, snakeNftSymbol, snakeNftUris);
        s_superPetNftData = NftData(superPetNftName, superPetNftSymbol, superPetNftUris);

        // Deploy game tokens function calls
        createSnakeToken(s_snakeData);
        createFruitToken(s_fruitData);
        createSnakeNft(s_snakeNftData);
        createSuperPetNft(s_superPetNftData);
    }

    /**
     * @dev Function deploys `Token` contract and creates Snake Token [SNAKE] using given TokenData.
     * Calls only once, when GameTokens contract deploys.
     * @param _snakeData SnakeToken contract constructor parameters
     */
    function createSnakeToken(TokenData memory _snakeData) private {
        s_snakeToken = new Token(_snakeData.name, _snakeData.symbol);
    }

    /**
     * @dev Function deploys `Token` contract and create Fruit Token [FRUIT] using given TokenData.
     * Calls only once, when GameTokens contract deploys.
     * @param _fruitData FruitToken contract constructor parameters
     */
    function createFruitToken(TokenData memory _fruitData) private {
        s_fruitToken = new Token(_fruitData.name, _fruitData.symbol);
    }

    /**
     * @dev Function deploys `Nft` contract and create Snake NFT [SNFT] using given NftData.
     * Calls only once, when GameTokens contract deploys.
     * @param _snakeNftData `SnakeNft` contract constructor parameters
     */
    function createSnakeNft(NftData memory _snakeNftData) private {
        s_snakeNft = new Nft(_snakeNftData.name, _snakeNftData.symbol, _snakeNftData.uris);
    }

    /**
     * @dev Function deploys `Nft` contract and create Super Pet Nft [SPET] using given NftData.
     * Calls only once, when GameTokens contract deploys.
     * @param _superPetNftData `SuperPetNft` contract constructor parameters
     */
    function createSuperPetNft(NftData memory _superPetNftData) private {
        s_superPetNft = new Nft(
            _superPetNftData.name,
            _superPetNftData.symbol,
            _superPetNftData.uris
        );
    }

    ////////////////////
    // Main Functions //
    ////////////////////

    /**
     * @notice Collect free Snake Tokens [SNAKE] airdrop for new Players
     * @dev Function allows every new Player collect free SNAKE airdrop. Airdrop amount equals immutable
     * variable `i_snakeAirdropAmount`, which is fixed when GameTokens contract deploys.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * First function checks, if Player didn't claim airdrop before, if yes then transaction reverts
     * with an error message. If not, then function mint SNAKE tokens to Player's account,
     * switches `airdropCollectedFlag` to `true` and emit an event.
     *
     * Function is protected from reentrancy attack, using nonReentrant modifier from OpenZeppelin library.
     */
    function snakeAirdropClaim() external nonReentrant isPlayer {
        bool airdropFlag = s_players[player].airdropCollectedFlag;
        // Check if player didn't claimed SNAKE airdrop before
        if (airdropFlag == true) {
            revert GameTokens__SnakeAirdopAlreadyClaimed();
        }
        // Mint SNAKE tokens to Player's account
        s_snakeToken.mint(player, SNAKE_AIRDROP_AMOUNT);
        s_players[player].airdropCollectedFlag = true;
        emit SnakeTokensClaimed(SNAKE_AIRDROP_AMOUNT);
    }

    /**
     * @notice Buy Snake Tokens [SNAKE] for Ethereum [ETH].
     * @dev Function allows buy SNAKE tokens for ETH using fixed price.
     * Exchange rate is stored in a constant variable `ETH_SNAKE_RATE`.
     * This is a payable function, allows send ETH when function is called.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * Player calls function and sends appropriate amount of ETH to contract. The sended ETH amount
     * is calculated in front-end application and depends on how many SNAKE tokens user wants to buy.
     * If sended ETH amount is not enough, then transaction reverts with an error message.
     * If sended ETH amount is correct, then function mint appropriate amount of SNAKE tokens to
     * Player's account and emit an event.
     *
     * Function is protected from reentrancy attack, using nonReentrant modifier from OpenZeppelin library.
     *
     * @param _snakeAmount the amount of SNAKE tokens Player wants to buy
     */
    function buySnake(uint256 _snakeAmount) external payable nonReentrant isPlayer {
        uint256 ethPayment = _snakeAmount / SNAKE_ETH_RATE;
        // Check if Player sent enough ETH amount with function call.
        if (msg.value < ethPayment) {
            revert GameTokens__NotEnoughEthSent(msg.value, ethPayment);
        }
        // Mint bought amount of SNAKE tokens to Player's account
        s_snakeToken.mint(player, _snakeAmount);
        emit SnakeTokensBought(_snakeAmount);
    }

    /**
     * @notice Buy game credits using Snake Tokens [SNAKE].
     * @dev Function allows Player to buy game credits using SNAKE tokens using fixed price.
     * The price for one game credit equals immutable variable `i_gameCreditFee`,
     * which is fixed when GameTokens contract deploys.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * Function first checks, if Player has enough SNAKE balance to pay for the declared amount of
     * game credits. If not, then transaction reverts with an error message. If yes, then function
     * make transfer from Player's account to smart contract, checking required allowance before.
     * If transfer from transaction failed, then function call transaction reverts with an error message.
     * If transfer from transaction succeed, then smart contract burns received SNAKE tokens, update
     * Player's game credits parameter and emit an event.
     *
     * Function is protected from reentrancy attack, using nonReentrant modifier from OpenZeppelin library.
     *
     * @param _creditsAmount the amount of game credits Player wants to buy
     */
    function buyCredits(uint8 _creditsAmount) external nonReentrant isPlayer {
        uint256 chargedFee = _creditsAmount * (GAME_CREDIT_BASE_FEE - gameCreditFeeReducer());
        uint256 snakeBalance = s_snakeToken.balanceOf(player);
        // Check if Player have enough SNAKE to pay a chargeFee
        if (snakeBalance < chargedFee) {
            revert GameTokens__SnakeTokenBalanceTooLow(snakeBalance, chargedFee);
        }
        // Transfer SNAKE tokens to contract address
        bool transferStatus = s_snakeToken.transferFrom(player, address(this), chargedFee);
        if (!transferStatus) {
            revert GameTokens__SnakeTokensTransferFailed();
        }
        // Burn SNAKE tokens transfered to smart contract
        s_snakeToken.burn(chargedFee);
        s_players[player].gameCredits += _creditsAmount;
        emit CreditsBought(_creditsAmount);
        console.log("SOLIDITY:GameCredits after buyCredits:", s_players[player].gameCredits);
    }

    /**
     * @notice Claim Fruit Tokens [FRUIT] collected in the Snake Game.
     * @dev Function allows Player to claim collected FRUIT tokens, obtained by scoring game points.
     * The amount of FRUIT tokens to claim is stored in PlayerData parameter `fruitToClaim` and is updating
     * by calling function gameOver after every game ends.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * Function first checks, if Player has at least one FRUIT to claim. If not, then reverts with error message.
     * If yes, then smart contract mint FRUIT tokens to Player's account in total acumulated amount.
     * Then function sets player data parameter `fruitToClaim` to 0 and emit an event.
     *
     * Function is protected from reentrancy attack, using nonReentrant modifier from OpenZeppelin library.
     */
    function fruitRewardClaim() external nonReentrant isPlayer {
        uint256 fruitAmount = s_players[player].fruitToClaim;
        // Check if player has FRUIT tokens to claim
        if (fruitAmount < 1) {
            revert GameTokens__NoFruitTokensToClaim();
        }
        // Mint FRUIT tokens to Player's account
        s_fruitToken.mint(player, fruitAmount);
        s_players[player].fruitToClaim = 0;
        emit FruitTokensClaimed(fruitAmount);
    }

    /**
     * @notice Swap Fruit Tokens [FRUIT] collected in the game to Snake Tokens [SNAKE].
     * @dev Function allows Player to perform one way token swap: FRUIT -> SNAKE.
     * To swap tokens function uses exchange rate stored in constant variable `FRUIT_SNAKE_RATE`.
     *
     * IMPORTANT!!! There is intentionally not possible to perform SNAKE -> FRUIT swap, to avoid
     * possibility that users connects new accounts only for claim SNAKE airdrop, then swap it to FRUIT tokens
     * and be able to mint free NFTs without even playing one game.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * First function check, if Player has enough FRUIT tokens, as declared amount of FRUIT to swap, to make the
     * transaction possible to execute. If yes, FRUIT transfer proceeds.
     * Function perform `transferFrom` call from Player's account to smart contract, if granted allowance for this
     * contract is high enough or unlimited. If not, then FRUIT transfer failed and the whole function call reverts.
     * If `transferFrom` transaction succeed function calls `mint` function to mint appropriate amount of SNAKE tokens
     * to Player's account. Finally smart contract burns received FRUIT tokens and emit an event.
     *
     * Function is protected from reentrancy attack, using `nonReentrant` modifier from OpenZeppelin library.
     *
     * @param _fruitAmount the amount of FRUIT tokens that the Player wants to swap
     */
    function tokenSwap(uint256 _fruitAmount) external nonReentrant isPlayer {
        uint256 fruitBalance = s_fruitToken.balanceOf(player);
        uint256 snakeAmount = _fruitAmount / FRUIT_SNAKE_RATE;
        // Check if player have enough FRUIT declared to swap
        if (fruitBalance < _fruitAmount) {
            revert GameTokens__FruitTokensBalanceTooLow(fruitBalance, _fruitAmount);
        }
        // Transfer FRUIT to SnakeGame contract
        bool fruitTransferStatus = s_fruitToken.transferFrom(player, address(this), _fruitAmount);
        if (!fruitTransferStatus) {
            revert GameTokens__FruitTokensTransferFailed();
        }
        // Mint SNAKE tokens for player account
        s_snakeToken.mint(player, snakeAmount);
        // Burn FRUIT tokens transfered to smart contract
        s_fruitToken.burn(_fruitAmount);
        emit FruitsToSnakeSwapped(_fruitAmount, snakeAmount);
    }

    /**
     * @notice Claim your unlocked Snake NFT awards.
     * @dev Function allows Player to claim previously unlocked Snake NFT [SNFT] awards. The number of NFTs to claim is stored
     * in player data `snakeNftsToClaim` variable. Player can only claim all NFTs amount avaliable to claim, not possible to just
     * claim 1 NFT, when Player has e.g. 3 NFTs unlocked.
     * The maximum number of Snake NFTs possible to mint by one Player is stored in `MAX_SNAKE_NFTS_CLAIM` variable.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * First function check, if Player has at least one Snake NFT avaliable, by testing `snakeNftsToClaim` parameter. If not,
     * then transaction reverts. Then mint avaliable amount of Snake NFT for Player using randomly chosen `snakeNftUriIndex`
     * from URI's database stored in Snake NFT contract array variable `s_uris`. To get random URI array index, function calls
     * private function `randomNumber`. After Snake NFT mint succeed, smart contract burn received FRUIT tokens.
     * At the end function checks Super Pet NFT claim eligibility, sets appropriate parameter `superNftClaimFlag` if conditions
     * are fulfilled and emit an event.
     *
     * Function is protected from reentrancy attack, using `nonReentrant` modifier from OpenZeppelin library.
     */
    function snakeNftClaim() external nonReentrant isPlayer {
        uint256 nftAmountToClaim = s_players[player].snakeNftsToClaim;
        // Check if player has Snake NFT to claim
        if (nftAmountToClaim < 1) {
            revert GameTokens__NoSnakeNftsToClaim();
        }
        // Mint Snake NFTs
        uint256 fruitBalance;
        for (uint8 i = 1; i <= nftAmountToClaim; i++) {
            // Check if player have enough FRUIT required to mint Snake NFT
            fruitBalance = s_fruitToken.balanceOf(player);
            if (fruitBalance < SNAKE_NFT_MINT_FEE_FRUIT) {
                revert GameTokens__FruitTokensBalanceTooLow(fruitBalance, SNAKE_NFT_MINT_FEE_FRUIT);
            }
            // Transfer FRUIT tokens to contract address
            bool transferStatus = s_fruitToken.transferFrom(
                player,
                address(this),
                SNAKE_NFT_MINT_FEE_FRUIT
            );
            if (!transferStatus) {
                revert GameTokens__FruitTokensTransferFailed();
            }
            // Mint Snake NFT token
            uint256 snakeNftUriIndex = randomNumber(i, s_snakeNftData.uris.length);
            s_snakeNft.safeMint(player, snakeNftUriIndex);
            uint256 snakeNftTokenId = s_snakeNft.getPlayerNftsTokenId(player);
            s_stats[player].snakeNftsTokenIds.push(snakeNftTokenId);
            s_stats[player].snakeNftsCollected += 1;
            // Burn FRUIT tokens transfered to contract
            s_fruitToken.burn(SNAKE_NFT_MINT_FEE_FRUIT);
        }
        // Check superNft claim eligibility
        bool superNftClaimFlag = s_players[player].superNftClaimFlag;
        uint16 superPetNftsCollected = s_stats[player].superPetNftsCollected;
        if (superPetNftsCollected < MAX_SUPER_NFTS_CLAIM && superNftClaimFlag == false) {
            uint256 snakeNftBalance = s_snakeNft.balanceOf(player);
            if (snakeNftBalance >= SNAKE_NFTS_REQUIRED) {
                s_players[player].superNftClaimFlag = true;
                emit SuperNftUnlocked();
            }
        } else {
            emit MaxSuperPetNftsCollected(superPetNftsCollected);
        }
    }

    /**
     * @notice Check Super Pet NFT award claim eligibility.
     * @dev Function allows to check, if Player is elibigle for claim Super Pet NFT [SPET].
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * First function if Player did not already claimed maximum number of SPET.
     * Then, if parameter `superNftClaimFlag` is `false`, but Player's Snake NFTs [SNFT] is enough,
     * then switch parameter `superNftClaimFlag` into `true`. This case is possible, when e.g.
     * Player buys Snake NFT from other player on NFT Marketplace, then game first has to check
     * current SNFT balance, to make sure, that Player is eligible to claim SPET.
     * When Player already claimed maximum number of SPET, then function emit an event, which
     * can be use in front-end to give Player feedback message.
     *
     * Function is protected from reentrancy attack, using `nonReentrant` modifier from OpenZeppelin library.
     */
    function checkSuperNftClaim() external nonReentrant isPlayer {
        bool superNftClaimFlag = s_players[player].superNftClaimFlag;
        uint16 superPetNftsCollected = s_stats[player].superPetNftsCollected;
        if (superPetNftsCollected < MAX_SUPER_NFTS_CLAIM && superNftClaimFlag == false) {
            uint256 snakeNftBalance = s_snakeNft.balanceOf(player);
            if (snakeNftBalance >= SNAKE_NFTS_REQUIRED) {
                s_players[player].superNftClaimFlag = true;
                emit SuperNftUnlocked();
            }
        } else {
            emit MaxSuperPetNftsCollected(superPetNftsCollected);
        }
    }

    /**
     * @notice Claim your unlocked Super Pet NFT award.
     * @dev Function allows Player to claim previously unlocked Super Pet NFT [SPET] award. There is possible to claim
     * ONLY one SPET at once. Informatio about it is stored in player data `superNftClaimFlag` parameter.
     * The maximum number of Super Pet NFTs possible to mint by Player in the game is stored in `MAX_SUPER_NFTS_CLAIM` variable.
     *
     * Normally function is called by the Player, using external front-end application.
     *
     * First function check, if Player has Super Pet NFT avaliable to claim. If not, then transaction reverts.
     * Then function check, if Player has sent enough ETH with transaction call to pay ETH mint fee. If not, then transaction reverts.
     * Then function check, if Player has enough FRUIT balance to be able to pay FRUIT mint fee. If not, then transaction reverts.
     * If all conditions above are met, then smart contract make FRUIT mint fee transfer (previous allowance permission is required).
     * Then finally function mint Super Pet NFT to Player's account, with randomly chosen URI data array index.
     * After Super Pet NFT mint succeed, smart contract burn received FRUIT tokens.
     *
     * Function is protected from reentrancy attack, using `nonReentrant` modifier from OpenZeppelin library.
     */
    function superNftClaim() external payable nonReentrant isPlayer {
        // Check if Player has Super Pet NFT to claim
        bool superNftClaimFlag = s_players[player].superNftClaimFlag;
        if (superNftClaimFlag != true) {
            revert GameTokens__NoSuperPetNftToClaim();
        }
        // Check if Player sent enough ETH amount with function call.
        uint256 ethSent = msg.value;
        if (ethSent < SUPER_NFT_MINT_FEE_ETH) {
            revert GameTokens__NotEnoughEthSent(msg.value, SUPER_NFT_MINT_FEE_ETH);
        }
        // Check if player have enough FRUIT required to mint Super Pet NFT [SPET]
        uint256 fruitBalance = s_fruitToken.balanceOf(player);
        if (fruitBalance < SUPER_NFT_MINT_FEE_FRUIT) {
            revert GameTokens__FruitTokensBalanceTooLow(fruitBalance, SUPER_NFT_MINT_FEE_FRUIT);
        }
        // Transfer FRUIT tokens to contract address
        bool transferStatus = s_fruitToken.transferFrom(
            player,
            address(this),
            SUPER_NFT_MINT_FEE_FRUIT
        );
        if (!transferStatus) {
            revert GameTokens__FruitTokensTransferFailed();
        }
        // Burn required amount of Snake NFTs
        for (uint8 i; i < SNAKE_NFTS_REQUIRED; i++) {
            uint256 lastSnakeNftTokenIdIndex = s_stats[player].snakeNftsTokenIds.length - 1;
            s_snakeNft.burn(lastSnakeNftTokenIdIndex);
            s_stats[player].snakeNftsTokenIds.pop();
        }
        // Mint Super Pet NFT token
        uint256 superNftUriIndex = randomNumber(1, s_superPetNftData.uris.length);
        s_superPetNft.safeMint(player, superNftUriIndex);
        uint256 superPetNftTokenId = s_superPetNft.getPlayerNftsTokenId(player);
        s_stats[player].superNftTokenIds.push(superPetNftTokenId);
        s_stats[player].superPetNftsCollected += 1;
        // Burn FRUIT tokens transfered to contract
        s_fruitToken.burn(SNAKE_NFT_MINT_FEE_FRUIT);
    }

    ///////////////////////
    // Private Functions //
    ///////////////////////

    /**
     * @dev Function is used to generate randomly choose index of URI data array.
     *
     * Private function for internal use and can ONLY be called other smart contract GameTokens function.
     *
     * First uses keccak256 hash function to generate pseudo random, integer number in the range specified
     * by input variable `range`.
     *
     * @param _index index of minted NFT, when mint multiple NFTs in for loop
     * @param _range range of the random number
     */
    function randomNumber(uint8 _index, uint256 _range) private view returns (uint256) {
        uint256 random = uint256(
            keccak256(abi.encodePacked(_index, block.difficulty, block.timestamp))
        ) % _range;
        return random;
    }

    /**
     * @dev Function is used to calculate and return appropriate Game Credit purchase fee discount,
     * depending on Player's Super Pet NFT [SPET] balance.
     *
     * Private function for internal use and can ONLY be called other smart contract GameTokens function.
     *
     * @return GameCreditFee discount
     */
    function gameCreditFeeReducer() private view returns (uint8) {
        uint256 superPetNftBalance = s_superPetNft.balanceOf(player);
        if (superPetNftBalance >= 3) return 4;
        if (superPetNftBalance == 2) return 3;
        if (superPetNftBalance == 1) return 2;
        return 0;
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /**
     * @dev Getter function to get SnakeToken contract
     * @return SnakeToken contract
     */
    function getSnakeContractAddress() external view returns (Token) {
        return s_snakeToken;
    }

    /**
     * @dev Getter function to get FruitToken contract
     * @return FruitToken contract
     */
    function getFruitContractAddress() external view returns (Token) {
        return s_fruitToken;
    }

    /**
     * @dev Getter function to get FruitToken contract
     * @return FruitToken contract
     */
    function getSnakeNftContractAddress() external view returns (Nft) {
        return s_snakeNft;
    }

    /**
     * @dev Getter function to get FruitToken contract
     * @return FruitToken contract
     */
    function getSuperPetNftContractAddress() external view returns (Nft) {
        return s_superPetNft;
    }

    /**
     * @dev Getter function to get amount of SNAKE airdrop.
     * @return SNAKE_AIRDROP_AMOUNT amount of SNAKE airdrop
     */
    function getSnakeAirdropAmount() external view returns (uint8) {
        return SNAKE_AIRDROP_AMOUNT;
    }

    /**
     * @dev Getter function to get game credit fee amount.
     * @return GAME_CREDIT_BASE_FEE game credit fee amount
     */
    function getGameCreditBaseFee() external view returns (uint8) {
        return GAME_CREDIT_BASE_FEE;
    }

    /**
     * @dev Getter function to get ETH to SNAKE exchange rate.
     * @return ETH to Snake exchange rate
     */
    function getSnakeEthRate() external pure returns (uint8) {
        return SNAKE_ETH_RATE;
    }

    /**
     * @dev Getter function to get FRUIT to SNAKE exchange rate.
     * @return FRUIT to Snake exchange rate
     */
    function getFruitSnakeRate() external pure returns (uint8) {
        return FRUIT_SNAKE_RATE;
    }

    /**
     * @dev Getter function to get number of Snake NFTs required for claim Super Pet NFT.
     * @return Number of Snake NFTs [SNFT] required to claim Super Pet NFT [SPET]
     */
    function getSnakeNftsRequired() external pure returns (uint8) {
        return SNAKE_NFTS_REQUIRED;
    }

    /**
     * @dev Getter function to get maximum number of Super Pet NFTs [SPET] possible to claim in the game.
     * @return Maximum number of Super Pet NFTs [SPET] possible to claim in the game.
     */
    function getMaxSuperNftsClaim() external pure returns (uint8) {
        return MAX_SUPER_NFTS_CLAIM;
    }

    /**
     * @dev Getter function to get FRUIT mint fee required to mint Snake NFT [SNFT].
     * @return FRUIT mint fee required to claim Snake NFT [SNFT]
     */
    function getSnakeNftMintFeeFruit() external pure returns (uint256) {
        return SNAKE_NFT_MINT_FEE_FRUIT;
    }

    /**
     * @dev Getter function to get FRUIT mint fee required to mint Super Pet NFT [SPET].
     * @return FRUIT mint fee required to claim Supet Pet NFT [SPET]
     */
    function getSuperNftMintFeeFruit() external pure returns (uint256) {
        return SUPER_NFT_MINT_FEE_FRUIT;
    }

    /**
     * @dev Getter function to get ETH mint fee in required to mint Super Pet NFT [SPET].
     * @return ETH mint fee required to claim Supet Pet NFT [SPET]
     */
    function getSuperNftMintFeeEth() external pure returns (uint256) {
        return SUPER_NFT_MINT_FEE_ETH;
    }
}
