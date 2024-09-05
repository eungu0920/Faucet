const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Faucet", function () {
    async function deployFaucetFixture() {
        const ONE_DAY_IN_SECS = 24 * 60 * 60;

        const timeLimit = ONE_DAY_IN_SECS;
        const [owner, otherAccount] = await ethers.getSigners();

        const Faucet = await ethers.getContractFactory("Faucet");
        const faucet = await Faucet.deploy(timeLimit);

        const TON = await ethers.getContractFactory("MockERC20");
        const ton = await TON.deploy("TON", "TON");
        await ton.mint(faucet.target, ethers.parseUnits("1", 22));

        const TOS = await ethers.getContractFactory("MockERC20");
        const tos = await TOS.deploy("TOS", "TOS");
        await tos.mint(faucet.target, ethers.parseUnits("1", 22));

        const USDC = await ethers.getContractFactory("MockERC20");
        const usdc = await USDC.deploy("USDC", "USDC");
        await usdc.mint(faucet.target, ethers.parseUnits("1", 22));

        const USDT = await ethers.getContractFactory("MockERC20");
        const usdt = await USDT.deploy("USDT", "USDT");
        await usdt.mint(faucet.target, ethers.parseUnits("1", 22));
        
        return { faucet, timeLimit, owner, otherAccount, ton, tos, usdc, usdt };
    }

    describe("Deployment", function () {
        it("Should set the right timeLimit", async function () {
            const { faucet, timeLimit } = await loadFixture(deployFaucetFixture);

            expect(await faucet.timeLimit()).to.equal(timeLimit);
        });

        it("Should set the right owner", async function () {
            const { faucet, owner } = await loadFixture(deployFaucetFixture);

            expect(await faucet.owner()).to.equal(owner.address);
        });

        it("Should fail if the timeLimit is zero", async function () {
            const zeroTimeLimit = 0;
            const Faucet = await ethers.getContractFactory("Faucet");
            await expect(Faucet.deploy(zeroTimeLimit)).to.be.revertedWith(
                "The timeLimit shouldn't be zero"
            );
        });
    });

    describe("Set Token Amount", function () {
        it("Should set the right amount", async function () {
            const { faucet, ton, tos, usdc, usdt } = await loadFixture(deployFaucetFixture);
            const tonAmount = ethers.parseUnits("12", 20);
            const amount = ethers.parseUnits("1", 20);

            await faucet.setTokenAmount(ton.target, tonAmount);
            expect(await faucet.tokenAmounts(ton.target)).to.equal(tonAmount);

            await faucet.setTokenAmount(tos.target, amount);
            expect(await faucet.tokenAmounts(tos.target)).to.equal(amount);

            await faucet.setTokenAmount(usdc.target, amount);
            expect(await faucet.tokenAmounts(usdc.target)).to.equal(amount);

            await faucet.setTokenAmount(usdt.target, amount);
            expect(await faucet.tokenAmounts(usdt.target)).to.equal(amount);
        });
    });

    describe("Transfer Ownership", function () {
        it("Should transfer onwership to other account", async function () {
            const { faucet, owner, otherAccount } = await loadFixture(deployFaucetFixture);

            await faucet.transferOwnership(otherAccount.address);

            expect(await faucet.owner()).to.equal(otherAccount.address);
        });

        it("Should fail if the other account address is zero", async function () {            
            const { faucet, owner } = await loadFixture(deployFaucetFixture);

            await expect(faucet.transferOwnership(ethers.ZeroAddress)).to.be.revertedWith(
                "New owner can't be zero address"
            );
        });
    });
});