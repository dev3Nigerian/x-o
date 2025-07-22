import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const MONAD_TESTNET_CONFIG = {
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

export const useWallet = () => {
	const [account, setAccount] = useState("");
	const [provider, setProvider] = useState(null);
	const [signer, setSigner] = useState(null);
	const [chainId, setChainId] = useState(null);
	const [isConnected, setIsConnected] = useState(false);
	const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const isMetaMaskInstalled = useCallback(() => {
		return (
			typeof window !== "undefined" &&
			typeof window.ethereum !== "undefined"
		);
	}, []);

	const connectWallet = useCallback(async () => {
		if (!isMetaMaskInstalled()) {
			setError(
				"MetaMask is not installed. Please install MetaMask to continue.",
			);
			return false;
		}

		try {
			setLoading(true);
			setError("");

			// Request account access
			const accounts = await window.ethereum.request({
				method: "eth_requestAccounts",
			});

			if (accounts.length === 0) {
				throw new Error("No accounts found");
			}

			// Initialize provider and signer
			const web3Provider = new ethers.providers.Web3Provider(
				window.ethereum,
			);
			const web3Signer = web3Provider.getSigner();
			const network = await web3Provider.getNetwork();

			setAccount(accounts[0]);
			setProvider(web3Provider);
			setSigner(web3Signer);
			setChainId(network.chainId);
			setIsConnected(true);
			setIsCorrectNetwork(network.chainId === 666);

			return true;
		} catch (error) {
			console.error("Error connecting wallet:", error);
			setError(error.message || "Failed to connect wallet");
			return false;
		} finally {
			setLoading(false);
		}
	}, [isMetaMaskInstalled]);

	const switchToMonadNetwork = useCallback(async () => {
		if (!isMetaMaskInstalled()) {
			setError("MetaMask is not installed");
			return false;
		}

		try {
			setLoading(true);
			setError("");

			// Try to switch to Monad testnet
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
			});

			setIsCorrectNetwork(true);
			return true;
		} catch (error) {
			if (error.code === 4902) {
				// Network not added to MetaMask, add it
				try {
					await window.ethereum.request({
						method: "wallet_addEthereumChain",
						params: [MONAD_TESTNET_CONFIG],
					});
					setIsCorrectNetwork(true);
					return true;
				} catch (addError) {
					console.error("Error adding network:", addError);
					setError("Failed to add Monad network");
					return false;
				}
			} else {
				console.error("Error switching network:", error);
				setError("Failed to switch to Monad network");
				return false;
			}
		} finally {
			setLoading(false);
		}
	}, [isMetaMaskInstalled]);

	const disconnectWallet = useCallback(() => {
		setAccount("");
		setProvider(null);
		setSigner(null);
		setChainId(null);
		setIsConnected(false);
		setIsCorrectNetwork(false);
		setError("");
	}, []);

	// Handle account and network changes
	useEffect(() => {
		if (!isMetaMaskInstalled()) return;

		const handleAccountsChanged = (accounts) => {
			if (accounts.length === 0) {
				disconnectWallet();
			} else {
				setAccount(accounts[0]);
			}
		};

		const handleChainChanged = (newChainId) => {
			const chainIdNumber = parseInt(newChainId, 16);
			setChainId(chainIdNumber);
			setIsCorrectNetwork(chainIdNumber === 666);
		};

		window.ethereum.on("accountsChanged", handleAccountsChanged);
		window.ethereum.on("chainChanged", handleChainChanged);

		// Check if already connected
		window.ethereum
			.request({ method: "eth_accounts" })
			.then((accounts) => {
				if (accounts.length > 0) {
					connectWallet();
				}
			})
			.catch(console.error);

		return () => {
			if (window.ethereum) {
				window.ethereum.removeListener(
					"accountsChanged",
					handleAccountsChanged,
				);
				window.ethereum.removeListener(
					"chainChanged",
					handleChainChanged,
				);
			}
		};
	}, [isMetaMaskInstalled, connectWallet, disconnectWallet]);

	return {
		account,
		provider,
		signer,
		chainId,
		isConnected,
		isCorrectNetwork,
		error,
		loading,
		isMetaMaskInstalled: isMetaMaskInstalled(),
		connectWallet,
		switchToMonadNetwork,
		disconnectWallet,
		setError,
	};
};
