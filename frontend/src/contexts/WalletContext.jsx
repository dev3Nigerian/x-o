// frontend/src/contexts/WalletContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Monad Network Configurations
const MONAD_TESTNET_CONFIG = {
  chainId: '0x279F', // 666 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet-explorer.monad.xyz'],
};

const MONAD_MAINNET_CONFIG = {
  chainId: '0x2CA', // 714 in hex
  chainName: 'Monad Mainnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.monad.xyz'],
  blockExplorerUrls: ['https://explorer.monad.xyz'],
};

// Network helper functions
const getTargetNetwork = () => {
  const isMainnet = import.meta.env.VITE_NETWORK_ENV === 'mainnet';
  return isMainnet ? MONAD_MAINNET_CONFIG : MONAD_TESTNET_CONFIG;
};

const getTargetChainId = () => {
  const targetNetwork = getTargetNetwork();
  return parseInt(targetNetwork.chainId, 16);
};

export const WalletProvider = ({ children }) => {
  // Core wallet state
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  
  // Balance and network state
  const [balance, setBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Update balance when account or network changes
  const updateBalance = useCallback(async () => {
    if (!provider || !account) {
      setBalance('0');
      return;
    }

    try {
      const bal = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(bal));
    } catch (error) {
      console.error('Error updating balance:', error);
      setBalance('0');
    }
  }, [provider, account]);

  // Update token balance
  const updateTokenBalance = useCallback(async () => {
    if (!provider || !account || !import.meta.env.VITE_MON_TOKEN_ADDRESS) {
      setTokenBalance('0');
      return;
    }

    try {
      const tokenContract = new ethers.Contract(
        import.meta.env.VITE_MON_TOKEN_ADDRESS,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      
      const bal = await tokenContract.balanceOf(account);
      setTokenBalance(ethers.utils.formatEther(bal));
    } catch (error) {
      console.error('Error updating token balance:', error);
      setTokenBalance('0');
    }
  }, [provider, account]);

  // Check network compatibility
  const checkNetwork = useCallback((currentChainId) => {
    const targetChainId = getTargetChainId();
    const isCorrect = currentChainId === targetChainId;
    setIsCorrectNetwork(isCorrect);
    return isCorrect;
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
    }
  }, [account]);

  // Handle chain changes
  const handleChainChanged = useCallback((newChainId) => {
    const chainIdNum = parseInt(newChainId, 16);
    setChainId(chainIdNum);
    checkNetwork(chainIdNum);
    
    // Reload provider to ensure clean state
    if (window.ethereum) {
      const newProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(newProvider);
      setSigner(newProvider.getSigner());
    }
  }, [checkNetwork]);

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', disconnect);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', disconnect);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Update balances when dependencies change
  useEffect(() => {
    updateBalance();
  }, [updateBalance]);

  useEffect(() => {
    updateTokenBalance();
  }, [updateTokenBalance]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const network = await provider.getNetwork();

          setAccount(accounts[0]);
          setProvider(provider);
          setSigner(signer);
          setChainId(network.chainId);
          setIsConnected(true);
          checkNetwork(network.chainId);
        }
      } catch (error) {
        console.error('Error checking existing connection:', error);
      }
    };

    checkConnection();
  }, [checkNetwork]);

  // Connect wallet function
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return false;
    }

    try {
      setIsConnecting(true);
      setError('');

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        setError('No accounts found. Please check your MetaMask.');
        return false;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId);
      setIsConnected(true);

      // Check if we're on the correct network
      const isCorrect = checkNetwork(network.chainId);
      if (!isCorrect) {
        // Automatically attempt to switch to correct network
        await switchToTargetNetwork();
      }

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      const errorMessage = error.code === 4001 
        ? 'Connection rejected by user'
        : error.message || 'Failed to connect wallet';
      setError(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    setChainId(null);
    setBalance('0');
    setTokenBalance('0');
    setIsCorrectNetwork(false);
    setError('');
  }, []);

  // Switch to target network (testnet or mainnet)
  const switchToTargetNetwork = async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask not installed');
    }

    const targetNetwork = getTargetNetwork();

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      });
      return true;
    } catch (switchError) {
      // Network doesn't exist, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [targetNetwork],
          });
          return true;
        } catch (addError) {
            console.log(addError)
          const errorMsg = `Failed to add ${targetNetwork.chainName} to MetaMask`;
          setError(errorMsg);
          throw new Error(errorMsg);
        }
      } else {
        const errorMsg = `Failed to switch to ${targetNetwork.chainName}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }
  };

  // Add token to MetaMask
  const addTokenToWallet = async () => {
    if (!isMetaMaskInstalled() || !import.meta.env.VITE_MON_TOKEN_ADDRESS) {
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: import.meta.env.VITE_MON_TOKEN_ADDRESS,
            symbol: 'MON',
            decimals: 18,
            image: '', // Add your token logo URL here
          },
        },
      });
      return true;
    } catch (error) {
      console.error('Error adding token to wallet:', error);
      return false;
    }
  };

  // Format address for display
  const formatAddress = (address, chars = 4) => {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  };

  // Get network name
  const getNetworkName = () => {
    const targetChainId = getTargetChainId();
    if (chainId === targetChainId) {
      return getTargetNetwork().chainName;
    }
    
    // Common networks for reference
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      137: 'Polygon',
      80001: 'Mumbai Testnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
    };
    
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  // Refresh all data
  const refresh = async () => {
    await Promise.all([
      updateBalance(),
      updateTokenBalance()
    ]);
  };

  const value = {
    // Core state
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    chainId,
    error,

    // Balance state
    balance,
    tokenBalance,
    isCorrectNetwork,

    // Actions
    connectWallet,
    disconnect,
    switchToTargetNetwork,
    addTokenToWallet,
    refresh,

    // Utilities
    isMetaMaskInstalled,
    formatAddress,
    getNetworkName,
    getTargetChainId,
    
    // Computed values
    shortAddress: formatAddress(account),
    networkName: getNetworkName(),
    canInteract: isConnected && isCorrectNetwork,
    
    // Constants
    targetNetwork: getTargetNetwork(),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};