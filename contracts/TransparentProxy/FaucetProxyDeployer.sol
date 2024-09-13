// SPDX-Indentifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract FaucetProxyDeployer {
    address public admin;
    address public proxy;

    constructor(address _implementation) {
        ProxyAdmin adminInstance = new ProxyAdmin(msg.sender);
        admin = address(adminInstance);

        bytes memory initialize = abi.encodeWithSignature("initialize(int256)", 3600);

        TransparentUpgradeableProxy proxyInstance = new TransparentUpgradeableProxy(_implementation, admin, initialize);
        proxy = address(proxyInstance);
    }
}