// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//////////////
//  Errors  //
//////////////
error Nft__ReceivedEthTransferReverted();
error Nft__InvalidFunctionCall();

//////////////
//  Errors  //
//////////////
error Nft__AlreadyInitialized();

////////////////////
// Smart Contract //
////////////////////

/**
 * @title Nft contract
 * @author Dariusz Setlak, OpenZeppelin
 * @dev Smart contract based on Ethereum ERC-721 token standard, created using OpenZeppelin Wizard. Contract inherits
 * all ERC-721 token standard functions from OpenZeppelin library contracts.
 *
 * `Nft` contract inherits `Ownable` contract from OpenZeppelin library, which sets `deployer` as contract `owner`.
 * This means, that ONLY owner will be authorized to call some sensitive contract functions like `mint` or `burn`,
 * which can be obtained by using `onlyOwner` modifier for these functions.
 *
 * `Nft` contract is used for creation of two ERC-721 non-fungible game utility tokens: `Snake NFT [SNFT]` and `Super Pet NFT [SPET]`.
 * Both tokens are burnable and mintable, but this functionalities are restricted to use only for contract `owner`, which in our game
 * is `SnakeGame` contract.
 *
 * Smart contract functions:
 * Init functions: _initializeContract
 * Main functions: safeMint
 * Getter functions: getAnyPlayerNfts, getLatestNftTokenId, getNftUris, getInitialized
 * Overriden functions: _burn, tokenURI
 * Other functions: receive, fallback
 */
contract Nft is ERC721, ERC721URIStorage, ERC721Burnable, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    ///////////////////////
    //   NFT variables   //
    ///////////////////////

    /// @dev Counter of tokenIds
    Counters.Counter private s_tokenIdCounter;

    /// @dev Array of all avaliable token uris.
    string[] private s_uris;

    /// @dev Contract initialization flag.
    bool private s_initialized;

    ///////////////////
    //  Constructor  //
    ///////////////////

    /**
     * @dev `Nft` contract constructor passes given parameters to OpenZeppelin library ERC721
     * constructor, which use them to construct a standard ERC-721 token.
     * @param name token name
     * @param symbol token symbol
     * @param uris token uris array
     */
    constructor(
        string memory name,
        string memory symbol,
        string[] memory uris
    ) ERC721(name, symbol) {
        _initializeContract(uris);
    }

    ///////////////////
    // Init Function //
    ///////////////////

    /**
     * @dev Initialization of token URI parameters
     * @param _uris token URI's array
     */
    function _initializeContract(string[] memory _uris) private {
        if (s_initialized) {
            revert Nft__AlreadyInitialized();
        }
        s_uris = _uris;
        s_initialized = true;
    }

    ////////////////////
    // Main Functions //
    ////////////////////

    /**
     * @dev Function `safeMint` allows ONLY `owner` mint new tokens (used `onlyOwner` modifier).
     * Function calls `_safeMint` function from OpenZeppelin contract ERC721 to mint new token to
     * Player's account. After that function calls `_setTokenURI` function from contract
     * ERC721URIStorage to set token URI from `s_uris` array at the index of given number.
     * @param _to Player's address
     * @param _uriIndex `s_uris` array index
     */
    function safeMint(address _to, uint256 _uriIndex) external onlyOwner {
        s_tokenIdCounter.increment();
        uint256 newTokenId = s_tokenIdCounter.current();
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, s_uris[_uriIndex]);
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /**
     * @notice Function checks how many this NFT tokens have been already minted at all.
     * @dev Getter function to get tokenId of latest minted token, which is simultaneously
     * the number of all this NFT tokens that have been already minted at all.
     * @return Public `tokenId` (number of minted tokens) parameter.
     */
    function getLatestNftTokenId() public view returns (uint256) {
        return (s_tokenIdCounter.current());
    }

    /**
     * @dev Internal getter function to get token URI parameter of given array index.
     * Function can ONLY be called by the `owner`, which is smart contract `GameTokens`.
     * @param _index index of `s_uris` array element
     * @return Private URI parameter of given array index.
     */
    function getNftUris(uint256 _index) internal view onlyOwner returns (string memory) {
        return s_uris[_index];
    }

    /**
     * @notice Function to check, if token contract is initialized correctly.
     * @dev Getter function to get value of bool variable `s_initialized`, which indicates
     * if token contract is initialized correctly.
     * @return Public `s_initialized` variable to check `Nft` contract initialization status.
     */
    function getInitialized() public view returns (bool) {
        return s_initialized;
    }

    /////////////////////////
    // Overriden Functions //
    /////////////////////////

    /// @dev The following functions are overrides required by Solidity.

    /**
     * @dev Function overrides ERC721 and ERC721URIStorage libraries functions
     * @param _tokenId unique id of new minted token
     */
    function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(_tokenId);
    }

    /**
     * @dev Function overrides ERC721 and ERC721URIStorage libraries functions
     * @param _tokenId unique id of new minted token
     */
    function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(_tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC721) returns (bool) {
        return interfaceId == type(IERC721Enumerable).interfaceId || super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721Enumerable, ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /////////////////////
    // Other Functions //
    /////////////////////

    /**
     * @notice Receive ETH
     * @dev Functoin executes if unintended ETH transfer received.
     * This contract doesn't allows to receive ETH transfers, thererfore `receive` function
     * reverts all unintended ETH transfers.
     */
    receive() external payable {
        revert Nft__ReceivedEthTransferReverted();
    }

    /**
     * @notice Fallback function
     * @dev Function executes if none of the contract functions match the intended function calls.
     * Function reverts transaction if called function is not found in the contract.
     */
    fallback() external payable {
        revert Nft__InvalidFunctionCall();
    }
}
