'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarDays, History, UserCircle } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/meal-plans', label: 'Meal Plans', icon: CalendarDays },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-100 sm:static sm:border-t-0 sm:border-b sm:bg-transparent sm:backdrop-blur-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-around sm:justify-start sm:gap-1 py-2 sm:py-0">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
