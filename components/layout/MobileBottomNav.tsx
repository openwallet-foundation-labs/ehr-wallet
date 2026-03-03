import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Share, ClipboardList, Settings, Heart } from "lucide-react";
import { Box, Group, Text, UnstyledButton } from "@mantine/core";

export function MobileBottomNav() {
  const router = useRouter();

  const routes = [
    { href: "/", label: "Home", icon: Home },
    { href: "/patient/share-data", label: "Share", icon: Share },
    { href: "/patient/access-logs", label: "Logs", icon: ClipboardList },
    { href: "/patient/wallet", label: "Wallet", icon: Heart },
  ];

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: block !important;
          }
        }
      `}</style>
      <Box
        component="nav"
        className="mobile-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'var(--mantine-color-white)',
          borderTop: '1px solid var(--mantine-color-gray-3)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
        }}
      >
        <Group justify="space-around" h={64}>
          {routes.map((route) => {
            const Icon = route.icon;
            const active = isActive(route.href);

            return (
              <Link
                key={route.href}
                href={route.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  width: '100%',
                  height: '100%',
                }}
              >
                <UnstyledButton
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 12px',
                    borderRadius: active ? 16 : 8,
                    backgroundColor: active ? 'var(--mantine-color-teal-6)' : 'transparent',
                    color: active ? 'white' : 'var(--mantine-color-gray-6)',
                    transition: 'all 200ms ease',
                  }}
                >
                  <Icon size={22} />
                  <Text size="xs" fw={active ? 600 : 400}>
                    {route.label}
                  </Text>
                </UnstyledButton>
              </Link>
            );
          })}
        </Group>
      </Box>
    </>
  );
}
