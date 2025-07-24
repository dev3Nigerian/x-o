require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		version: "0.8.19",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		hardhat: {
			chainId: 1337,
		},
		"monad-testnet": {
			url:
				process.env.MONAD_TESTNET_RPC ||
				"https://testnet-rpc.monad.xyz",
			accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
			chainId: 10143,
			gasPrice: "auto", // Let Hardhat determine gas price automatically
			gas: "auto", // Let Hardhat determine gas limit automatically
		},
		"monad-mainnet": {
			url: process.env.MONAD_MAINNET_RPC || "https://rpc.monad.xyz",
			accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
			chainId: 714, // This might also need updating
			gasPrice: parseInt(process.env.GAS_PRICE || "20000000000"),
			gas: parseInt(process.env.GAS_LIMIT || "5000000"),
		},
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
	gasReporter: {
		enabled: true,
		currency: "USD",
	},
};
