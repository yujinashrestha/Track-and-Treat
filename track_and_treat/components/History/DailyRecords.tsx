'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/history/DailyRecords.tsx
// DailyRecordsList + DayDetailModal
// ─────────────────────────────────────────────────────────────────────────────

import { Clock, Target, Utensils, ChevronRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getComplianceLabel, getModeLabel } from '@/lib/utils/adherenceUtils';
import type { HistoryRecord, DayPlans, DayLogs, MacroData, MacroTargets } from '@/lib/types';

const PIE_COLORS = { prot: '#10b981', carbs: '#f59e0b', fat: '#6366f1' };

// ─── DailyRecordsList ─────────────────────────────────────────────────────────

export function DailyRecordsList({
  records,
  onSelect,
}: {
  records: HistoryRecord[];
  onSelect: (r: HistoryRecord) => void;
}) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
      <h3 className="text-2xl font-black text-emerald-950 flex items-center gap-3 mb-8">
        <Clock className="w-7 h-7 text-emerald-600" /> Daily Records
      </h3>
      <div className="space-y-4">
        {records.map((rec, i) => (
          <DailyRecordRow key={i} record={rec} onClick={() => onSelect(rec)} />
        ))}
      </div>
    </div>
  );
}

function DailyRecordRow({ record, onClick }: { record: HistoryRecord; onClick: () => void }) {
  const comp = getComplianceLabel(record.goalAdh / 100);
  const mode = getModeLabel(record.planAdh / 100);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-6 rounded-3xl border-2 border-slate-100 hover:border-emerald-500/40 hover:bg-emerald-50/20 transition-all text-left group"
    >
      <div className="flex items-center gap-5">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: comp.color + '20' }}
        >
          {comp.emoji}
        </div>
        <div>
          <p className="font-black text-emerald-950 text-lg">{record.date}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${mode.bg} ${mode.color}`}>
              {mode.icon} {mode.label}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {record.cals} kcal logged
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {[
          { label: 'Goal', value: `${record.goalAdh}%`, color: comp.color },
          { label: 'Plan', value: `${record.planAdh}%`, color: '#6366f1'  },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
      </div>
    </button>
  );
}

// ─── DayDetailModal ───────────────────────────────────────────────────────────

interface DayDetailModalProps {
  record:  HistoryRecord;
  plans:   DayPlans;
  logs:    DayLogs;
  target:  MacroTargets;
  onClose: () => void;
}

export function DayDetailModal({ record, plans, logs, target, onClose }: DayDetailModalProps) {
  const comp    = getComplianceLabel(record.goalAdh / 100);
  const mode    = getModeLabel(record.planAdh / 100);
  const plan    = plans[record.dayIdx] ?? [];
  const dayLogs = logs[record.dayIdx]  ?? [];

  const macroData: MacroData[] = [
    { name: 'Protein', value: record.prot,  color: PIE_COLORS.prot  },
    { name: 'Carbs',   value: record.carbs, color: PIE_COLORS.carbs },
    { name: 'Fat',     value: record.fat,   color: PIE_COLORS.fat   },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black text-emerald-950">{record.date}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest border ${mode.bg} ${mode.color}`}>
                {mode.icon} {mode.label}
              </span>
              <span
                className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest text-white"
                style={{ backgroundColor: comp.color }}
              >
                {comp.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Goal Adherence',  value: `${record.goalAdh}%`,   color: comp.color },
            { label: 'Plan Adherence',  value: `${record.planAdh}%`,   color: '#6366f1'  },
            { label: 'Calories Logged', value: `${record.cals} kcal`,  color: '#f59e0b'  },
          ].map((c, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
              <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Plan vs reality */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Plan column */}
          <div>
            <h4 className="font-black text-emerald-950 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" /> The Plan
            </h4>
            <div className="space-y-3">
              {plan.map(m => {
                const status = m.completed ? 'completed' : m.skipped ? 'skipped' : 'missed';
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border ${
                      status === 'completed' ? 'border-emerald-100 bg-emerald-50/50' :
                      status === 'skipped'   ? 'border-slate-100 bg-slate-50 opacity-50' :
                                               'border-rose-100 bg-rose-50/30'
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="font-black text-emerald-950 text-sm">{m.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {m.time} · {m.cal} kcal
                      </p>
                    </div>
                    {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {status === 'skipped'   && <XCircle      className="w-4 h-4 text-slate-300   shrink-0" />}
                    {status === 'missed'    && <AlertCircle  className="w-4 h-4 text-rose-400    shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logs column */}
          <div>
            <h4 className="font-black text-emerald-950 mb-4 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-600" /> What Was Logged
            </h4>
            <div className="space-y-3">
              {dayLogs.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 font-black text-sm">
                  No logs
                </div>
              ) : dayLogs.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-emerald-100 bg-emerald-50/30">
                  <span className="text-xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="font-black text-emerald-950 text-sm">{m.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{m.cal} kcal · {m.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Macro section */}
        <div className="bg-slate-50 rounded-2xl p-6 flex items-center gap-8">
          <div className="w-40 h-40 relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={macroData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={6} dataKey="value" stroke="none">
                  {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-emerald-950">{record.goalAdh}%</span>
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Protein', val: record.prot,  tgt: target.protein, color: 'bg-emerald-500' },
              { label: 'Carbs',   val: record.carbs, tgt: target.carbs,   color: 'bg-amber-500'   },
              { label: 'Fat',     val: record.fat,   tgt: target.fat,     color: 'bg-indigo-500'  },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-black mb-1">
                  <span className="text-slate-500 uppercase tracking-widest">{m.label}</span>
                  <span className="text-emerald-700">{m.val}g / {m.tgt}g</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className={`h-full ${m.color} rounded-full`}
                    style={{ width: `${Math.min(100, Math.round(m.val / m.tgt * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
