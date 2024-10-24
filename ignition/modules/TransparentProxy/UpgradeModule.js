const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ProxyModule = require("./ProxyModule");

const upgradeModule = buildModule("UpgradeModule", (m) => {
    const proxyAdminOwner = m.getAccount(0);

    const { proxyAdmin, proxy } = m.useModule(ProxyModule);

    const faucetV2 = m.contract("FaucetV2");

    const encodeFunctionCall = m.encodeFunctionCall(faucetV2, "")

    m.call(proxyAdmin, "upgradeAndCall", [proxy, faucetV2], {
        from: proxyAdminOwner,
    });

    return { proxyAdmin, proxy };
});

const faucetV2Module = buildModule("FaucetV2Module", (m) => {
    const { proxy } = m.useModule(upgradeModule);

    const faucet = m.contract("FuacetV2", proxy);

    return { faucet };
});

module.exports = faucetV2Module;