const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { any } = require("hardhat/internal/core/params/argumentTypes");
const { upgrades } = require("hardhat");

describe("TransparentProxy", function () {
    async function deployFaucetFixture() {
        const ONE_DAY_IN_SECS = 24 * 60 * 60;

        const timeLimit = ONE_DAY_IN_SECS;
        const [owner, otherAccount] = await ethers.getSigners();

        const Faucet = await ethers.getContractFactory("FaucetV1");
        console.log('Deploying Faucet...');

        const faucet = await Faucet.deploy();
        console.log(`faucet contract is deployed \nAddress >> ${ await faucet.target }\n`);

        const FaucetDeployer = await ethers.getContractFactory("FaucetProxyDeployer");
        console.log(`Deploying FaucetDepoyer...`)

        const faucetDeployer = await FaucetDeployer.deploy(faucet.target);
        console.log(`faucet contract is deployed \ndeployer address >> ${await faucetDeployer.target}\n`);

        const adminProxy = await faucetDeployer.admin();
        const proxycontract = await faucetDeployer.proxy();

        console.log(`adminProxy address >> ${adminProxy}`);
        console.log(`proxyContract address >> ${proxycontract}\n`);

        const proxiedFaucet = await faucet.attach(proxycontract);

        console.log(await proxiedFaucet.timeLimit());

        return { proxiedFaucet } ;
    }

    describe("Deployment", function () {
        it("Should set the right timeLimit", async function () {
            const { proxiedFaucet } = await loadFixture(deployFaucetFixture);
            console.log("Address >> ", await proxiedFaucet.target);
            expect(await proxiedFaucet.timeLimit()).to.equal(86400);
        });
    });

    describe("Contract Upgrade", function () {
        it("Should", async function () {
            const { proxiedFaucet } = await loadFixture(deployFaucetFixture);

            console.log("owner >> ", await proxiedFaucet.owner());

        });
    });
});