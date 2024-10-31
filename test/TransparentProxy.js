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

        const tonAmount = ethers.parseUnits("12", 20);
        const amount = ethers.parseUnits("1", 20);

        const TON = await ethers.getContractFactory("MockERC20");
        const ton = await TON.deploy("TON", "TON");
        await ton.mint(proxiedFaucet.target, ethers.parseUnits("1", 22));
        await proxiedFaucet.setTokenAmount(ton.target, tonAmount);

        const USDT = await ethers.getContractFactory("MockERC20");
        const usdt = await USDT.deploy("USDT", "USDT");
        await usdt.mint(proxiedFaucet.target, ethers.parseUnits("1", 22));
        await proxiedFaucet.setTokenAmount(usdt.target, amount);

        return { proxiedFaucet, owner, otherAccount, tonAmount, amount, ton, usdt } ;
    }

    describe("Deployment", function () {
        it("Should set the right timeLimit", async function () {
            const { proxiedFaucet } = await loadFixture(deployFaucetFixture);
            console.log("Address >> ", await proxiedFaucet.target);
            expect(await proxiedFaucet.timeLimit()).to.equal(86400);
        });
        
        it("Should set the right owner", async function () {
            const { proxiedFaucet, owner } = await loadFixture(deployFaucetFixture);

            expect(await proxiedFaucet.owner()).to.equal(owner.address);
        });
    });

    describe("Set Token Amount", function () {
        it("Should set the right amount", async function () {
            const { proxiedFaucet, tonAmount, amount, ton, usdt } = await loadFixture(deployFaucetFixture);

            expect(await proxiedFaucet.tokenAmounts(ton.target)).to.equal(tonAmount);
            expect(await proxiedFaucet.tokenAmounts(usdt.target)).to.equal(amount);
        });
    });

    describe("Set Time Limit", function () {
        it("Should set the right time limit", async function () {
            const { proxiedFaucet } = await loadFixture(deployFaucetFixture);
            const timeLimit = 3600;

            await proxiedFaucet.setTimeLimit(timeLimit);

            expect(await proxiedFaucet.timeLimit()).to.equal(timeLimit);
        });

        it("Should fail if the timeLimit is zero", async function () {
            const { proxiedFaucet } = await loadFixture(deployFaucetFixture);
            const zeroTimeLimit = 0;

            await expect(proxiedFaucet.setTimeLimit(zeroTimeLimit))
                .to.be.revertedWithCustomError(proxiedFaucet, "TimeLimitCantBeZero");
        });
    });

    describe("Request Token", function () {
        it("Should request rigth amount token", async function () {
            const { proxiedFaucet, otherAccount, tonAmount, amount, ton, usdt } = await loadFixture(deployFaucetFixture);

            await proxiedFaucet.connect(otherAccount).requestToken(ton.target);
            expect(await ton.balanceOf(otherAccount.address)).to.equal(tonAmount);

            await proxiedFaucet.connect(otherAccount).requestToken(usdt.target);
            expect(await usdt.balanceOf(otherAccount.address)).to.equal(amount);
        });

        it("Should fail if not passed timeLimit when request token", async function () {
            const { proxiedFaucet, otherAccount, tonAmount, ton} = await loadFixture(deployFaucetFixture);

            await proxiedFaucet.connect(otherAccount).requestToken(ton.target);
            expect(await ton.balanceOf(otherAccount.address)).to.equal(tonAmount);

            await expect(proxiedFaucet.connect(otherAccount).requestToken(ton.target))
                .to.be.revertedWithCustomError(proxiedFaucet, "TimeLimitHasNotPassed")
                .withArgs(anyValue, anyValue);
        });

        it("Should fail if other token request at faucet", async function () {
            const { proxiedFaucet, otherAccount } = await loadFixture(deployFaucetFixture);
            const OtherToken = await ethers.getContractFactory("MockERC20");
            const otherToken = await OtherToken.deploy("OTH", "OTH");

            await expect(proxiedFaucet.connect(otherAccount).requestToken(otherToken.target))
                .to.be.revertedWithCustomError(proxiedFaucet, "UnsupportedToken");
        });

        it("Should fail if insufficient balance in faucet", async function () {
            const { proxiedFaucet, owner, otherAccount, ton } = await loadFixture(deployFaucetFixture);

            await proxiedFaucet.withdrawToken(ton.target);

            await expect(proxiedFaucet.connect(otherAccount).requestToken(ton.target))
                .to.be.revertedWithCustomError(proxiedFaucet, "InsufficientBalanceInFaucet")
                .withArgs(anyValue, anyValue);
        });
    });

    describe("Transfer Ownership", function () {
        it("Should transfer ownership to other account", async function () {
            const { proxiedFaucet, owner, otherAccount } = await loadFixture(deployFaucetFixture);

            await proxiedFaucet.transferOwnership(otherAccount.address);

            expect(await proxiedFaucet.owner()).to.equal(otherAccount.address);
        });

        it("Should fail if it isn't the owner", async function () {
            const { proxiedFaucet, otherAccount } = await loadFixture(deployFaucetFixture);

            await expect(proxiedFaucet.connect(otherAccount).transferOwnership(otherAccount.address)).to.be.reverted;
        });

        it("Should fail if the owner account address is zero", async function () {
            const { proxiedFaucet, owner } = await loadFixture(deployFaucetFixture);

            await expect(proxiedFaucet.transferOwnership(ethers.ZeroAddress)).to.be.reverted;
        });
    });

});