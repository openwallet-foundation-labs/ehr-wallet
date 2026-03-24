'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface MetaMaskContextType {
  isMetaMaskInstalled: boolean;
  isConnected: boolean;
  currentAccount: string | null;
  chainId: string | null;
  networkName: string;
  connectWallet: () => Promise<string | null>;
  error: string | null;
}

// Helper to get network name from chainId
const getNetworkName = (chainId: string | null): string => {
  if (!chainId) return 'Unknown';
  const chainIdNum = parseInt(chainId, 16);
  switch (chainIdNum) {
    case 137:
      return 'Polygon Mainnet';
    case 80002:
      return 'Polygon Amoy';
    case 1:
      return 'Ethereum Mainnet';
    case 11155111:
      return 'Sepolia';
    case 5:
      return 'Goerli';
    default:
      return `Chain ${chainIdNum}`;
  }
};

const MetaMaskContext = createContext<MetaMaskContextType>({
  isMetaMaskInstalled: false,
  isConnected: false,
  currentAccount: null,
  chainId: null,
  networkName: 'Unknown',
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMetaMaskInstalled = () => {
      const ethereum = (window as any).ethereum;
      if (ethereum?.isMetaMask) {
        setIsMetaMaskInstalled(true);

        ethereum.request({ method: 'eth_accounts' })
          .then((accounts: string[]) => {
            if (accounts.length > 0) {
              setCurrentAccount(accounts[0]);
              setIsConnected(true);
            }
          })
          .catch(() => {
            // Ignore errors
          });

        ethereum.request({ method: 'eth_chainId' })
          .then((id: string) => {
            setChainId(id);
          })
          .catch(() => {
            // Ignore errors
          });
      } else {
        setIsMetaMaskInstalled(false);
      }
    };

    checkMetaMaskInstalled();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isMetaMaskInstalled) return;

    const ethereum = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setIsConnected(false);
        setCurrentAccount(null);
      } else {
        setCurrentAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (id: string) => {
      setChainId(id);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled]);

  useEffect(() => {
    if (session?.user?.ethereumAddress && !currentAccount) {
      setCurrentAccount(session.user.ethereumAddress);
      setIsConnected(true);
    }
  }, [session, currentAccount]);

  const connectWallet = async (): Promise<string | null> => {
    setError(null);

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

        const currentChainId = await ethereum.request({ method: 'eth_chainId' });
        const polygonChainId = '0x89';
        const polygonTestnetChainId = '0x13882';

        if (currentChainId !== polygonChainId && currentChainId !== polygonTestnetChainId) {
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: polygonChainId }],
            });
          } catch (switchError: any) {
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
              } catch {
                // Ignore add network error
              }
            }
          }
        }

        return accounts[0];
      }

      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      return null;
    }
  };

  const value = {
    isMetaMaskInstalled,
    isConnected,
    currentAccount,
    chainId,
    networkName: getNetworkName(chainId),
    connectWallet,
    error,
  };

  return (
    <MetaMaskContext.Provider value={value}>
      {children}
    </MetaMaskContext.Provider>
  );
};
