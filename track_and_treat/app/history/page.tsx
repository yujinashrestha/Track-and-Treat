'use client';

import React from 'react';
import { CheckCircle2, XCircle, TrendingUp, History as HistoryIcon, ArrowLeft } from 'lucide-react';
import { useAppContext } from '@/lib/context/AppContext';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const { dailyCals, meals, isAuthenticated } = useAppContext();
  const router = useRouter();

  // If not authenticated, redirect to login
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // MOCK: Generate history based on user's target to keep UI consistent
  // In a real app, this data would come from the NestJS backend
  const historyData = [
    { date: 'Today', calories: meals.reduce((s, m) => s + m.cal, 0), target: dailyCals, status: meals.reduce((s, m) => s + m.cal, 0) > dailyCals ? 'Over' : 'On Track' },
    { date: 'Yesterday', calories: Math.round(dailyCals * 0.95), target: dailyCals, status: 'On Track' },
    { date: 'Apr 08', calories: Math.round(dailyCals * 1.15), target: dailyCals, status: 'Over' },
    { date: 'Apr 07', calories: Math.round(dailyCals * 0.82), target: dailyCals, status: 'Under' },
    { date: 'Apr 06', calories: Math.round(dailyCals * 1.01), target: dailyCals, status: 'On Track' },
    { date: 'Apr 05', calories: Math.round(dailyCals * 0.98), target: dailyCals, status: 'On Track' },
    { date: 'Apr 04', calories: Math.round(dailyCals * 1.05), target: dailyCals, status: 'On Track' },
  ];

  const onTrackCount = historyData.filter(d => d.status === 'On Track').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 sm:p-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>

      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <button 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 mb-8 hover:translate-x-[-4px] transition-transform cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-emerald-950 flex items-center gap-3">
              <HistoryIcon className="w-10 h-10 text-emerald-600" />
              Scorecard
            </h1>
            <p className="text-slate-500 font-medium mt-2">7-day performance tracking based on your {dailyCals} kcal target.</p>
          </div>
          <div className="bg-emerald-600 text-white px-8 py-4 rounded-3xl font-black shadow-xl shadow-emerald-900/10">
            {onTrackCount} / 7 Days On Track
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {historyData.map((day, i) => {
            const efficiency = Math.round((day.calories / day.target) * 100);
            return (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-200 transition-all group">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${day.status === 'On Track' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {day.status === 'On Track' ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                  </div>
                  <div>
                    <p className="text-xl font-black text-emerald-950">{day.date}</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{day.calories} / {day.target} kcal</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className={`text-2xl font-black ${day.status === 'On Track' ? 'text-emerald-600' : 'text-slate-400'}`}>{efficiency}%</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Efficiency</p>
                  </div>
                  <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${day.status === 'On Track' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10' : 'bg-slate-100 text-slate-400'}`}>
                    {day.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Insights */}
        <div className="mt-12 bg-emerald-950 rounded-[3rem] p-10 text-white overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/20 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center shrink-0">
              <TrendingUp className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-3 text-emerald-400">Metabolic Compliance Insights</h3>
              <p className="text-emerald-100/70 font-medium leading-relaxed max-w-2xl">
                Your performance has stabilized at <b>{Math.round((onTrackCount / 7) * 100)}%</b> clinical adherence. The algorithm recommends maintaining your current caloric envelope to optimize insulin sensitivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
