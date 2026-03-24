
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "next-auth/react";
import { useMetaMask } from "@/components/web3/MetaMaskProvider";
import {
  Database,
  Settings,
  Share,
  ClipboardList,
  Wallet
} from "lucide-react";
import { NavLink, Stack, Text, Divider, Box } from "@mantine/core";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
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

  // Determine if the user is a patient (either via next-auth, MetaMask, or current route)
  useEffect(() => {
    const isNextAuthPatient = session?.user?.role?.toUpperCase() === 'PATIENT';
    const isMetaMaskPatient = isConnected && currentAccount && patientSession?.user?.role === 'patient';
    const isOnPatientRoute = router.pathname.startsWith('/patient/');
    setIsPatient(isNextAuthPatient || isMetaMaskPatient || isOnPatientRoute);
  }, [session, isConnected, currentAccount, patientSession, router.pathname]);

  // Patient links - application is now patient-only
  const patientLinks = [
    { name: "Dashboard", path: "/", icon: <Database size={20} /> },
    { name: "Share Data", path: "/patient/share-data", icon: <Share size={20} /> },
    { name: "Access Logs", path: "/patient/access-logs", icon: <ClipboardList size={20} /> },
    { name: "Connect Wallet", path: "/patient/wallet", icon: <Wallet size={20} /> }
  ];

  // Settings links
  const settingsLinks = [
    { name: "Settings", path: "/patient/settings", icon: <Settings size={20} /> }
  ];

  // Use patient links for all users
  const links = patientLinks;

  // Mobile overlay that closes when clicked outside
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <Box
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 20,
            }}
            onClick={onClose}
          />
        )}
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100%',
            width: 260,
            backgroundColor: 'white',
            borderRight: '1px solid var(--mantine-color-gray-3)',
            zIndex: 30,
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 300ms ease-in-out',
          }}
        >
          <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Text fw={600} size="lg" style={{ color: 'var(--mantine-color-teal-7)' }}>
              EHR Wallet
            </Text>
            {session?.user?.name && (
              <Text size="sm" c="dimmed" mt={4}>
                {session.user.name}
              </Text>
            )}
          </Box>

          <Stack gap={4} p="sm">
            {links.map((link) => {
              const isActive = router.pathname === link.path;
              return (
                <NavLink
                  key={link.path}
                  component={Link}
                  href={link.path}
                  label={link.name}
                  leftSection={link.icon}
                  active={isActive}
                  onClick={(e) => {
                    if (isMobile) {
                      onClose();
                    }
                  }}
                  style={{
                    borderRadius: 8,
                  }}
                />
              );
            })}

            <Divider my="md" />

            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
              Settings
            </Text>
            {settingsLinks.map((link) => {
              const isActive = router.pathname === link.path;
              return (
                <NavLink
                  key={link.path}
                  component={Link}
                  href={link.path}
                  label={link.name}
                  leftSection={link.icon}
                  active={isActive}
                  onClick={(e) => {
                    if (isMobile) {
                      onClose();
                    }
                  }}
                  style={{
                    borderRadius: 8,
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </>
    );
  }

  // Desktop sidebar
  return (
    <Box
      style={{
        height: 'calc(100vh - 4rem)',
        backgroundColor: 'var(--mantine-color-body)',
        borderRight: '1px solid var(--mantine-color-gray-3)',
        transition: 'all 300ms',
        width: isOpen ? 260 : 80,
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <Stack gap={4} p="sm">
        {links.map((link) => {
          const isActive = router.pathname === link.path;
          return (
            <NavLink
              key={link.path}
              component={Link}
              href={link.path}
              label={isOpen ? link.name : undefined}
              leftSection={link.icon}
              active={isActive}
              style={{
                borderRadius: 8,
              }}
            />
          );
        })}

        <Divider my="md" />

        {isOpen && (
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
            Settings
          </Text>
        )}
        {settingsLinks.map((link) => {
          const isActive = router.pathname === link.path;
          return (
            <NavLink
              key={link.path}
              component={Link}
              href={link.path}
              label={isOpen ? link.name : undefined}
              leftSection={link.icon}
              active={isActive}
              style={{
                borderRadius: 8,
              }}
            />
          );
        })}
      </Stack>
    </Box>
  );
};
