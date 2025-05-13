import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // For offline PWA, we don't check auth server-side
  // Instead, client-side auth logic will handle redirection
  // This prevents the "no available server" error by eliminating server-side auth checks
  
  // Just let the request through
  return NextResponse.next();
}

export const config = {
  // Skip middleware for static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
