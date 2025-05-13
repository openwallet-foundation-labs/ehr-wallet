import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '@/lib/offline-auth';

interface AuthWrapperProps {
  children: ReactNode;
  publicPaths?: string[];
}

export function AuthWrapper({ children, publicPaths = ['/login'] }: AuthWrapperProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const user = getCurrentUser();
      const isPublicPath = publicPaths.includes(router.pathname);
      
      if (!user && !isPublicPath) {
        // Not authenticated and trying to access protected route
        console.log('Not authenticated, redirecting to login');
        window.location.href = `/login?callbackUrl=${encodeURIComponent(router.asPath)}`;
        return;
      } else if (user && isPublicPath) {
        // Authenticated but trying to access login page
        console.log('Already authenticated, redirecting to dashboard');
        window.location.href = '/';
        return;
      }
      
      // Either authenticated and accessing protected route, 
      // or not authenticated and accessing public route
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router.pathname, router.asPath, publicPaths]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
