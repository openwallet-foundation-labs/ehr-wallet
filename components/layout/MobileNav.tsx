
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { X, Home, Settings, Share, ClipboardList, Wallet, Calendar, Heart } from "lucide-react";
import { Button, Drawer, Stack, Text, NavLink, Divider, Group, Box } from "@mantine/core";
import { useSession } from "next-auth/react";
import { useMetaMask } from "@/components/web3/MetaMaskProvider";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { isConnected, currentAccount } = useMetaMask();
  const [patientSession, setPatientSession] = useState<any>(null);
  const [isPatient, setIsPatient] = useState(false);

  // Check for MetaMask-based patient session in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPatientSession = localStorage.getItem('patientSession');
      if (storedPatientSession) {
        try {
          const parsedSession = JSON.parse(storedPatientSession);
          setPatientSession(parsedSession);
        } catch (error) {
          console.error('Error parsing patient session:', error);
        }
      }
    }
  }, []);

  // Determine if the user is a patient (either via next-auth or MetaMask)
  useEffect(() => {
    const isNextAuthPatient = session?.user?.role?.toUpperCase() === 'PATIENT';
    const isMetaMaskPatient = isConnected && currentAccount && patientSession?.user?.role === 'patient';
    setIsPatient(isNextAuthPatient || isMetaMaskPatient);
  }, [session, isConnected, currentAccount, patientSession]);

  const routes = [
    { href: "/", label: "Dashboard", icon: <Home size={18} /> },
    { href: "/patient/share-data", label: "Share Data", icon: <Share size={18} /> },
    { href: "/patient/access-logs", label: "Access Logs", icon: <ClipboardList size={18} /> },
    { href: "/patient/wallet", label: "Wallet", icon: <Wallet size={18} /> },
    { href: "/patient/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      position="left"
      size="xs"
      withCloseButton={false}
      styles={{
        body: {
          padding: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        },
        content: {
          width: 280,
        },
      }}
    >
      <Stack gap={0} h="100%">
        <Box p="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group justify="space-between">
            <Text fw={600} size="lg">
              EHR Wallet
            </Text>
            <Button
              variant="subtle"
              size="sm"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </Button>
          </Group>
        </Box>

        <Stack gap={4} p="sm" style={{ flex: 1 }}>
          {routes.map((route) => {
            const isRouteActive = isActive(route.href);
            return (
              <NavLink
                key={route.href}
                component={Link}
                href={route.href}
                label={route.label}
                leftSection={route.icon}
                active={isRouteActive}
                onClick={onClose}
                style={{
                  borderRadius: 8,
                }}
              />
            );
          })}
        </Stack>

        <Divider />
        <Box p="md" mt="auto">
          <Text size="xs" c="dimmed">
            <p>EHR Wallet v0.1.0</p>
            <p>&copy; 2025 RadGlobal</p>
          </Text>
        </Box>
      </Stack>
    </Drawer>
  );
}
