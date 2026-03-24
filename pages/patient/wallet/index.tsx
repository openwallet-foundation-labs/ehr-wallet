import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import PatientLayout from '@/components/layout/PatientLayout';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';
import { Card, CardSection, Text, Title, Button, Alert, Group, Stack } from '@mantine/core';
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

export default function WalletPage() {
  const { data: session } = useSession();
  const {
    connectWallet,
    isConnected,
    currentAccount,
    chainId,
    networkName,
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
        } catch {
          // Ignore parse errors
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

  // Function to view address on block explorer
  const viewOnExplorer = () => {
    if (ethereumAddress) {
      // Use the appropriate network URL based on chainId
      let baseUrl = 'https://etherscan.io/address/';
      if (chainId === '0x89' || networkName === 'Polygon Mainnet') {
        baseUrl = 'https://polygonscan.com/address/';
      } else if (chainId === '0x13882' || networkName === 'Polygon Amoy') {
        baseUrl = 'https://amoy.polygonscan.com/address/';
      } else if (chainId === '0xaa36a7' || networkName === 'Sepolia') {
        baseUrl = 'https://sepolia.etherscan.io/address/';
      }

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
        <Title order={1} mb="xs">Wallet Connection</Title>
        <Text c="dimmed" mb="xl">
          Connect your wallet to manage your medical data securely
        </Text>

        <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
          <CardSection withBorder inheritPadding py="xs">
            <Title order={3}>Your Wallet</Title>
            <Text size="sm" c="dimmed">
              Your wallet is used to securely share and manage access to your medical data
            </Text>
          </CardSection>

          <CardSection inheritPadding py="md">
            {error && (
              <Alert icon={<AlertCircle size={16} />} title="Error" color="red" mb="md">
                {error}
              </Alert>
            )}

            {isConnected ? (
              <Stack gap="md">
                <Card shadow="xs" padding="md" radius="md" withBorder>
                  <Group justify="space-between" align="flex-start">
                    <div>
                      <Text size="sm" fw={500}>Connected Address</Text>
                      <Text size="lg" ff="monospace">{formatAddress(ethereumAddress || '')}</Text>
                    </div>
                    <Group gap="xs">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={copyToClipboard}
                        leftSection={copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={viewOnExplorer}
                        leftSection={<ExternalLink size={16} />}
                      >
                        View
                      </Button>
                    </Group>
                  </Group>
                </Card>

                <div>
                  <Text size="sm" fw={500} mb={5}>Network</Text>
                  <Text size="sm">{networkName}</Text>
                </div>
              </Stack>
            ) : (
              <Stack align="center" gap="md" py="xl">
                <Text>No wallet connected</Text>
                <Button onClick={connectWallet}>Connect MetaMask</Button>
              </Stack>
            )}
          </CardSection>

          <CardSection withBorder inheritPadding py="xs" style={{ justifyContent: 'flex-end', display: 'flex' }}>
            {isConnected && (
              <Button variant="outline" onClick={() => {
                // Manually clear the connection state since there's no disconnect method
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}>Disconnect Wallet</Button>
            )}
          </CardSection>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <CardSection withBorder inheritPadding py="xs">
            <Title order={3}>About Blockchain Security</Title>
            <Text size="sm" c="dimmed">
              How your medical data is secured with blockchain technology
            </Text>
          </CardSection>

          <CardSection inheritPadding py="md">
            <Stack gap="md">
              <Text>
                Your medical data is secured using a combination of blockchain technology and decentralized storage:
              </Text>

              <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', margin: 0 }}>
                <li>
                  <Text fw={500}>Data Privacy:</Text> Your medical data is encrypted before being stored on IPFS (InterPlanetary File System).
                </li>
                <li>
                  <Text fw={500}>Access Control:</Text> Smart contracts on the Ethereum blockchain manage who can access your data.
                </li>
                <li>
                  <Text fw={500}>Transparency:</Text> All data access requests are recorded on the blockchain, providing a transparent audit trail.
                </li>
                <li>
                  <Text fw={500}>Security:</Text> Your private keys never leave your device, ensuring only you can grant access to your data.
                </li>
              </ul>
            </Stack>
          </CardSection>
        </Card>
      </div>
    </PatientLayout>
  );
}
