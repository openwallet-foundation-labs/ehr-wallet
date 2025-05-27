import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/login'];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // API routes don't need to be protected by this middleware
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Static files and _next paths are accessible
  if (pathname.match(/\.(css|jpg|jpeg|png|svg|ico|js|json)/i) || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }
  
  // Get the user's session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Role-based access control
  if (token) {
    const userRole = token.role as string;
    
    // Patient role restrictions
    if (userRole === 'PATIENT') {
      // Restricted paths for patients
      const restrictedPaths = [
        '/patients',
        '/patients/register',
        '/scheduling'
      ];
      
      // Check if the current path is restricted for patients
      const isRestricted = restrictedPaths.some(path => 
        pathname === path || pathname.startsWith(`${path}/`)
      );
      
      if (isRestricted) {
        // Redirect patients to their dashboard if they try to access restricted paths
        return NextResponse.redirect(new URL('/patient/dashboard', request.url));
      }
    }
  }
  
  // Let the request through for authenticated users or handle auth client-side
  return NextResponse.next();
}

export const config = {
  // Skip middleware for static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
