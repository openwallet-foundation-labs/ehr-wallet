import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { hybridSignIn, hybridWalletLogin } from '@/lib/auth-compatibility';
import { useRouter } from 'next/router';
import * as z from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { initDatabase } from '@/lib/db';
import { seedOfflineDatabase } from '@/lib/seed-offline-db';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';
import { notifications } from '@mantine/notifications';
import { Card, Text, Title, TextInput, PasswordInput, Button, Divider, Stack, Center, Loader, Box, Group } from '@mantine/core';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

// Define the form schema
const patientFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [dbInitializing, setDbInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isMetaMaskLoading, setIsMetaMaskLoading] = useState(false);
  const [showEmailPasswordLogin, setShowEmailPasswordLogin] = useState(false);
  const [showWalletAddress, setShowWalletAddress] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Get MetaMask context for wallet integration
  const { isMetaMaskInstalled, currentAccount, connectWallet, networkName, error: metaMaskError } = useMetaMask();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (session) {
      const callbackUrl = Array.isArray(router.query.callbackUrl)
        ? router.query.callbackUrl[0]
        : router.query.callbackUrl || '/';

      router.push(callbackUrl);
    }
  }, [session, router]);

  // Initialize the database and seed if needed
  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        await seedOfflineDatabase();
        setDbInitializing(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError('Failed to initialize the offline database. Please reload the page.');
        setDbInitializing(false);
      }
    }

    initialize();
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const result = patientFormSchema.safeParse({ email, password });
    if (!result.success) {
      const emailError = result.error.errors.find(e => e.path[0] === 'email');
      const passwordError = result.error.errors.find(e => e.path[0] === 'password');
      setEmailError(emailError?.message || null);
      setPasswordError(passwordError?.message || null);
      return false;
    }
    setEmailError(null);
    setPasswordError(null);
    return true;
  };

  // Show loading state while database is initializing
  if (dbInitializing) {
    return (
      <Center h="100vh" bg="gray.0">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text>Initializing offline database...</Text>
        </Stack>
      </Center>
    );
  }

  // Handle MetaMask login
  const handleMetaMaskLogin = async () => {
    setIsMetaMaskLoading(true);
    try {
      const account = await connectWallet();
      if (account) {
        // Use our hybrid login system to authenticate with both systems
        const callbackUrl = Array.isArray(router.query.callbackUrl)
          ? router.query.callbackUrl[0]
          : router.query.callbackUrl || '/patient/dashboard';

        const result = await hybridWalletLogin(account, {
          redirect: true,
          callbackUrl
        });

        if (result.success) {
          notifications.show({
            title: 'Success',
            message: 'Successfully connected with MetaMask',
            color: 'green',
          });
          // The hybridWalletLogin will handle redirection
        } else {
          notifications.show({
            title: 'Error',
            message: 'Failed to authenticate with MetaMask',
            color: 'red',
          });
        }
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to connect with MetaMask',
          color: 'red',
        });
      }
    } catch (error) {
      console.error('MetaMask login error:', error);
      notifications.show({
        title: 'Error',
        message: 'An error occurred during MetaMask login',
        color: 'red',
      });
    } finally {
      setIsMetaMaskLoading(false);
    }
  };

  // Handle email/password login
  const handleEmailPasswordLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const callbackUrl = Array.isArray(router.query.callbackUrl)
        ? router.query.callbackUrl[0]
        : router.query.callbackUrl || '/patient/dashboard';

      const result = await hybridSignIn(email, password, {
        redirect: true,
        callbackUrl,
        role: 'PATIENT'
      });

      if (!result.success) {
        notifications.show({
          title: 'Error',
          message: 'Invalid email or password',
          color: 'red',
        });
        setIsLoading(false);
      }
      // The hybridSignIn handles redirection internally
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'An error occurred during login',
        color: 'red',
      });
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder w="100%" maw={420} mb="auto" mt="auto">
        <Stack gap="md">
          <Center>
            <Title order={1} ta="center">Login</Title>
          </Center>

          {initError && (
            <Text c="red" size="sm" ta="center">{initError}</Text>
          )}

          <Stack gap="md">
            <Stack gap="xs">
              <Title order={3}>Patient Login</Title>
              <Text size="sm" c="dimmed">Sign in to access your medical records</Text>
            </Stack>

            {/* Web3 Wallet Login - First */}
            <Box>
              <Title order={4}>Web3 Wallet Login</Title>
              <Text size="xs" c="dimmed" mb="sm">Connect with your wallet to access your medical records</Text>

              {/* MetaMask Login Button */}
              <Button
                onClick={handleMetaMaskLogin}
                fullWidth
                variant="outline"
                disabled={!isMetaMaskInstalled || isMetaMaskLoading}
                leftSection={isMetaMaskLoading ? <Loader size="xs" color="blue" /> : <Image src="/metamask-fox.svg" alt="MetaMask" width={24} height={24} />}
              >
                {isMetaMaskLoading ? 'Connecting...' : 'Connect with MetaMask'}
              </Button>

              {/* Display current account if connected */}
              {currentAccount && (
                <Box ta="center" mt="xs">
                  <Text size="sm" c="dimmed">Connected account:</Text>
                  <Group justify="center" gap="xs">
                    <Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>
                      {showWalletAddress ? currentAccount : `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}`}
                    </Text>
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={() => setShowWalletAddress(!showWalletAddress)}
                      style={{ padding: 4, minWidth: 'auto' }}
                    >
                      {showWalletAddress ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </Group>
                </Box>
              )}

              {/* MetaMask not installed warning */}
              {!isMetaMaskInstalled && (
                <Box ta="center" mt="xs">
                  <Text size="sm" c="yellow.7">MetaMask extension is not installed. Please install it to continue.</Text>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--mantine-color-blue-6)', textDecoration: 'underline' }}
                  >
                    Download MetaMask
                  </a>
                </Box>
              )}

              {/* Display MetaMask error if any */}
              {metaMaskError && (
                <Box ta="center" mt="xs">
                  <Text size="sm" c="red">{metaMaskError}</Text>
                </Box>
              )}

              <Box ta="center" mt="xs" p="xs" bg="gray.1" style={{ borderRadius: 4 }}>
                <Text size="xs" c="dimmed">Current network: {networkName}</Text>
                {currentAccount && (
                  <Text size="xs" c="dimmed" mt={4}>Wallet connected</Text>
                )}
              </Box>
            </Box>

            <Divider label="Or continue with" labelPosition="center" />

            {/* Email/Password Login Form - Collapsible */}
            <Box>
              <Button
                variant="subtle"
                fullWidth
                onClick={() => setShowEmailPasswordLogin(!showEmailPasswordLogin)}
                rightSection={showEmailPasswordLogin ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                styles={{
                  root: {
                    justifyContent: 'space-between',
                    padding: '8px',
                  }
                }}
              >
                Email & Password Login
              </Button>

              {showEmailPasswordLogin && (
                <Stack gap="sm" mt="md">
                  <TextInput
                    label="Email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={emailError}
                    disabled={isLoading}
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={passwordError}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleEmailPasswordLogin}
                    fullWidth
                    loading={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>

                  <Text size="xs" c="dimmed" ta="center">For demo: use patient@example.com / password</Text>
                </Stack>
              )}
            </Box>
          </Stack>
        </Stack>
      </Card>

      {/* Footer */}
      <Box
        component="footer"
        w="100%"
        py="sm"
        px="md"
        mt="md"
        style={{
          borderTop: '1px solid var(--mantine-color-gray-3)',
          backgroundColor: 'var(--mantine-color-gray-0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--mantine-color-gray-6)'
        }}
      >
        <div>
          &copy; {new Date().getFullYear()} TMC AI, LLC. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/hipaa" style={{ color: 'inherit', textDecoration: 'none' }}>
            HIPAA Compliance
          </Link>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
            Terms of Service
          </Link>
        </div>
      </Box>
    </Box>
  );
}
