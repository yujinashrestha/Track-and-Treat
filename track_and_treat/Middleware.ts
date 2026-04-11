import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require the user to be logged in
const PROTECTED = ['/dashboard', '/history', '/onboarding'];

// Routes that logged-in users should NOT revisit
const AUTH_ROUTES = ['/login', '/register', '/verify-otp'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth')?.value;

  const isProtected = PROTECTED.some(path => pathname.startsWith(path));
  const isAuthRoute  = AUTH_ROUTES.some(path => pathname.startsWith(path));

  // Not logged in → trying to access a protected page → redirect to login
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already logged in → trying to visit login/register → redirect to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/history/:path*', '/onboarding/:path*', '/login', '/register', '/verify-otp'],
};