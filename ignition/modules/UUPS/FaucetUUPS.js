const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const ONE_DAY_IN_SECS = 60 * 60 * 24;

module.exports = buildModule("FaucetModule", (m) => {
    const timeLimit = m.getParameter("timeLimit", ONE_DAY_IN_SECS);
    const faucet = m.contract("FaucetUUPS", [timeLimit]);

    return { faucet };
});