'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/dashboard/MetabolicSummary.tsx
// Uses Algorithm 3 (Macro Distribution) targets from computed MacroTargets
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { Activity, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getModeLabel } from '@/lib/utils/adherenceUtils';
import type { DayTotals, MacroTargets, MacroData } from '@/lib/types';

const MACRO_CONFIG = [
  { label: 'Protein Target', key: 'prot'  as const, targetKey: 'protein' as const, color: 'bg-emerald-500', icon: '🥩' },
  { label: 'Carbohydrates',  key: 'carbs' as const, targetKey: 'carbs'   as const, color: 'bg-amber-500',   icon: '🍞' },
  { label: 'Dietary Fat',    key: 'fat'   as const, targetKey: 'fat'     as const, color: 'bg-indigo-500',  icon: '🥑' },
];

const PIE_COLORS = { prot: '#10b981', carbs: '#f59e0b', fat: '#6366f1' };

interface MetabolicSummaryProps {
  totals:    DayTotals;
  adherence: number;
  planAdh:   number;
  target:    MacroTargets;
}

export default function MetabolicSummary({ totals, adherence, planAdh, target }: MetabolicSummaryProps) {
  const mode = getModeLabel(planAdh);

  const macroData: MacroData[] = useMemo(() => {
    if (!totals.prot && !totals.carbs && !totals.fat) return [];
    return [
      { name: 'Protein', value: totals.prot,  color: PIE_COLORS.prot  },
      { name: 'Carbs',   value: totals.carbs, color: PIE_COLORS.carbs },
      { name: 'Fat',     value: totals.fat,   color: PIE_COLORS.fat   },
    ];
  }, [totals]);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 overflow-hidden flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-3xl font-black text-emerald-950 flex items-center gap-3">
          <Activity className="w-8 h-8 text-emerald-600" /> Metabolic Summary
        </h3>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${mode.bg} ${mode.color}`}>
            {mode.icon} {mode.label}
          </span>
          <span className="px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            Descriptive Analytics
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">
        <MacroPieChart macroData={macroData} adherence={adherence} />
        <MacroProgressBars totals={totals} target={target} />
      </div>
    </div>
  );
}

// ─── Donut chart with efficiency % in the centre ─────────────────────────────

function MacroPieChart({ macroData, adherence }: { macroData: MacroData[]; adherence: number }) {
  return (
    <div className="flex flex-col items-center justify-center bg-slate-50/30 rounded-[3rem] p-10 border border-slate-100">
      <div className="h-72 w-72 relative shrink-0">
        {macroData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData}
                cx="50%" cy="50%"
                innerRadius={85} outerRadius={120}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center border-4 border-dashed border-slate-100 rounded-full">
            <PieChartIcon className="w-16 h-16 text-slate-100" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-5xl font-black text-emerald-950 leading-none">{Math.round(adherence * 100)}%</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Efficiency</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-8">
        {macroData.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Three animated progress bars for P / C / F ──────────────────────────────

function MacroProgressBars({ totals, target }: { totals: DayTotals; target: MacroTargets }) {
  return (
    <div className="space-y-10 py-4">
      {MACRO_CONFIG.map((item, idx) => {
        const current = totals[item.key];
        const tgt     = target[item.targetKey];
        const pct     = Math.min(100, Math.round((current / (tgt || 1)) * 100));

        return (
          <div key={idx} className="space-y-4">
            <div className="flex justify-between items-end px-2">
              <div className="flex items-center gap-4">
                <span className="text-3xl bg-white shadow-sm w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-50">
                  {item.icon}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                  <p className="text-2xl font-black text-emerald-950">
                    {current}g <span className="text-slate-300 font-bold">/ {tgt}g</span>
                  </p>
                </div>
              </div>
              <span className="text-xl font-black text-emerald-600">{pct}%</span>
            </div>
            <div className="h-5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1.5">
              <div
                className={`h-full ${item.color} rounded-full shadow-lg transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
