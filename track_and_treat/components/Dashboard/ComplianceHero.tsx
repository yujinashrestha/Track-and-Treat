'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/dashboard/ComplianceHero.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { getComplianceLabel, getModeLabel } from '@/lib/utils/adherenceUtils';
import type { MacroTargets } from '@/lib/types/index';

interface ComplianceHeroProps {
  dateLabel: string;
  adherence: number;
  planAdh:   number;
  isFuture:  boolean;
  target:    MacroTargets;
}

export default function ComplianceHero({ dateLabel, adherence, planAdh, isFuture, target }: ComplianceHeroProps) {
  const compliance = getComplianceLabel(adherence);
  const mode       = getModeLabel(planAdh);

  if (isFuture) {
    return (
      <div className="relative bg-slate-800 rounded-[2.5rem] p-10 mb-8 text-white">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl">📅</div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest opacity-60 mb-1">{dateLabel}</p>
            <h2 className="text-4xl font-black mb-2">Upcoming Day</h2>
            <p className="opacity-70 font-medium text-lg">
              Your meal plan for this day is ready. Logging begins when the day arrives.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${compliance.bg} rounded-[2.5rem] p-10 mb-8 overflow-hidden shadow-2xl text-white`}>
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-16 -mt-16 opacity-50" />
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">

        {/* Left: status */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl shadow-xl">
            {compliance.emoji}
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest opacity-60 mb-1">{dateLabel}</p>
            <h2 className="text-4xl font-black mb-2">{compliance.label}</h2>
            <p className="opacity-80 font-medium max-w-sm text-lg leading-relaxed">
              Metabolic efficiency at{' '}
              <span className="underline decoration-2 underline-offset-4">{Math.round(adherence * 100)}%</span>.
              {' '}Plan adherence:{' '}
              <span className="underline decoration-2 underline-offset-4">{Math.round(planAdh * 100)}%</span>.
            </p>
          </div>
        </div>

        {/* Right: mode badge + stat chips */}
        <div className="flex flex-col gap-3 items-end">
          <div className="px-5 py-2 rounded-2xl border font-black text-sm flex items-center gap-2 bg-white/15 border-white/30 text-white">
            {mode.icon} {mode.label}
          </div>
          <div className="flex gap-4">
            {[
              { label: 'Daily Target', value: `${target.cals} kcal`                           },
              { label: 'Logged',       value: `${Math.round(adherence * target.cals)} kcal`   },
            ].map((chip, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/20 text-center min-w-[110px]">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{chip.label}</p>
                <p className="text-2xl font-black">{chip.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
