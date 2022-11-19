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
error Nft__AlreadyInitialized();
error Nft__ReceivedTransferReverted();
error Nft__InvalidFunctionCall();

////////////////////
// Smart Contract //
////////////////////

/**
 * @title Nft contract
 * @author Dariusz Setlak
 * @dev Smart contract based on Ethereum ERC-721 token standard, created using OpenZeppelin Wizard. Contract inherits
 * all ERC-721 token standard functions from OpenZeppelin library contracts.
 *
 * `Nft` contract inherits `Ownable` contract from OpenZeppelin library, which sets `deployer` as contract `owner`.
 * This means, that ONLY owner will be authorized to call some sensitive contract functions like `mint` or `burn`,
 * which can be obtained by using `onlyOwner` modifier for these functions.
 *
 * Smart contract functions:
 * Init functions: _initializeContract
 * Main functions: safeMint
 * Getter functions: getNftUris, getNftUrisArrayLength, getInitialized, getLatestTokenId
 * Override functions: _burn, tokenURI, supportsInterface, _beforeTokenTransfer
 * Other functions: receive, fallback
 */
contract Nft is ERC721, ERC721URIStorage, ERC721Burnable, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    /////////////////////
    //  NFT variables  //
    /////////////////////

    /// @dev Counter of tokenIds
    Counters.Counter private s_tokenIdCounter;

    /// @dev Array of all avaliable token uris.
    string[] internal s_uris;

    /// @dev Contract initialization flag.
    bool private s_initialized;

    ///////////////////
    //  Constructor  //
    ///////////////////

    /**
     * @dev `Nft` contract constructor passes given parameters to OpenZeppelin library ERC721
     * constructor, which then use them to construct a standard ERC-721 token.
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
        // if (s_initialized) {
        //     revert Nft__AlreadyInitialized();
        // }
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
        uint256 newTokenId = s_tokenIdCounter.current();
        s_tokenIdCounter.increment();
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, s_uris[_uriIndex]);
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /**
     * @dev Getter function to get token URI of given index from token URI's array.
     * @param _index URI's array index
     * @return Value of token URI of given index from token URI's array
     */
    function getNftUris(uint256 _index) public view returns (string memory) {
        return s_uris[_index];
    }

    /**
     * @dev Getter function to get length of token URIs array.
     * @return Public value of token URIs array length.
     */
    function getNftUrisArrayLength() public view returns (uint256) {
        return s_uris.length;
    }

    /**
     * @notice Function checks, if token contract is initialized properly.
     * @dev Getter function to get value of bool variable `s_initialized`, which indicates
     * if token contract is initialized properly.
     * @return Status of `Nft` contract initialization.
     */
    function getInitialized() public view returns (bool) {
        return s_initialized;
    }

    ////////////////////////
    // Override Functions //
    ////////////////////////

    /// @dev The following functions are overrides required by Solidity.

    /**
     * @dev Function overrides _burn function from ERC721 and ERC721URIStorage libraries.
     * @param _tokenId unique id of new minted token
     */
    function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) {
        ERC721URIStorage._burn(_tokenId);
    }

    /**
     * @dev Function overrides tokenURI function from ERC721 and ERC721URIStorage libraries.
     * Function allows to get NFT token URI of given tokenId.
     * @param _tokenId unique id of new minted token
     * @return Value of NFT token URI of given _tokenId
     */
    function tokenURI(uint256 _tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(_tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC721) returns (bool) {}

    /**
     * @dev See {IERC165-supportsInterface}.
     */
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
     * @dev Function executes if unintended ETH transfer received.
     * This contract doesn't allows to receive ETH transfers, thererfore `receive` function
     * reverts all unintended ETH transfers.
     */
    receive() external payable {
        revert Nft__ReceivedTransferReverted();
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
