 
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getFromIpfs as fetchFromIpfs, decryptData as decryptIpfsData } from '@/lib/web3/ipfs';
import { verifyAccess as verifyContractAccess, getAccessGrantDetails as getContractAccessDetails } from '@/lib/web3/contract';

// Create a context for Web3 functionality
interface Web3ContextType {
  isMetaMaskInstalled: boolean;
  currentAccount: string | null;
  chainId: string | null;
  connectWallet: () => Promise<string | null>;
  verifyAccess: (accessId: string, password?: string) => Promise<string>;
  getAccessGrantDetails: (accessId: string) => Promise<any>;
  getFromIpfs: (cid: string) => Promise<any>;
  decryptData: (encryptedData: string, password: string) => Promise<any>;
}

const Web3Context = createContext<Web3ContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3HandlerProps {
  children: ReactNode;
}

export default function Web3Handler({ children }: Web3HandlerProps) {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  // Check if MetaMask is installed
  useEffect(() => {
    const checkMetaMask = async () => {
      if (typeof window !== 'undefined' && window.ethereum?.isMetaMask) {
        setIsMetaMaskInstalled(true);
        
        // Get current account if already connected
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setCurrentAccount(accounts[0]);
          }
          
          // Get current chain ID
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(chainId);
        } catch (error) {
          console.error('Error checking MetaMask connection:', error);
        }
      }
    };
    
    checkMetaMask();
  }, []);

  // Connect wallet function
  const connectWallet = async (): Promise<string | null> => {
    if (!isMetaMaskInstalled) {
      console.error('MetaMask is not installed');
      return null;
    }
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts && accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        return accounts[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      return null;
    }
  };

  // Function for verifying access
  const verifyAccess = async (accessId: string, password?: string): Promise<string> => {
    try {
      // Call the actual contract function
      return await verifyContractAccess(accessId, password);
    } catch (error) {
      console.error('Error verifying access:', error);
      throw error;
    }
  };

  // Function for getting access grant details
  const getAccessGrantDetails = async (accessId: string) => {
    try {
      // Call the actual contract function
      return await getContractAccessDetails(accessId);
    } catch (error) {
      console.error('Error getting access details:', error);
      throw error;
    }
  };

  // Function for getting data from IPFS
  const getFromIpfs = async (cid: string) => {
    try {
      // Use the actual IPFS function
      return await fetchFromIpfs(cid);
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw error;
    }
  };

  // Function for decrypting data
  const decryptData = async (encryptedData: string, password: string) => {
    try {
      // Use the actual decryption function
      return await decryptIpfsData(encryptedData, password);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  };

  // Context value
  const contextValue: Web3ContextType = {
    isMetaMaskInstalled,
    currentAccount,
    chainId,
    connectWallet,
    verifyAccess,
    getAccessGrantDetails,
    getFromIpfs,
    decryptData
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

// Using global type declaration from /types/global.d.ts
export {};
