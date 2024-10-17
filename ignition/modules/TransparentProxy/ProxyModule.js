const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule = buildModule("ProxyModule", (m) => {
    const proxyAdminOwner = m.getAccount(0);

    const faucet = m.contract("FaucetV1");

    const proxy = m.contract("FaucetProxyDeployer", [
        faucet
    ])

    

    /*
    const proxyAdminAddress = m.readEventArgument(
        proxy,
        "AdminChanged",
        "newAdmin"
    );
    
    const proxyAdmin = m.contractAt("ProxyAdmin", proxyAdminAddress);
    */

    // return { proxyAdmin, proxy };
    return { proxy };
});

const faucetModule = buildModule("FaucetModule", (m) => {
    // const { proxy, proxyAdmin } = m.useModule(proxyModule);
    const { proxy } = m.useModule(proxyModule);

    const faucet = m.contractAt("FaucetV1", proxy);

    // return { faucet, proxy, proxyAdmin };
    return { faucet, proxy };
});

module.exports = faucetModule;