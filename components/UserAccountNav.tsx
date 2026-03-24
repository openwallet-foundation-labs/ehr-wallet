import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getCurrentUser } from "@/lib/offline-auth";
import { hybridSignOut } from "@/lib/auth-compatibility";
import { useRouter } from "next/router";
import {
  Button,
  Avatar,
  Group,
  Text,
  Divider,
  Menu,
  MenuTarget,
  MenuDropdown,
  MenuItem,
} from "@mantine/core";
import { LogOut } from "lucide-react";

export function UserAccountNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // First check NextAuth session, then fallback to offline auth
    if (session?.user) {
      setUser(session.user);
    } else {
      // Fallback to localStorage for offline mode
      const currentUser = getCurrentUser();
      if (currentUser) setUser(currentUser);
    }
  }, [session]);

  if (!user) return null;

  // Get initials for avatar
  const initials = user.name
    ? user.name
        .split(" ")
        .map((name: string) => name[0])
        .join("")
        .toUpperCase()
    : user.email.substring(0, 2).toUpperCase();

  // Function to display role in a more readable format
  const formatRole = (role: string) => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  return (
    <Menu position="bottom-end" withArrow>
      <MenuTarget>
        <Button variant="subtle" p={0} style={{ borderRadius: '50%', width: 36, height: 36 }}>
          <Avatar
            size={32}
            radius="xl"
            color="blue"
          >
            {initials}
          </Avatar>
        </Button>
      </MenuTarget>
      <MenuDropdown>
        <div style={{ padding: '8px 12px' }}>
          <Group gap="sm" wrap="nowrap">
            {user.name && <Text fw={500}>{user.name}</Text>}
          </Group>
          <Text size="xs" c="dimmed" style={{ maxWidth: 200 }} truncate>
            {user.email}
          </Text>
          {user.role && (
            <Text size="xs" c="dimmed">
              {formatRole(user.role)}
            </Text>
          )}
        </div>
        <Divider />
        <MenuItem
          leftSection={<LogOut size={14} />}
          onClick={async () => {
            await hybridSignOut('/login');
          }}
        >
          Sign out
        </MenuItem>
      </MenuDropdown>
    </Menu>
  );
}
