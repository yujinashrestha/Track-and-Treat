'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '@/lib/context/AppContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until localStorage has been read before making any redirect decision.
    // Without this, isAuthenticated is always false on first render and every
    // reload immediately kicks the user to /login.
    if (isInitializing) return;

    const protectedRoutes = ['/dashboard', '/history', '/onboarding'];

    if (!isAuthenticated && protectedRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [isAuthenticated, isInitializing, pathname, router]);

  return <>{children}</>;
}