'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useMetaMask } from './MetaMaskProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ConnectWalletButton = () => {
  const { isMetaMaskInstalled, isConnected, currentAccount, connectWallet, error: metaMaskError } = useMetaMask();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      // First connect the wallet if not already connected
      let address = currentAccount;
      if (!isConnected) {
        address = await connectWallet();
      }

      if (!address) {
        throw new Error('Failed to connect wallet');
      }

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
      window.location.href = '/patient/dashboard';
    } catch (err: any) {
      console.error('Wallet authentication error:', err);
      setError(err.message || 'Failed to authenticate with wallet');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Show install MetaMask message if not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            MetaMask is not installed. Please install MetaMask to continue.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.open('https://metamask.io/download/', '_blank')}
          variant="outline"
          className="mt-2"
        >
          Install MetaMask
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button 
        onClick={handleConnect} 
        disabled={isAuthenticating}
        className="flex items-center gap-2"
        variant={isConnected ? "outline" : "default"}
      >
        {isAuthenticating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Authenticating...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            {isConnected ? 'Sign In with MetaMask' : 'Connect Wallet'}
          </>
        )}
      </Button>
      
      {isConnected && currentAccount && (
        <p className="text-xs text-muted-foreground">
          Connected: {`${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`}
        </p>
      )}
      
      {(error || metaMaskError) && (
        <p className="text-xs text-destructive mt-1">{error || metaMaskError}</p>
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
