const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MONToken", function () {
	let monToken;
	let owner;
	let addr1;
	let addr2;

	beforeEach(async function () {
		[owner, addr1, addr2] = await ethers.getSigners();

		const MONToken = await ethers.getContractFactory("MONToken");
		monToken = await MONToken.deploy();
		await monToken.deployed();
	});

	describe("Deployment", function () {
		it("Should set the right owner", async function () {
			expect(await monToken.owner()).to.equal(owner.address);
		});

		it("Should assign the total supply of tokens to the owner", async function () {
			const ownerBalance = await monToken.balanceOf(owner.address);
			expect(await monToken.totalSupply()).to.equal(ownerBalance);
		});

		it("Should have correct name and symbol", async function () {
			expect(await monToken.name()).to.equal("Monad Token");
			expect(await monToken.symbol()).to.equal("MON");
		});
	});

	describe("Minting", function () {
		it("Should allow owner to mint tokens", async function () {
			const mintAmount = ethers.utils.parseEther("1000");
			await monToken.mint(addr1.address, mintAmount);

			expect(await monToken.balanceOf(addr1.address)).to.equal(
				mintAmount,
			);
		});

		it("Should not exceed max supply", async function () {
			const maxSupply = await monToken.MAX_SUPPLY();
			const currentSupply = await monToken.totalSupply();
			const excessAmount = maxSupply.sub(currentSupply).add(1);

			await expect(
				monToken.mint(addr1.address, excessAmount),
			).to.be.revertedWith("Would exceed max supply");
		});

		it("Should fail if non-owner tries to mint", async function () {
			const mintAmount = ethers.utils.parseEther("1000");

			await expect(
				monToken.connect(addr1).mint(addr2.address, mintAmount),
			).to.be.revertedWith("Not authorized to mint");
		});
	});

	describe("Faucet", function () {
		it("Should allow owner to use faucet", async function () {
			const faucetAmount = ethers.utils.parseEther("500");
			await monToken.faucet(addr1.address, faucetAmount);

			expect(await monToken.balanceOf(addr1.address)).to.equal(
				faucetAmount,
			);
		});

		it("Should fail if non-owner tries to use faucet", async function () {
			const faucetAmount = ethers.utils.parseEther("500");

			await expect(
				monToken.connect(addr1).faucet(addr2.address, faucetAmount),
			).to.be.revertedWith("Ownable: caller is not the owner");
		});
	});

	describe("Minter Management", function () {
		it("Should allow owner to add minters", async function () {
			await monToken.addMinter(addr1.address);
			expect(await monToken.minters(addr1.address)).to.be.true;
		});

		it("Should allow minters to mint", async function () {
			await monToken.addMinter(addr1.address);
			const mintAmount = ethers.utils.parseEther("100");

			await monToken.connect(addr1).mint(addr2.address, mintAmount);
			expect(await monToken.balanceOf(addr2.address)).to.equal(
				mintAmount,
			);
		});

		it("Should allow owner to remove minters", async function () {
			await monToken.addMinter(addr1.address);
			await monToken.removeMinter(addr1.address);

			expect(await monToken.minters(addr1.address)).to.be.false;

			const mintAmount = ethers.utils.parseEther("100");
			await expect(
				monToken.connect(addr1).mint(addr2.address, mintAmount),
			).to.be.revertedWith("Not authorized to mint");
		});
	});
});
