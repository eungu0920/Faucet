const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { any } = require("hardhat/internal/core/params/argumentTypes");
const { upgrades } = require("hardhat");

// const { ethers, upgrades } = require('hardhat');

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

        // console.log(owner.address);

        const currentImplAddress = await upgrades.erc1967.getImplementationAddress(proxycontract.target);
        console.log("currentImplAddress >> ", currentImplAddress);


        // console.log(">>>>>>>> ", proxiedFaucet);

        // const faucet = await upgrades.deployProxy(Faucet, [timeLimit], {
        //     initializer: "initialize",
        // });

        // await faucet.deployed();

        // console.log(`Implemetation address deployed to ${ await faucet.target }`);

        // const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
        //     faucet.target
        // );
        // console.log("currentImplAddress >> ", currentImplAddress);

        // const currentAdminAddress = await upgrades.erc1967.getAdminAddress(
        //     faucet.target
        // );

        // console.log("currentAdminAddress >> ", currentAdminAddress);

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

    // describe("Upgrade Contract", function () {
    //     it("Success upgrade Contract", async function () {
    //         const { faucet } = await loadFixture(deployFaucetFixture);
            
    //         const FaucetV2 = await ethers.getContractFactory("FaucetV2");
    //         console.log("Upgrading Faucet...");
    //         await upgrades.upgradeProxy(faucet.target, FaucetV2);
    //         console.log("faucet Address >> ", faucet.target);

    //         const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
    //             faucet.target
    //         );
    //         console.log("currentImplAddress >> ", currentImplAddress);
    
    //         const currentAdminAddress = await upgrades.erc1967.getAdminAddress(
    //             faucet.target
    //         );
    
    //         console.log("currentAdminAddress >> ", currentAdminAddress);
    //     })
    // })
});