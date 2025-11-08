'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface MetaMaskContextType {
  isMetaMaskInstalled: boolean;
  isConnected: boolean;
  currentAccount: string | null;
  chainId: string | null;
  connectWallet: () => Promise<string | null>;
  error: string | null;
}

const MetaMaskContext = createContext<MetaMaskContextType>({
  isMetaMaskInstalled: false,
  isConnected: false,
  currentAccount: null,
  chainId: null,
  connectWallet: async () => null,
  error: null,
});

export const useMetaMask = () => useContext(MetaMaskContext);

interface MetaMaskProviderProps {
  children: ReactNode;
}

export const MetaMaskProvider = ({ children }: MetaMaskProviderProps) => {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Check if MetaMask is installed - only run on client side
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;
    
    const checkMetaMaskInstalled = () => {
      const ethereum = (window as any).ethereum;
      if (ethereum && ethereum.isMetaMask) {
        setIsMetaMaskInstalled(true);
        
        // Check if already connected
        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              setCurrentAccount(accounts[0]);
              setIsConnected(true);
            }
          })
          .catch((err: Error) => {
            console.error('Error checking MetaMask accounts:', err);
          });
        
        // Get current chain ID
        ethereum.request({ method: 'eth_chainId' })
          .then((chainId: string) => {
            setChainId(chainId);
          })
          .catch((err: Error) => {
            console.error('Error getting chain ID:', err);
          });
      } else {
        setIsMetaMaskInstalled(false);
      }
    };

    checkMetaMaskInstalled();
  }, []);

  // Set up event listeners for MetaMask - only run on client side
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined' || !isMetaMaskInstalled) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setIsConnected(false);
        setCurrentAccount(null);
      } else {
        // Account changed
        setCurrentAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(chainId);
      // TODO: Handle chain change without page reload to prevent infinite refresh loops
      // window.location.reload(); // Commented out to prevent refresh loops
      console.log('Chain changed to:', chainId);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Clean up event listeners
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled]);

  // Sync with session if available
  useEffect(() => {
    if (session?.user?.ethereumAddress && !currentAccount) {
      setCurrentAccount(session.user.ethereumAddress);
      setIsConnected(true);
    }
  }, [session, currentAccount]);

  // Connect wallet function
  const connectWallet = async (): Promise<string | null> => {
    setError(null);

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      setError('Browser environment required');
      return null;
    }

    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return null;
    }

    try {
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        setIsConnected(true);

        // Prompt user to switch to Polygon network if not already on it
        const currentChainId = await ethereum.request({ method: 'eth_chainId' });
        const polygonChainId = '0x89'; // Polygon mainnet = 137 = 0x89
        const polygonTestnetChainId = '0x13882'; // Polygon Amoy testnet = 80002 = 0x13882

        // If not on Polygon network, suggest switching
        if (currentChainId !== polygonChainId && currentChainId !== polygonTestnetChainId) {
          try {
            // Try to switch to Polygon mainnet
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: polygonChainId }],
            });
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
              try {
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: polygonChainId,
                      chainName: 'Polygon Mainnet',
                      nativeCurrency: {
                        name: 'MATIC',
                        symbol: 'MATIC',
                        decimals: 18
                      },
                      rpcUrls: ['https://polygon-rpc.com/'],
                      blockExplorerUrls: ['https://polygonscan.com/']
                    }
                  ],
                });
              } catch (addError) {
                console.error('Error adding Polygon network:', addError);
              }
            }
          }
        }

        return accounts[0];
      }

      return null;
    } catch (err: any) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      return null;
    }
  };

  const value = {
    isMetaMaskInstalled,
    isConnected,
    currentAccount,
    chainId,
    connectWallet,
    error,
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
};

export default MetaMaskProvider;
