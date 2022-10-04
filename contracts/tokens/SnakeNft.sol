// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SnakeNft is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    /* Errors */
    error SnakeNft__AlreadyInitialized();

    /* NFT Variables */
    Counters.Counter private s_tokenIdCounter;
    string[] private s_snakeNftUris;
    bool private s_initialized;

    ////////////////////
    //  Constructor   //
    ////////////////////

    constructor(
        string memory snakeNftNname,
        string memory snakeNftSymbol,
        string[] memory snakeNftUris
    ) ERC721(snakeNftNname, snakeNftSymbol) {
        _initializeContract(snakeNftUris);
    }

    function _initializeContract(string[] memory _snakeNftUris) private {
        if (s_initialized) {
            revert SnakeNft__AlreadyInitialized();
        }
        s_snakeNftUris = _snakeNftUris;
        s_initialized = true;
    }

    ////////////////////
    // Main Functions //
    ////////////////////

    function safeMint(address _to, uint256 _uriIndex) public onlyOwner {
        uint256 newTokenId = s_tokenIdCounter.current();
        s_tokenIdCounter.increment();
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, s_snakeNftUris[_uriIndex]);
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    // Get SnakeNftUris - onlyOwner can call this functions and check this secret data
    function getSnakeNftUris(uint256 index) public view onlyOwner returns (string memory) {
        return s_snakeNftUris[index];
    }

    function getInitialized() public view returns (bool) {
        return s_initialized;
    }

    // Get tokenId of last minted SnakeNft
    function getSnakeNftsCounter() public view returns (uint256) {
        return (s_tokenIdCounter.current() - 1);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
