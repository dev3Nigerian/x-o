import { ethers } from "ethers";

export const formatAddress = (address) => {
	if (!address) return "";
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatMON = (amount) => {
	if (!amount) return "0";
	return parseFloat(amount).toFixed(2);
};

export const formatTimeAgo = (timestamp) => {
	const now = Math.floor(Date.now() / 1000);
	const diff = now - timestamp;

	if (diff < 60) return "Just now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	return `${Math.floor(diff / 86400)}d ago`;
};

export const parseTokenAmount = (amount, decimals = 18) => {
	return ethers.utils.parseUnits(amount.toString(), decimals);
};

export const formatTokenAmount = (amount, decimals = 18) => {
	return ethers.utils.formatUnits(amount, decimals);
};

export const isValidAddress = (address) => {
	return ethers.utils.isAddress(address);
};

export const getExplorerUrl = (hash, type = "tx", network = "testnet") => {
	const baseUrl =
		network === "mainnet"
			? "https://explorer.monad.xyz"
			: "https://testnet-explorer.monad.xyz";
	return `${baseUrl}/${type}/${hash}`;
};
