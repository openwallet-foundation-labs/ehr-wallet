import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@mantine/core';
import { useRouter } from 'next/router';
import { hybridSignOut } from '@/lib/auth-compatibility';
import { useSession } from 'next-auth/react';

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // Check if we have either a NextAuth session or localStorage authentication
  const hasOfflineUser = typeof window !== 'undefined' && (
    !!localStorage.getItem('currentUser') ||
    !!localStorage.getItem('patientSession')
  );

  const isAuthenticated = !!session?.user || hasOfflineUser;

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await hybridSignOut('/login');
      // The hybridSignOut will handle the redirect
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback manual redirect
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      color="red"
      onClick={handleLogout}
      disabled={isLoading}
      leftSection={<LogOut size={16} />}
      loading={isLoading}
    >
      Logout
    </Button>
  );
}
