import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Button } from '@mantine/core';
import { Card, CardSection, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { hybridWalletLogin, hybridSignIn, hybridSignOut } from '@/lib/auth-compatibility';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';
import { LogOut, Key, Wallet } from 'lucide-react';
import Head from 'next/head';

export default function TestLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { connectWallet } = useMetaMask();
  const [isLoading, setIsLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  // Get offline user from localStorage if applicable
  const [offlineUser, setOfflineUser] = useState<any>(null);

  // Check for user in localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          setOfflineUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error reading from localStorage', e);
      }
    }
  }, []);

  // Handle standard login
  const handleStandardLogin = async () => {
    setIsLoading(true);
    try {
      // Use test account for quick login
      const result = await hybridSignIn('test@example.com', 'password123', {
        redirect: false
      });

      if (result.success) {
        notifications.show({
          title: "Login successful",
          message: result.nextAuth ?
            "Authenticated with NextAuth" :
            "Authenticated with localStorage fallback",
          color: 'green'
        });

        // Manual redirect to dashboard after a delay
        setTimeout(() => {
          router.push('/patient/dashboard');
        }, 1000);
      } else {
        notifications.show({
          title: "Login failed",
          message: "Please check your credentials",
          color: 'red'
        });
      }
    } catch (error) {
      notifications.show({
        title: "Login error",
        message: "An unexpected error occurred",
        color: 'red'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle MetaMask login
  const handleWalletLogin = async () => {
    setWalletLoading(true);
    try {
      const account = await connectWallet();
      if (account) {
        const result = await hybridWalletLogin(account, {
          redirect: false
        });

        if (result.success) {
          notifications.show({
            title: "Wallet connected",
            message: `Connected with ${account.substring(0, 6)}...${account.substring(account.length - 4)}`,
            color: 'green'
          });

          // Manual redirect to dashboard after a delay
          setTimeout(() => {
            router.push('/patient/dashboard');
          }, 1000);
        }
      }
    } catch (error) {
      notifications.show({
        title: "Wallet connection failed",
        message: "Could not connect to MetaMask",
        color: 'red'
      });
    } finally {
      setWalletLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await hybridSignOut();
    notifications.show({
      title: "Logged out",
      message: "You have been logged out successfully",
      color: 'blue'
    });
    router.push('/login');
  };

  return (
    <>
      <Head>
        <title>Authentication Test Page</title>
      </Head>
      <div className="container mx-auto max-w-md mt-16 p-4">
        <Card shadow="md" padding="lg" radius="md" withBorder>
          <CardSection p="md" withBorder>
            <Title order={3}>Authentication Test</Title>
            <Text size="sm" c="dimmed">Test authentication flows during Vite to Next.js migration</Text>
          </CardSection>
          <CardSection p="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {session && (
                <div className="p-4" style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '6px' }}>
                  <Text fw={700}>NextAuth Session</Text>
                  <pre className="text-xs mt-2 overflow-auto max-height: 8rem" style={{ overflow: 'auto', maxHeight: '8rem', fontSize: '0.75rem' }}>
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              )}

              {offlineUser && (
                <div className="p-4" style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '6px' }}>
                  <Text fw={700}>Offline User (localStorage)</Text>
                  <pre className="text-xs mt-2 overflow-auto max-height: 8rem" style={{ overflow: 'auto', maxHeight: '8rem', fontSize: '0.75rem' }}>
                    {JSON.stringify(offlineUser, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{ display: 'grid', gap: '1rem' }}>
                <Button
                  onClick={handleStandardLogin}
                  loading={isLoading}
                  fullWidth
                  leftSection={<Key size={16} />}
                >
                  Test Standard Login
                </Button>

                <Button
                  onClick={handleWalletLogin}
                  loading={walletLoading}
                  variant="outline"
                  fullWidth
                  leftSection={<Wallet size={16} />}
                >
                  Test MetaMask Login
                </Button>
              </div>
            </div>
          </CardSection>
          <CardSection p="md">
            <Button
              onClick={handleLogout}
              color="red"
              fullWidth
              leftSection={<LogOut size={16} />}
            >
              Logout
            </Button>
          </CardSection>
        </Card>
      </div>
    </>
  );
}
