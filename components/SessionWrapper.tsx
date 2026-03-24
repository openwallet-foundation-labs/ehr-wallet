/**
 * SessionWrapper
 *
 * Provides unified session handling for both NextAuth and wallet-based auth.
 */

import { FC, ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Skeleton, Group, Stack } from '@mantine/core';

interface SessionWrapperProps {
  children: ReactNode;
}

export const SessionWrapper: FC<SessionWrapperProps> = ({ children }) => {
  const { status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // List of paths that don't require authentication
  const publicPaths = [
    '/login',
    '/register',
    '/test-login',
    '/ipfs',
    '/shared',
  ];

  const isPublicPath = publicPaths.some(path =>
    router.pathname === path || router.pathname.startsWith(`${path}/`)
  );

  // Show loading skeleton while checking auth
  if (!mounted || status === 'loading') {
    return (
      <Group justify="center" align="center" style={{ minHeight: '100vh' }}>
        <Stack align="center" gap="md">
          <Skeleton height={48} width={48} circle />
          <Skeleton height={16} width={128} />
        </Stack>
      </Group>
    );
  }

  return <>{children}</>;
};
