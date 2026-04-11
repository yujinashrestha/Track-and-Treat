'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAppContext } from '@/lib/context/AppContext';

export default function NavBar() {
  const pathname = usePathname();
  const { isAuthenticated, isInitializing, logout, userName } = useAppContext();

  // While localStorage is being read, render nothing on the right side.
  // This prevents the brief flash where nav links appear before auth is known.
  const showAuthUI = !isInitializing && isAuthenticated;

  return (
    <nav className="sticky top-0 z-50 bg-white flex items-center justify-between px-8 py-4 border-b border-slate-100">

      {/* Logo — always visible */}
      <Link href="/" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black text-emerald-950">
          Track <span className="text-emerald-600">&</span> Treat
        </span>
      </Link>

      {/* Right side — only shown when auth state is confirmed AND user is logged in */}
      {showAuthUI && (
        <div className="flex items-center gap-2">

          {userName && (
            <div className="flex items-center gap-2 mr-3 text-sm font-bold text-slate-600">
              <User className="w-4 h-4" />
              {userName}
            </div>
          )}

          {[
            { href: '/dashboard',  label: 'DASHBOARD' },
            { href: '/history',    label: 'HISTORY'   },
            { href: '/onboarding', label: 'PROFILE'   },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-5 py-2 rounded-xl font-black text-sm transition-all ${
                pathname === href
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              {label}
            </Link>
          ))}

          <button
            onClick={logout}
            className="ml-4 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 font-black text-sm flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
        </div>
      )}
    </nav>
  );
}