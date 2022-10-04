// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SuperNft is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    /* Errors */
    error SuperNft__AlreadyInitialized();

    /* NFT Variables */
    Counters.Counter private s_tokenIdCounter;
    string[] private s_superNftUris;
    bool private s_initialized;

    ////////////////////
    //  Constructor   //
    ////////////////////

    constructor(
        string memory superNftNname,
        string memory superNftSymbol,
        string[] memory superNftUris
    ) ERC721(superNftNname, superNftSymbol) {
        _initializeContract(superNftUris);
    }

    function _initializeContract(string[] memory _superNftUris) private {
        if (s_initialized) {
            revert SuperNft__AlreadyInitialized();
        }
        s_superNftUris = _superNftUris;
        s_initialized = true;
    }

    ////////////////////
    // Main Functions //
    ////////////////////

    function safeMint(address _to, uint256 _uriIndex) internal onlyOwner {
        uint256 newTokenId = s_tokenIdCounter.current();
        s_tokenIdCounter.increment();
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, s_superNftUris[_uriIndex]);
    }

    //////////////////////
    // Getter Functions //
    //////////////////////

    // Get SuperNftUris - onlyOwner can call this functions and check this secret data
    function getSuperNftUris(uint256 index) public view onlyOwner returns (string memory) {
        return s_superNftUris[index];
    }

    function getInitialized() public view returns (bool) {
        return s_initialized;
    }

    // Get tokenId of last minted SuperNft
    function getsuperNftsCounter() public view returns (uint256) {
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
