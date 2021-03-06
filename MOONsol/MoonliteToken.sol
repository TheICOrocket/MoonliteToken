pragma solidity 0.4.20;

import './MintableToken.sol';
// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract MoonliteToken is MintableToken {
    string public name = "MoonLite";
    string public symbol = "MNL";
    uint256 public decimals = 18;
}
