// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SuperPetNft is ERC721, ERC721Burnable, Ownable {
    using Counters for Counters.Counter;

    event SuperPetNftMinted(uint256 indexed tokenId);

    Counters.Counter private _tokenIdCounter;

    string public constant TOKEN_URI = "ipfs://";

    constructor() ERC721("Super Pet NFT", "SPET") {}

    function safeMint(address to) external onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        emit SuperPetNftMinted(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return TOKEN_URI;
    }
}
