const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { any } = require("hardhat/internal/core/params/argumentTypes");

describe("Faucet", function () {
    

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

            await expect(Faucet.deploy(zeroTimeLimit))
                .to.be.revertedWithCustomError(Faucet, "TimeLimitCantBeZero");
        });
    });

    describe("Set Token Amount", function () {
        it("Should set the right amount", async function () {
            const { faucet, tonAmount, amount, ton, tos, usdc, usdt } = await loadFixture(deployFaucetFixture);

            expect(await faucet.tokenAmounts(ton.target)).to.equal(tonAmount);
            expect(await faucet.tokenAmounts(tos.target)).to.equal(amount);
            expect(await faucet.tokenAmounts(usdc.target)).to.equal(amount);
            expect(await faucet.tokenAmounts(usdt.target)).to.equal(amount);
        });
    });

    describe("Set Time Limit", function () {
        it("Should set the right time limit", async function () {
            const { faucet } = await loadFixture(deployFaucetFixture);
            const timeLimit = 3600;

            await faucet.setTimeLimit(timeLimit);

            expect(await faucet.timeLimit()).to.equal(timeLimit);
        });

        it("Should fail if the timeLimit is zero", async function () {
            const { faucet } = await loadFixture(deployFaucetFixture);
            const zeroTimeLimit = 0;

            await expect(faucet.setTimeLimit(zeroTimeLimit))
                .to.be.revertedWithCustomError(faucet, "TimeLimitCantBeZero");
        });
    });

    describe("Request Token", function () {
        it("Should request rigth amount token", async function () {
            const { faucet, otherAccount, tonAmount, amount, ton, tos, usdc, usdt } = await loadFixture(deployFaucetFixture);
            
            await faucet.connect(otherAccount).requestToken(ton.target);
            expect(await ton.balanceOf(otherAccount.address)).to.equal(tonAmount);

            await faucet.connect(otherAccount).requestToken(tos.target);
            expect(await tos.balanceOf(otherAccount.address)).to.equal(amount);

            await faucet.connect(otherAccount).requestToken(usdc.target);
            expect(await usdc.balanceOf(otherAccount.address)).to.equal(amount);

            await faucet.connect(otherAccount).requestToken(usdt.target);
            expect(await usdt.balanceOf(otherAccount.address)).to.equal(amount);
        });

        it("Should fail if not passed timeLimit when request token", async function () {
            const { faucet, otherAccount, tonAmount, ton } = await loadFixture(deployFaucetFixture);            
            
            await faucet.connect(otherAccount).requestToken(ton.target);
            expect(await ton.balanceOf(otherAccount.address)).to.equal(tonAmount);

            await expect(faucet.connect(otherAccount).requestToken(ton.target))
                .to.be.revertedWithCustomError(faucet, "TimeLimitHasNotPassed")
                .withArgs(anyValue, anyValue);
        });

        it("Should fail if other token request at faucet", async function () {
            const { faucet, otherAccount } = await loadFixture(deployFaucetFixture);
            const OtherToken = await ethers.getContractFactory("MockERC20");
            const otherToken = await OtherToken.deploy("OTH", "OTH");

            await expect(faucet.connect(otherAccount).requestToken(otherToken.target))
                .to.be.revertedWithCustomError(faucet, "UnsupportedToken");
        });

        it("Should fail if insufficient balacne in faucet", async function () {
            const { faucet, owner, otherAccount, ton } = await loadFixture(deployFaucetFixture);

            await faucet.withdrawToken(ton.target);

            await expect(faucet.connect(otherAccount).requestToken(ton.target))
                .to.be.revertedWithCustomError(faucet, "InsufficientBalanceInFaucet")
                .withArgs(anyValue, anyValue);
        });
    });
    
    describe("Transfer Ownership", function () {
        it("Should transfer onwership to other account", async function () {
            const { faucet, owner, otherAccount } = await loadFixture(deployFaucetFixture);

            await faucet.transferOwnership(otherAccount.address);

            expect(await faucet.owner()).to.equal(otherAccount.address);
        });

        it("Should fail if it isn't the owner", async function () {
            const { faucet, otherAccount } = await loadFixture(deployFaucetFixture);

            await expect(faucet.connect(otherAccount).transferOwnership(otherAccount.address)).to.be.reverted;
        });

        it("Should fail if the other account address is zero", async function () {            
            const { faucet, owner } = await loadFixture(deployFaucetFixture);

            await expect(faucet.transferOwnership(ethers.ZeroAddress)).to.be.reverted;
        });
    });
});