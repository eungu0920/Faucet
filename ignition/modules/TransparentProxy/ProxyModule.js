const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyModule", (m) => {
    const proxyAdminOwner = m.getAccount(0);

    const faucet = m.contract("FaucetV1");

    const proxy = m.contract("TransparentUpgradeableProxy", [
        faucet,
        proxyAdminOwner,
        "0xfe4b84df0000000000000000000000000000000000000000000000000000000000000e10",
    ]);

    const proxyAdminAddress = m.readEventArgument(
        proxy,
        "AdminChanged",
        "newAdmin"
    );

    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);

    return { proxyAdmin, proxy };
});

const faucetModule = buildModule("FaucetModule", (m) => {
    const { proxy, proxyAdmin } = m.useModule(proxyModule);

    const faucet = m.contractAt("FaucetV1", proxy);

    return { faucet, proxy, proxyAdmin };
});

module.exports = faucetModule;