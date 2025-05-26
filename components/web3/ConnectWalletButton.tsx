'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { Wallet } from 'lucide-react';

const ConnectWalletButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setAddress(address);

      // Create a message to sign
      const message = `Sign this message to authenticate with Radiant Flow Imaging Hub. Nonce: ${Date.now()}`;
      
      // Request signature
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Sign in with NextAuth using the Ethereum credentials
      const result = await signIn('ethereum', {
        redirect: false,
        message,
        signature,
        address,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Redirect or update UI as needed
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setAddress(null);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={connectWallet} 
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {address ? 'Connected' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      {address && (
        <p className="text-sm text-muted-foreground">
          {`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}
        </p>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default ConnectWalletButton;

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
