import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
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

  // Check if user is authenticated
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Redirect to login if not authenticated
  if (!token && pathname !== '/login') {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // Logged in users trying to access login page are redirected to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip middleware for static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
