export const MONAD_TESTNET_CONFIG = {
	chainId: "0x29A", // 666 in hex
	chainName: "Monad Testnet",
	nativeCurrency: {
		name: "MON",
		symbol: "MON",
		decimals: 18,
	},
	rpcUrls: ["https://testnet-rpc.monad.xyz"],
	blockExplorerUrls: ["https://testnet-explorer.monad.xyz"],
};

export const MONAD_MAINNET_CONFIG = {
	chainId: "0xED88", // 60808 in hex
	chainName: "Monad Mainnet",
	nativeCurrency: {
		name: "MON",
		symbol: "MON",
		decimals: 18,
	},
	rpcUrls: ["https://rpc.monad.xyz"],
	blockExplorerUrls: ["https://explorer.monad.xyz"],
};

export const GAME_STATUS = {
	WAITING: 0,
	PLAYING: 1,
	FINISHED: 2,
};

export const PLAYER_TYPE = {
	NONE: 0,
	X: 1,
	O: 2,
};
