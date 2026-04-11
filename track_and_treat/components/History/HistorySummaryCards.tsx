'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/history/HistorySummaryCards.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { TrendingUp, Target, Award, Flame } from 'lucide-react';
import type { ChartDataPoint } from '@/lib/types';

export function HistorySummaryCards({ chartData }: { chartData: ChartDataPoint[] }) {
  const avgGoal = Math.round(chartData.reduce((s, d) => s + d.goalAdherence, 0) / chartData.length);
  const avgPlan = Math.round(chartData.reduce((s, d) => s + d.planAdherence, 0) / chartData.length);
  const bestDay = Math.max(...chartData.map(d => d.goalAdherence));
  const avgCals = Math.round(chartData.reduce((s, d) => s + d.cals, 0) / chartData.length);

  const cards = [
    { label: 'Avg Goal Adherence', value: `${avgGoal}%`,     icon: <TrendingUp className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Avg Plan Adherence', value: `${avgPlan}%`,     icon: <Target     className="w-5 h-5 text-indigo-500"  />, bg: 'bg-indigo-50 border-indigo-100'   },
    { label: 'Best Day',           value: `${bestDay}%`,     icon: <Award      className="w-5 h-5 text-amber-500"   />, bg: 'bg-amber-50 border-amber-100'     },
    { label: 'Avg Daily Cals',     value: `${avgCals} kcal`, icon: <Flame      className="w-5 h-5 text-rose-500"    />, bg: 'bg-rose-50 border-rose-100'       },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((s, i) => (
        <div key={i} className={`${s.bg} border rounded-2xl p-5`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-white rounded-xl shadow-sm flex items-center justify-center">{s.icon}</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
          </div>
          <p className="text-3xl font-black text-emerald-950">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
