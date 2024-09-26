// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./FaucetV1.sol";

contract FaucetV2 is FaucetV1 {
    uint256 public minBalance;

    function setMinBal(uint256 _minBalance) external {
        minBalance = _minBalance;
    }
}