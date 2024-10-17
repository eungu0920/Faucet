// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Faucet } from "../contracts/Faucet.sol";
import { MockERC20 } from "../contracts/MockERC20.sol";

contract FaucetTest is Test {
    uint256 ONE_DAY_IN_SECS = 24 * 60 * 60;
    uint256 timeLimit = ONE_DAY_IN_SECS;

    address owner;
    address otherAccount;

    Faucet public faucet;
    uint256 tonAmount;
    uint256 amount;
    MockERC20 ton;
    MockERC20 tos;
    MockERC20 usdc;
    MockERC20 usdt;

    function setUp() public {
        // Set up owner and other accounts
        owner = address(this);
        otherAccount = address(0x1);

        // Deploy Faucet contract
        faucet = new Faucet(timeLimit);

        // Set token amounts
        tonAmount = 12 * 10 ** 20;
        amount = 1 * 10 ** 20;

        // Deploy and mint MockERC20 tokens
        ton = new MockERC20("TON", "TON");
        ton.mint(address(faucet), 1 * 10 ** 22);
        faucet.setTokenAmount(IERC20(address(ton)), tonAmount);

        tos = new MockERC20("TOS", "TOS");
        tos.mint(address(faucet), 1 * 10 ** 22);
        faucet.setTokenAmount(IERC20(address(tos)), amount);

        usdc = new MockERC20("USDC", "USDC");
        usdc.mint(address(faucet), 1 * 10 ** 22);
        faucet.setTokenAmount(IERC20(address(usdc)), amount);

        usdt = new MockERC20("USDT", "USDT");
        usdt.mint(address(faucet), 1 * 10 ** 22);
        faucet.setTokenAmount(IERC20(address(usdt)), amount);
    }

    function testDeployment() public {
        // Test correct timeLimit setting
        assertEq(faucet.timeLimit(), timeLimit);

        // Test correct owner setting
        assertEq(faucet.owner(), owner);
    }

    function testFailDeploymentWithZeroTimeLimit() public {
        // Test deployment failure with zero time limit
        new Faucet(0);
    }

    function testSetTokenAmount() public {
        // Check set token amounts
        assertEq(faucet.tokenAmounts(IERC20(address(ton))), tonAmount);
        assertEq(faucet.tokenAmounts(IERC20(address(tos))), amount);
        assertEq(faucet.tokenAmounts(IERC20(address(usdc))), amount);
        assertEq(faucet.tokenAmounts(IERC20(address(usdt))), amount);
    }

    function testSetTimeLimit() public {
        uint256 newTimeLimit = 3600;
        faucet.setTimeLimit(newTimeLimit);

        assertEq(faucet.timeLimit(), newTimeLimit);
    }

    function testFailSetTimeLimitToZero() public {
        faucet.setTimeLimit(0);
    }

    function testRequestToken() public {
        vm.startPrank(otherAccount);

        // Request tokens and check balances
        faucet.requestToken(IERC20(address(ton)));
        assertEq(ton.balanceOf(otherAccount), tonAmount);

        faucet.requestToken(IERC20(address(tos)));
        assertEq(tos.balanceOf(otherAccount), amount);

        faucet.requestToken(IERC20(address(usdc)));
        assertEq(usdc.balanceOf(otherAccount), amount);

        faucet.requestToken(IERC20(address(usdt)));
        assertEq(usdt.balanceOf(otherAccount), amount);

        vm.stopPrank();
    }

    function testFailRequestTokenBeforeTimeLimit() public {
        vm.startPrank(otherAccount);

        faucet.requestToken(IERC20(address(ton)));
        assertEq(ton.balanceOf(otherAccount), tonAmount);

        faucet.requestToken(IERC20(address(ton))); // Should revert because time limit hasn't passed
        vm.stopPrank();
    }

    function testFailRequestUnsupportedToken() public {
        MockERC20 otherToken = new MockERC20("OTH", "OTH");

        vm.startPrank(otherAccount);
        faucet.requestToken(IERC20(address(otherToken))); // Should revert
        vm.stopPrank();
    }

    function testFailRequestTokenInsufficientBalance() public {
        faucet.withdrawToken(IERC20(address(ton)));

        vm.startPrank(otherAccount);
        faucet.requestToken(IERC20(address(ton))); // Should revert due to insufficient balance in faucet
        vm.stopPrank();
    }

    function testTransferOwnership() public {
        faucet.transferOwnership(otherAccount);

        assertEq(faucet.owner(), otherAccount);
    }

    function testFailTransferOwnershipIfNotOwner() public {
        vm.prank(otherAccount);
        faucet.transferOwnership(otherAccount); // Should revert
    }

    function testFailTransferOwnershipToZeroAddress() public {
        faucet.transferOwnership(address(0)); // Should revert
    }
}
