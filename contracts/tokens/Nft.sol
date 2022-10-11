// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

//////////////
//  Errors  //
//////////////
error Nft__AlreadyInitialized();

/**
 * @title Nft contract
 * @author Dariusz Setlak, OpenZeppelin
 * @dev Smart contract based on Ethereum ERC-721 token standard, created using OpenZeppelin Wizard.
 * Nft contract inherits all ERC-721 token standard functions from OpenZeppelin library.
 *
 * `Nft` instances are deployed by smart contract `GameTokens`, which is an `owner` of `Nft` contract
 * and only this contract is authorized to call some sensitive functions like `safeMint`, which is
 * obtained by using `onlyOwner` modifier for these functions.
 *
 * Smart contract is used to create two game utility ERC-721 non-fungible tokens (NFTs): Snake Nft Token [SNFT]
 * and Super Pet Nft Token [SPET]. Both tokens are burnable and mintable, what is restricted only for
 * these contracts' `owner` (smart contract GameTokens).
 */
contract Nft is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    ////////////////
    //  Mappings  //
    ////////////////

    /// @dev Mapping Player address to last minted NFT tokenId
    mapping(address => uint256) internal s_lastNftTokenId;

    ///////////////////////
    //   NFT variables   //
    ///////////////////////
    Counters.Counter private s_tokenIdCounter;
    string[] private s_uris;
    bool private s_initialized;

    ////////////////////
    //  Constructor   //
    ////////////////////

    /**
     * @dev `Nft` contract constructor passes given parameters to OpenZeppelin library ERC721 constructor,
     * which use them to constructs a standard ERC-721 token.
     * @param name given name of new token
     * @param symbol given symbol of new token
     * @param uris given token URIs array data
     */
    constructor(
        string memory name,
        string memory symbol,
        string[] memory uris
    ) ERC721(name, symbol) {
        _initializeContract(uris);
    }

    /**
     * @dev Initialization of token URI parameters
     * @param _uris given token URIs array data
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
     * @dev Function safeMint allows ONLY `owner` mint new tokens (modifier onlyOwner used).
     * Function calls `_safeMint` function from ERC721 library to mint new token for player
     * and after that calls `_setTokenURI` function from ERC721URIStorage library to set new
     * token URI from s_uris array at the index of given "pseudo random" number.
     * @param _to given address of Player
     * @param _uriIndex given "pseudo random" index of s_uris array
     */
    function safeMint(address _to, uint256 _uriIndex) external onlyOwner {
        uint256 newTokenId = s_tokenIdCounter.current();
        s_tokenIdCounter.increment();
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, s_uris[_uriIndex]);
        s_lastNftTokenId[_to] = newTokenId;
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    /**
     * @dev Getter function to get Player's last minted NFT tokenId.
     * @param _player the Player's address
     * @return Player's last minted NFT tokenId
     */
    function getPlayerNftsTokenId(address _player) external view returns (uint256) {
        return s_lastNftTokenId[_player];
    }

    /**
     * @dev Getter function to get token URI parameter of given array index.
     * Can ONLY be called by `owner` of smart contract, which is smart contract `GameTokens`.
     * @param _index number of array's element
     * @return Private URI parameter of given array index.
     */
    function getNftUris(uint256 _index) public view onlyOwner returns (string memory) {
        return s_uris[_index];
    }

    /**
     * @notice Function to check, if token contract is initialized correctly.
     * @dev Getter function to get bool variable s_initialized, which indicates if token
     * is initialized correctly.
     * @return Public token initialization check parameter.
     */
    function getInitialized() public view returns (bool) {
        return s_initialized;
    }

    /**
     * @notice Function to check how many tokens have been already minted at all.
     * @dev Getter function to get tokenId of latest minted token, which is simultaneously
     * the number of all tokens that have been already minted at all.
     * @return Public tokenId (number of minted tokens) parameter.
     */
    function getLatestNftTokenCounter() public view returns (uint256) {
        return (s_tokenIdCounter.current() - 1);
        // We substract -1, because tokenId is already prepared for next token mint
    }

    /// @dev The following functions are overrides required by Solidity.

    /**
     * @dev Function overrides ERC721 and ERC721URIStorage libraries functions
     * @param _tokenId id of new minted token
     */
    function _burn(uint256 _tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(_tokenId);
    }

    /**
     * @dev Function overrides ERC721 and ERC721URIStorage libraries functions
     * @param _tokenId id of new minted token
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(_tokenId);
    }
}
