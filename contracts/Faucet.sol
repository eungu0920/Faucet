// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice The timelimit shouldn't be zero
error TimeLimitCantBeZero();

/// @notice Insufficient balance for transfer in faucet
/// @param available available balance in faucet
/// @param required required amount to transfer
error InsufficientBalanceInFaucet(uint256 available, uint256 required);

/// @notice Unsupported Token in faucet
error UnsupportedToken();

/// @notice Time Limit has not passed for request token
/// @param currentTime current time
/// @param lastRequestTime last request time of the token
error TimeLimitHasNotPassed(uint256 currentTime, uint256 lastRequestTime);

/// @notice Ether deposits not allowed
error EtherDepositsNotAllowed();

/// @title Faucet Contract
/// @notice This contract allows users to request tokens with a time limit
contract Faucet is Ownable {
    using SafeERC20 for IERC20;
    uint256 public timeLimit;

    mapping(IERC20 => uint256) public tokenAmounts;
    mapping(address => mapping(IERC20 => uint256)) public lastTokenRequestTime;

    /// @notice Emitted when a withdrawal request is made
    /// @param _to The address to which the tokens are sent
    /// @param _token The token that is being withdrawn
    /// @param _amount The amount of tokens withdrawn
    event WithdrawalRequest(address indexed _to, IERC20 indexed _token, uint256 indexed _amount);

    constructor(uint256 _timeLimit) Ownable(msg.sender) {
        require (_timeLimit != 0, TimeLimitCantBeZero());
        timeLimit = _timeLimit;
    }

    /// @notice Fallback function to handle Ether deposits
    receive() external payable {
        revert EtherDepositsNotAllowed();
    }

    /// @notice Requests multiple tokens from the faucet
    /// @param _tokens The tokens to request
    function requestMultipleTokens(IERC20[] calldata _tokens) external returns (bool) {
        for (uint256 i = 0; i < _tokens.length; i++) {
            requestToken(_tokens[i]);
        }

        return true;
    }

    /// @notice Sets the withdrawal amount for a specific token
    /// @param _token The token to set the amount for
    /// @param _amount The new withdrawal amount
    function setTokenAmount(IERC20 _token, uint256 _amount) external onlyOwner {
        tokenAmounts[_token] = _amount;
    }

    /// @notice Sets the time limit between requests
    /// @param _timeLimit The new time limit
    function setTimeLimit(uint256 _timeLimit) external onlyOwner {
        require(_timeLimit != 0, TimeLimitCantBeZero());
        timeLimit = _timeLimit;
    }

    /// @notice Withdraws token from faucet
    function withdrawToken(IERC20 _token) external onlyOwner {
        uint256 balance = _token.balanceOf(address(this));
        
        require(balance > 0, InsufficientBalanceInFaucet(balance, 1));

        _token.safeTransfer(owner(), balance);
    }

    /// @notice Requests a specific token from the faucet
    /// @param _token The token to request
    function requestToken(IERC20 _token) public returns (bool) {
        require(tokenAmounts[_token] != 0, UnsupportedToken());
        require(
            _token.balanceOf(address(this)) >= tokenAmounts[_token],
            InsufficientBalanceInFaucet(_token.balanceOf(address(this)), tokenAmounts[_token])
        );
        require(
            block.timestamp >= lastTokenRequestTime[msg.sender][_token] + timeLimit,
            TimeLimitHasNotPassed(block.timestamp, lastTokenRequestTime[msg.sender][_token])
        );

        lastTokenRequestTime[msg.sender][_token] = block.timestamp;
        _token.safeTransfer(msg.sender, tokenAmounts[_token]);

        emit WithdrawalRequest(msg.sender, _token, tokenAmounts[_token]);

        return true;
    }
}