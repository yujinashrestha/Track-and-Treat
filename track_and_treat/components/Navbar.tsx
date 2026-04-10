'use client';

import React from 'react';
import { LayoutDashboard, LogOut } from "lucide-react";
import { useAppContext } from '@/lib/context/AppContext';

export default function Navbar() {
  const { logout, isAuthenticated } = useAppContext();

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-4">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Track <span className="text-emerald-600">&</span> Treat</h1>
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">
              Dashboard
            </a>
            <a href="/history" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors">
              History
            </a>
            
            {isAuthenticated && (
              <button 
                onClick={logout} 
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-4 py-1.5 rounded-full hover:bg-rose-100 transition-colors cursor-pointer border-none outline-none"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
