import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface AuthWrapperProps {
  children: ReactNode;
  publicPaths?: string[];
}

export function AuthWrapper({ children, publicPaths = ['/login'] }: AuthWrapperProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Authentication disabled for development - allow all access
    console.log('AuthWrapper: Authentication checks disabled for development');
    console.log('Current path:', router.pathname);
    console.log('Session:', session);
    console.log('Status:', status);
    
    // Set loading to false immediately
    setIsLoading(false);
  }, [router, session, status, publicPaths]);
  
  // Skip loading state and render children immediately
  return <>{children}</>;
}
