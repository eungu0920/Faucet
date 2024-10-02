// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../contracts/Faucet.sol";
import {MockERC20} from "../lib/forge-std/src/mocks/MockERC20.sol";

contract Token_ERC20 is MockERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals) {
        initialize(name, symbol, decimals);
    }

    function mint(address to, uint256 value) public virtual {
        _mint(to, value);
    }
}

contract TransparentProxyFacuetTest is Test {
    Faucet public faucet;
    Token_ERC20 ton;

    function setUp() public {
        uint256 timeLimit = 86400;
        faucet = new Faucet(timeLimit);
        ton = new Token_ERC20("Tokamak Network", "TON", 18);
    }

    function invarianMetadata() public view {
        assertEq(ton.name(), "Tokamak Network");
        assertEq(ton.symbol(), "TON");
        assertEq(ton.decimals(), 20);
    }

    function testMetadata(string calldata name, string calldata symbol, uint8 decimals) public {
        Token_ERC20 tkn = new Token_ERC20(name, symbol, decimals);
        assertEq(tkn.name(), name);
        assertEq(tkn.symbol(), symbol);
        assertEq(tkn.decimals(), decimals);
    }

    function test_timeLimitIs86400() public {
        assertEq(faucet.timeLimit(), 86400);
    }

    function test_changeTimeLimit() public {
        faucet.setTimeLimit(3600);
        assertEq(faucet.timeLimit(), 3600);
    }
    

}