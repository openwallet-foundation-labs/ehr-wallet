import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '@/lib/offline-auth';

export function useAuthProtection(publicPaths = ['/login']) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Set to false immediately
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Always authenticated for development
  
  useEffect(() => {
    // Authentication disabled for development - allow all access
    console.log('useAuthProtection: Authentication checks disabled for development');
    console.log('Current path:', router.pathname);
    
    // Set authenticated state immediately without checks
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router.pathname, publicPaths]);
  
  return { isLoading, isAuthenticated };
}
