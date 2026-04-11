'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { History, LogOut, LayoutDashboard } from 'lucide-react';
import { useAppContext } from '@/lib/context/AppContext';

export default function NavBar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAppContext();

  return (
    <nav className="sticky top-0 z-50 bg-white flex items-center justify-between px-8 py-4 border-b border-slate-100">
      
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-black text-emerald-950">
          Track <span className="text-emerald-600">&</span> Treat
        </span>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {[
          { href: '/dashboard', label: 'DASHBOARD', icon: null },
          { href: '/history', label: 'HISTORY', icon: <History className="w-4 h-4" /> },
          { href: '/onboarding', label: 'PROFILE', icon: null },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={`px-5 py-2 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
              pathname === href
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            {icon} {label}
          </Link>
        ))}

        {/* Logout */}
        {isAuthenticated && (
          <button
            onClick={logout}
            className="ml-4 px-4 py-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-100 font-black text-sm flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
        )}
      </div>
    </nav>
  );
}