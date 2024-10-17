# Faucet

This project implements a Faucet smart contract on the Titan Sepolia network.
It allows users to request tokens at specified intervals.
The contract also supports administrative functions for the owner.

## Features

- **Token Requests**: Users can request supported tokens from the faucet at specified intervals.
- **Ownership Management**: The owner can transfer ownership, set time limits between requests, and set the withdrawal amount.
- **Token Withdrawals**: The owner can withdraw all tokens from the faucet.

## Deployed Contract

### Titan Sepolia
The contract is deployed on the Titan Sepolia network at

## Usage

### Run `locally`

Clone this repository and install hardhat
```shell
    git clone https://github.com/eungu0920/Faucet.git
    npm install --sava-dev hardhat
```

Compile the contracts and run the tests:
```shell
    npx hardhat compile
    npx hardhat test
```

TransparentProxy tests:
```shell
    npx hardhat test test/TransparentProxy.js
```