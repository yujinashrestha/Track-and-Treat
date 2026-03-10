'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Flame,
    Droplets,
    Scale,
    History,
    PlusCircle,
    LogOut,
    Trophy,
    TrendingUp
} from "lucide-react";

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email: string } | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('auth');
        if (!token) {
            router.push('/login');
        } else {
            setUser({ email: 'user@example.com' });
            setLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('auth');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <div className="text-slate-600 font-bold animate-pulse">Loading Dashboard...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6">
                                <LayoutDashboard className="w-6 h-6 text-emerald-600" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                Track <span className="text-emerald-600">&</span> Treat
                            </h1>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-bold text-slate-900">{user?.email}</span>
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <Trophy className="w-3.5 h-3.5" />
                                    <span className="text-xs font-black uppercase tracking-wider">7 Day Streak</span>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Action Banner */}
                <div className="relative bg-slate-900 rounded-[2.5rem] p-10 mb-10 overflow-hidden shadow-2xl shadow-slate-200 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                    <div className="relative flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-900/40">
                            👋
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Afternoon, Healthy Human!</h2>
                            <p className="text-slate-400 text-lg font-medium max-w-lg">
                                You've logged 1,365 calories so far. Keep hitting your protein targets! 🥩
                            </p>
                        </div>
                        <div className="md:ml-auto flex gap-4">
                            <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-emerald-900/20 active:scale-95">
                                Add Meal
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Stats */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Calories */}
                            <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-slate-900/2">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                                        <Flame className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Main Goal</span>
                                </div>
                                <p className="text-4xl font-black text-slate-900 mb-1">2,100</p>
                                <p className="text-slate-500 font-bold text-sm mb-6">Daily Calories</p>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>

                            {/* Water */}
                            <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-slate-900/2">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center">
                                        <Droplets className="w-6 h-6 text-sky-600" />
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Hydration</span>
                                </div>
                                <p className="text-4xl font-black text-slate-900 mb-1">2.5L</p>
                                <p className="text-slate-500 font-bold text-sm mb-6">Target Water</p>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>

                            {/* Protein */}
                            <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-slate-900/2">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                                        <History className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Macros</span>
                                </div>
                                <p className="text-4xl font-black text-slate-900 mb-1">120g</p>
                                <p className="text-slate-500 font-bold text-sm mb-6">Protein Goal</p>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-900/2">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    <History className="w-6 h-6 text-emerald-600" />
                                    Recent Nutrition
                                </h3>
                                <button className="text-emerald-600 font-black text-sm uppercase tracking-widest hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { name: 'Grilled Chicken Breast', cal: 350, prot: '45g', time: '2h ago' },
                                    { name: 'Brown Rice & Broccoli', cal: 420, prot: '12g', time: '5h ago' },
                                    { name: 'Protein Shake', cal: 180, prot: '24g', time: '8h ago' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">🍱</div>
                                            <div>
                                                <p className="font-black text-slate-950">{item.name}</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-900">{item.cal} cal</p>
                                            <p className="text-xs font-bold text-emerald-600">{item.prot} protein</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <div className="bg-emerald-600 rounded-4xl p-8 text-white shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-xl font-black mb-6 relative z-10">Quick Logs</h3>
                            <div className="space-y-3 relative z-10">
                                <button className="w-full p-4 bg-white/10 hover:bg-white text-white hover:text-emerald-900 rounded-2xl transition-all font-black flex items-center justify-between group/btn">
                                    <span>Food</span>
                                    <PlusCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                </button>
                                <button className="w-full p-4 bg-white/10 hover:bg-white text-white hover:text-emerald-900 rounded-2xl transition-all font-black flex items-center justify-between group/btn">
                                    <span>Water</span>
                                    <Droplets className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                </button>
                                <button className="w-full p-4 bg-white/10 hover:bg-white text-white hover:text-emerald-900 rounded-2xl transition-all font-black flex items-center justify-between group/btn">
                                    <span>Weight</span>
                                    <Scale className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-4xl p-8 border border-slate-100 shadow-xl shadow-slate-900/2">
                            <h3 className="text-slate-900 font-black mb-4">Daily Insights</h3>
                            <div className="flex items-center gap-4 p-4 bg-lime-50 rounded-2xl border border-lime-100 mb-3">
                                <TrendingUp className="w-6 h-6 text-lime-600" />
                                <p className="text-sm font-bold text-lime-900">Your metabolism is 15% higher this week!</p>
                            </div>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                Great progress! You've consistently hit your water goals for 4 days straight.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
