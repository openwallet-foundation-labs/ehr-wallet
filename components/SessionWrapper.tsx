/**
 * SessionWrapper
 * 
 * A component that provides unified session handling during the Vite to Next.js migration.
 * This bridges the gap between NextAuth.js sessions and the legacy localStorage authentication.
 */

import { FC, ReactNode, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '@/lib/offline-auth';

interface SessionWrapperProps {
  children: ReactNode;
}

export const SessionWrapper: FC<SessionWrapperProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // List of paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email'
  ];
  
  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => 
    router.pathname === path || router.pathname.startsWith(`${path}/`)
  );
  
  // This effect handles redirects based on authentication state
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;
    
    // Wait until session status is determined
    if (status === 'loading') return;
    
    // Temporarily disable redirects to debug the crash issue
    console.log('SessionWrapper: Authentication check disabled for debugging');
    console.log('Current path:', router.pathname);
    console.log('Session:', session);
    console.log('Status:', status);
    
    // TODO: Re-enable authentication redirects after fixing the crash
    
    // // Don't redirect between login, register, and other public pages
    // if (isPublicPath && router.pathname !== '/login') return;
    // 
    // // Get the legacy auth user if there's no NextAuth session
    // const offlineUser = !session ? getCurrentUser() : null;
    // 
    // // Check if authenticated in either system
    // const isAuthenticated = !!session || !!offlineUser;
    // 
    // // Get the role from either auth system
    // const userRole = session?.user?.role || offlineUser?.role || '';
    // const isPatient = userRole.toUpperCase() === 'PATIENT';
    // 
    // if (!isAuthenticated && !isPublicPath) {
    //   // If not authenticated and not on a public path, redirect to login
    //   console.log('Not authenticated, redirecting to login');
    //   router.push(`/login?callbackUrl=${router.pathname}`);
    // } else if (isAuthenticated && isPublicPath) {
    //   // If authenticated but on the login page, redirect to appropriate dashboard
    //   console.log('Authenticated but on login page, redirecting to dashboard');
    //   router.push(isPatient ? '/patient/dashboard' : '/');
    // } else if (isAuthenticated && isPatient && router.pathname === '/') {
    //   // If patient is on the root path, redirect to patient dashboard
    //   console.log('Patient on root path, redirecting to patient dashboard');
    //   router.push('/patient/dashboard');
    // }
  }, [router.pathname, session, status, isPublicPath]);
  
  // Render children regardless of auth state (the effect above handles redirects)
  return <>{children}</>;
};
