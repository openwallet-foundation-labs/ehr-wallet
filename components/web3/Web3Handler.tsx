import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

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

  // Mock function for verifying access
  const verifyAccess = async (accessId: string, password?: string): Promise<string> => {
    // In a real implementation, this would call the smart contract
    console.log(`Verifying access for ${accessId} with password: ${password ? 'provided' : 'not provided'}`);
    
    // Mock IPFS CID
    return 'QmXyZ123456789abcdef';
  };

  // Mock function for getting access grant details
  const getAccessGrantDetails = async (accessId: string) => {
    // In a real implementation, this would call the smart contract
    console.log(`Getting access details for ${accessId}`);
    
    // Mock data
    return {
      owner: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      ipfsCid: 'QmXyZ123456789abcdef',
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      hasPassword: true
    };
  };

  // Mock function for getting data from IPFS
  const getFromIpfs = async (cid: string) => {
    // In a real implementation, this would fetch from IPFS
    console.log(`Getting data from IPFS with CID: ${cid}`);
    
    // Mock data
    return {
      patientId: 'P12345',
      createdAt: new Date().toISOString(),
      dataTypes: ['medical-history', 'lab-results', 'imaging']
    };
  };

  // Mock function for decrypting data
  const decryptData = async (encryptedData: string, password: string) => {
    // In a real implementation, this would decrypt the data
    console.log(`Decrypting data with password: ${password}`);
    
    // Return the same mock data
    return {
      patientId: 'P12345',
      createdAt: new Date().toISOString(),
      dataTypes: ['medical-history', 'lab-results', 'imaging']
    };
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
