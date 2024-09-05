// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Faucet Contract
/// @notice This contract allows users to request tokens with a time limit
contract Faucet is Ownable {
    using SafeERC20 for IERC20;
    uint256 public timeLimit;
    IERC20[] public tokens;

    mapping(IERC20 => uint256) public tokenAmounts;
    mapping(address => mapping(IERC20 => uint256)) public lastTokenRequestTime;

    event WithdrawalRequest(address indexed _to, IERC20 indexed _token, uint256 indexed _amount);

    constructor(uint256 _timeLimit) Ownable(msg.sender) {
        require(_timeLimit != 0, "The timeLimit shouldn't be zero");
        timeLimit = _timeLimit;
    }

    /// @notice Requests a specific token from the faucet
    /// @param _token The token to request
    function requestToken(IERC20 _token) external returns (bool) {
        require(tokenAmounts[_token] != 0, "Token is not supported by faucet");
        require(_token.balanceOf(address(this)) >= tokenAmounts[_token], "Not enough balance in faucet");
        // uint256 lastRequest = lastTokenRequestTime[msg.sender][_token];
        require(block.timestamp >= lastTokenRequestTime[msg.sender][_token] + timeLimit, "Time limit has not passed");

        lastTokenRequestTime[msg.sender][_token] = block.timestamp;
        _token.safeTransfer(msg.sender, tokenAmounts[_token]);

        emit WithdrawalRequest(msg.sender, _token, tokenAmounts[_token]);

        return true;
    }

    /// @notice Sets the withdrawal amount for a specific token
    /// 배열에 넣는 이유는 나중에 한꺼번에 출금하기 위함
    /// @param _token The token to set the amount for
    /// @param _amount The new withdrawal amount
    function setTokenAmount(IERC20 _token, uint256 _amount) external onlyOwner {
        tokenAmounts[_token] = _amount;

        bool tokenExists = false;

        if ( tokens.length != 0 ) {
            for (uint8 i = 0; i < tokens.length; i++) {
                if (tokens[i] == _token) {
                tokenExists = true;
                break;
                }
            }
        }

        if (!tokenExists) {
            tokens.push(_token);
        }
    }

    function setTimeLimit(uint256 _timeLimit) external onlyOwner {
        require(_timeLimit != 0, "The timeLimit shouldn't be zero");
        timeLimit = _timeLimit;
    }

    function withdrawalAll() external onlyOwner {
        if (address(this).balance > 0) {
            payable(owner()).transfer(address(this).balance);
        }

        for (uint8 i = 0; i < tokens.length; i++) {
            _withdrawToken(tokens[i]);
        }
    }

    function transferOwnership(address newOwner) public override onlyOwner {
        require(newOwner != address(0), "New owner can't be zero address");
        super.transferOwnership(newOwner);
    }

    function _withdrawToken(IERC20 _token) internal {
        uint256 balance = _token.balanceOf(address(this));

        if (balance > 0) {
            _token.safeTransfer(owner(), balance);
        }
    }

}