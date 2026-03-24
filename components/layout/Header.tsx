
import { Menu, X } from "lucide-react";
import { UserAccountNav } from "@/components/UserAccountNav";
import { Button } from "@mantine/core";
import { useIsMobile } from "@/hooks/use-mobile";
import { Group, Title, Box } from "@mantine/core";

export const Header = ({
  toggleSidebar,
  toggleMobileNav,
  isMobileNavOpen
}: {
  toggleSidebar: () => void;
  toggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}) => {
  const isMobile = useIsMobile();

  return (
    <Box
      component="header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        backgroundColor: 'var(--mantine-color-body)',
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        height: 64,
      }}
    >
      <Group h="100%" px="md" justify="space-between">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isMobile ? (
            <>
              <Button
                variant="subtle"
                size="sm"
                onClick={toggleMobileNav}
                style={{ marginRight: 8 }}
                aria-label="Toggle mobile menu"
              >
                {isMobileNavOpen ? (
                  <X size={20} />
                ) : (
                  <Menu size={20} />
                )}
              </Button>
              <Title order={4} style={{ color: 'var(--mantine-color-teal-7)' }}>
                EHR Wallet
              </Title>
            </>
          ) : (
            <>
              <Button
                variant="subtle"
                size="sm"
                onClick={toggleSidebar}
                style={{ marginRight: 8 }}
              >
                <Menu size={20} />
              </Button>
              <Title order={4} style={{ color: 'var(--mantine-color-teal-7)' }}>
                EHR Wallet
              </Title>
            </>
          )}
        </div>

        <div>
          <UserAccountNav />
        </div>
      </Group>
    </Box>
  );
};
