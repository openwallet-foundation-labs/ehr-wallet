import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '@/lib/offline-auth';

export function useAuthProtection(publicPaths = ['/login']) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();
      
      if (!user && !publicPaths.includes(router.pathname)) {
        // Not authenticated and trying to access protected route
        router.push('/login');
      } else if (user && publicPaths.includes(router.pathname)) {
        // Authenticated and trying to access login page
        router.push('/');
      } else {
        // Either authenticated and accessing protected route, 
        // or not authenticated and accessing public route
        setIsAuthenticated(!!user);
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router.pathname, publicPaths]);
  
  return { isLoading, isAuthenticated };
}
