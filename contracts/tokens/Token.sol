// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

///////////////
//  Imports  //
///////////////
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

////////////////////
// Smart Contract //
////////////////////

/**
 * @title Token contract
 * @author Dariusz Setlak, OpenZeppelin
 * @dev Smart contract based on Ethereum ERC-20 token standard, created using OpenZeppelin Wizard.
 * Token contract inherits all ERC-20 token standard functions from OpenZeppelin library.
 *
 * Token instances are deployed by smart contract `GameTokens`, which is an `owner` of Token contract
 * and only this contract is authorized to call some sensitive functions like `mint`, which is
 * obtained by using `onlyOwner` modifier for these functions.
 *
 * Smart contract is used to create two game utility ERC-20 tokens: Snake Token [SNAKE] and Fruit Token [FRUIT].
 * Both tokens have 0 decimals, what is obtained by override function `decimals`. Both tokens are also burnable
 * and mintable, what is restricted only for contract `owner` (smart contract GameTokens).
 */
contract Token is ERC20, ERC20Burnable, Ownable {
    ///////////////////
    //  Constructor  //
    ///////////////////

    /**
     * @dev `Token` contract constructor passes given parameters to OpenZeppelin library ERC20 constructor,
     * which use them to constructs a standard ERC-20 token.
     * @param name given name of new token
     * @param symbol given symbol of new token
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    ////////////////////
    // Main Functions //
    ////////////////////

    /**
     * @dev Function mint allows ONLY `owner` mint new tokens (modifier onlyOwner used).
     * Function calls `_mint` function from standard OpenZeppelin library ERC20.
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * @dev Function decimals override standard OpenZeppelin library and returns new token decimal value 0,
     * instead of standard value 18, what is needed for this project.
     * @return Number of token decimals.
     */
    function decimals() public view virtual override returns (uint8) {
        return 0;
    }
}
