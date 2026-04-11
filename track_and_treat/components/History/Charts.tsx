'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/history/Charts.tsx
// AdherenceChart + CalorieChart + ThresholdLabel
// ─────────────────────────────────────────────────────────────────────────────

import { BarChart2, Flame } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { ChartDataPoint, MacroTargets } from '@/lib/types';

const CHART_AXIS_STYLE = {
  fontSize: 11, fontWeight: 700, fill: '#94a3b8',
};
const CHART_TOOLTIP_STYLE = {
  borderRadius: '16px', border: 'none',
  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
  fontWeight: 700,
};

export function AdherenceChart({ chartData }: { chartData: ChartDataPoint[] }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 mb-8">
      <h3 className="text-2xl font-black text-emerald-950 flex items-center gap-3 mb-8">
        <BarChart2 className="w-7 h-7 text-emerald-600" /> Adherence Over Time
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day"     tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 110]} tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontWeight: 700, fontSize: 12 }} />
            <Area type="monotone" dataKey="goalAdherence" name="Goal Adherence %"
              stroke="#10b981" strokeWidth={3} fill="url(#goalGrad)"
              dot={{ fill: '#10b981', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
            <Area type="monotone" dataKey="planAdherence" name="Plan Adherence %"
              stroke="#6366f1" strokeWidth={3} fill="url(#planGrad)"
              dot={{ fill: '#6366f1', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ThresholdLabel color="emerald" label="85% = On Track threshold" />
    </div>
  );
}

export function CalorieChart({ chartData, target }: { chartData: ChartDataPoint[]; target: MacroTargets }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 mb-8">
      <h3 className="text-2xl font-black text-emerald-950 flex items-center gap-3 mb-8">
        <Flame className="w-7 h-7 text-rose-500" /> Calorie Intake
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day"         tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 2200]}    tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="cals" name="Calories (kcal)"
              stroke="#f59e0b" strokeWidth={3} fill="url(#calGrad)"
              dot={{ fill: '#f59e0b', r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ThresholdLabel color="rose" label={`Target: ${target.cals} kcal/day`} />
    </div>
  );
}

function ThresholdLabel({ color, label }: { color: 'rose' | 'emerald'; label: string }) {
  const borderClass = color === 'rose' ? 'border-rose-200'   : 'border-emerald-200';
  const textClass   = color === 'rose' ? 'text-rose-500'     : 'text-emerald-600';
  return (
    <div className="flex items-center gap-2 mt-4">
      <div className={`flex-1 h-px border-t-2 border-dashed ${borderClass}`} />
      <span className={`text-xs font-black uppercase tracking-widest ${textClass}`}>{label}</span>
      <div className={`flex-1 h-px border-t-2 border-dashed ${borderClass}`} />
    </div>
  );
}
