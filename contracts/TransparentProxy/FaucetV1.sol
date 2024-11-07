// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice The timelimit shouldn't be zero
error TimeLimitCantBeZero();

/**
 * @notice Insufficient minimum ETH balacne for request tokens in wallet
 * @param available available ETH balance in wallet
 * @param required required amount to request
 */
error InsufficientEthBalanceOfWallet(uint256 available, uint256 required);

/**
 * @notice Insufficient balance for transfer in faucet
 * @param available available balance in faucet
 * @param required required amount to transfer
 */
error InsufficientBalanceInFaucet(uint256 available, uint256 required);

/// @notice Unsupported Token in faucet
error UnsupportedToken();

/**
 * @notice Time Limit has not passed for request token
 * @param currentTime current time
 * @param lastRequestTime last request time of the token 
 */
error TimeLimitHasNotPassed(uint256 currentTime, uint256 lastRequestTime);

/// @notice Ether deposits not allowed
error EtherDepositsNotAllowed();

/**
 * @title Faucet Contract
 * @author Peter Choi
 * @notice This contract allows users to request tokens with a time limit
 */
contract FaucetV1 is Initializable, OwnableUpgradeable {
    using SafeERC20 for IERC20;
    uint256 public timeLimit;

    mapping(IERC20 => uint256) public tokenAmounts;
    mapping(address => mapping(IERC20 => uint256)) public lastTokenRequestTime;

    /**
     * @notice Emitted when a withdrawal request is made
     * @param _to The address to which the tokens are sent
     * @param _token The token that is being withdrawn
     * @param _amount The amount of tokens withdrawn
     */
    event WithdrawalRequest(address indexed _to, IERC20 indexed _token, uint256 indexed _amount);

    /// @notice Fallback function to handle Ether deposits
    receive() external payable {
        revert EtherDepositsNotAllowed();
    }

    ///////////////////////////////////////////////
    //                 initialize                //
    ///////////////////////////////////////////////

    /**
     * @notice Initialize for proxy contract
     * @param _timeLimit The time limit to request token
     */
    function initialize(uint256 _timeLimit, address _initialOwner) public initializer {
        __Ownable_init(_initialOwner);
        require (_timeLimit != 0, TimeLimitCantBeZero());
        timeLimit = _timeLimit;
    }

    ///////////////////////////////////////////////
    //                  external                 //
    ///////////////////////////////////////////////

    
    ///////////////////////////////////////////////
    //                   public                  //
    ///////////////////////////////////////////////

    /**
     * @notice Requests a specific token from the faucet
     * @param _token The token to request
     */
    function requestToken(IERC20 _token) public returns (bool) {
        uint256 minEthBalance = 0.1 ether;

        require(
            msg.sender.balance >= minEthBalance,
            InsufficientEthBalanceOfWallet(msg.sender.balance, minEthBalance)
        );
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