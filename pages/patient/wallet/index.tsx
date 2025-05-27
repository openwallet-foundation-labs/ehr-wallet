import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PatientLayout from '@/components/layout/PatientLayout';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

export default function WalletPage() {
  const { data: session } = useSession();
  const { 
    connect, 
    disconnect, 
    isConnected, 
    currentAccount, 
    chainId, 
    error 
  } = useMetaMask();
  
  const [copied, setCopied] = useState(false);
  const [patientSession, setPatientSession] = useState<any>(null);
  
  // Get patient session from localStorage if using MetaMask
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPatientSession = localStorage.getItem('patientSession');
      if (storedPatientSession) {
        try {
          setPatientSession(JSON.parse(storedPatientSession));
        } catch (error) {
          console.error('Error parsing patient session:', error);
        }
      }
    }
  }, []);
  
  // Determine which session to use (next-auth or MetaMask)
  const userSession = session || patientSession;
  const ethereumAddress = userSession?.user?.ethereumAddress || currentAccount;
  
  // Function to copy address to clipboard
  const copyToClipboard = () => {
    if (ethereumAddress) {
      navigator.clipboard.writeText(ethereumAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  // Function to view address on Etherscan
  const viewOnEtherscan = () => {
    if (ethereumAddress) {
      // Use the appropriate network URL based on chainId
      const baseUrl = chainId === '0x1' 
        ? 'https://etherscan.io/address/' 
        : 'https://sepolia.etherscan.io/address/';
      
      window.open(`${baseUrl}${ethereumAddress}`, '_blank');
    }
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <PatientLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-2">Wallet Connection</h1>
        <p className="text-muted-foreground mb-8">
          Connect your Ethereum wallet to manage your medical data securely
        </p>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Ethereum Wallet</CardTitle>
            <CardDescription>
              Your wallet is used to securely share and manage access to your medical data
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Connected Address</p>
                    <p className="font-mono text-lg">{formatAddress(ethereumAddress || '')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={copyToClipboard}
                      className="flex items-center gap-1"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={viewOnEtherscan}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-1">Network</p>
                  <p className="text-sm">
                    {chainId === '0x1' ? 'Ethereum Mainnet' : 
                     chainId === '0xaa36a7' ? 'Sepolia Testnet' : 
                     chainId ? `Chain ID: ${chainId}` : 'Unknown Network'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-6">
                <p className="mb-4">No wallet connected</p>
                <Button onClick={connect}>Connect MetaMask</Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-end">
            {isConnected && (
              <Button variant="outline" onClick={disconnect}>Disconnect Wallet</Button>
            )}
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>About Blockchain Security</CardTitle>
            <CardDescription>
              How your medical data is secured with blockchain technology
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <p>
                Your medical data is secured using a combination of blockchain technology and decentralized storage:
              </p>
              
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Data Privacy:</strong> Your medical data is encrypted before being stored on IPFS (InterPlanetary File System).
                </li>
                <li>
                  <strong>Access Control:</strong> Smart contracts on the Ethereum blockchain manage who can access your data.
                </li>
                <li>
                  <strong>Transparency:</strong> All data access requests are recorded on the blockchain, providing a transparent audit trail.
                </li>
                <li>
                  <strong>Security:</strong> Your private keys never leave your device, ensuring only you can grant access to your data.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
