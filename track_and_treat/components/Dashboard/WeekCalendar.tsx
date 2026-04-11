'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/dashboard/WeekCalendar.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { Calendar } from 'lucide-react';
import { WEEK_DAYS, MONTHS, TODAY } from '@/lib/constants/dates';
import { isSameDay } from '@/lib/utils/dateUtils';
import { getGoalAdherenceRatio, getPlanAdherenceRatio, getComplianceLabel } from '@/lib/utils/adherenceUtils';
import type { DayPlans, DayLogs, MacroTargets } from '@/lib/types';

interface WeekCalendarProps {
  selectedDate:    Date;
  setSelectedDate: (date: Date) => void;
  weekDates:       Date[];
  dayPlans:        DayPlans;
  dayLogs:         DayLogs;
  target:          MacroTargets;
}

export default function WeekCalendar({
  selectedDate, setSelectedDate, weekDates, dayPlans, dayLogs, target,
}: WeekCalendarProps) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-emerald-950 flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-emerald-600" />
          Week of {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getDate()} –{' '}
          {weekDates[6].getDate()}, {weekDates[0].getFullYear()}
        </h3>
        <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> On Track
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Under
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Future
          </span>
        </div>
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-3">
        {weekDates.map((date, idx) => {
          const isToday    = isSameDay(date, TODAY);
          const isSelected = isSameDay(date, selectedDate);
          const isPast     = date < TODAY && !isToday;
          const hasData    = isPast || isToday;

          const goalAdh = hasData ? getGoalAdherenceRatio(dayLogs, idx) : null;
          const planAdh = hasData ? getPlanAdherenceRatio(dayPlans, idx) : null;
          const { color } = goalAdh !== null ? getComplianceLabel(goalAdh) : { color: '#cbd5e1' };

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all border-2 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-900/10'
                  : isToday
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : isPast
                  ? 'border-transparent bg-slate-50 hover:border-emerald-200 text-slate-700'
                  : 'border-transparent bg-slate-50/50 text-slate-300 hover:border-slate-200'
              }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                {WEEK_DAYS[date.getDay()]}
              </span>
              <span className="text-xl font-black">{date.getDate()}</span>

              {/* Goal adherence mini-bar */}
              <div className="mt-2 w-full flex flex-col items-center gap-1">
                <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: goalAdh !== null ? `${Math.min(100, Math.round(goalAdh * 100))}%` : '0%',
                      backgroundColor: isSelected
                        ? 'rgba(255,255,255,0.8)'
                        : (goalAdh !== null ? color : '#e2e8f0'),
                    }}
                  />
                </div>
                {goalAdh !== null && (
                  <span className={`text-[9px] font-black ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                    {Math.round(goalAdh * 100)}%
                  </span>
                )}
              </div>

              {/* Plan adherence label */}
              {planAdh !== null && (
                <div className={`mt-1 text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                  {Math.round(planAdh * 100)}% plan
                </div>
              )}

              {isToday && !isSelected && (
                <span className="mt-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest">TODAY</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
