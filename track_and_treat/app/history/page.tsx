'use client';

import { useState, useMemo } from 'react';

// ✅ CONTEXT
import { useAppContext } from '@/lib/context/AppContext';

import { HistorySummaryCards }              from '@/components/History/HistorySummaryCards';
import { AdherenceChart, CalorieChart }     from '@/components/History/Charts';
import { DailyRecordsList, DayDetailModal } from '@/components/History/DailyRecords';

import {
  WEEK_HISTORY_DATA,
  MONTH_HISTORY_DATA,
} from '@/lib/constants/mockdata';
import { TARGET } from '@/lib/constants/targets';

import {
  getDayTotals,
  getGoalAdherenceRatio,
  getPlanAdherenceRatio,
} from '@/lib/utils/adherenceUtils';

import type { HistoryRecord } from '@/lib/types';


export default function HistoryPage() {

  // ✅ USE CONTEXT
  const { dayPlans, dayLogs } = useAppContext();

  const [filter, setFilter] = useState<'week' | 'month'>('week');
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  // ✅ Build real history from logs
  const dynamicHistory: HistoryRecord[] = useMemo(() => {
    return Object.keys(dayLogs).map((key) => {
      const dayIdx = Number(key);

      const totals = getDayTotals(dayLogs, dayIdx);
      const goalAdh = getGoalAdherenceRatio(dayLogs, dayIdx);
      const planAdh = getPlanAdherenceRatio(dayPlans, dayIdx);

      return {
        date: `Day ${dayIdx}`,
        dayIdx,
        goalAdh: Math.round(goalAdh * 100),
        planAdh: Math.round(planAdh * 100),
        cals: totals.cal,
        prot: totals.prot,
        carbs: totals.carbs,
        fat: totals.fat,
      };
    });
  }, [dayLogs, dayPlans]);

  // Charts still use mock for smooth UI (optional)
  const chartData = filter === 'week' ? WEEK_HISTORY_DATA : MONTH_HISTORY_DATA;

  return (
    <main className="w-full px-4 sm:px-8 lg:px-12 py-8">

      {/* Modal */}
      {selectedRecord && (
        <DayDetailModal
          record={selectedRecord}
          plans={dayPlans}   // ✅ real data
          logs={dayLogs}     // ✅ real data
          target={TARGET}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-black text-emerald-950">Progress History</h2>
          <p className="text-slate-400 font-medium mt-1">
            Your journey, visualised over time.
          </p>
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
          {(['week', 'month'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl font-black text-sm transition-all uppercase tracking-widest ${
                filter === f
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {f === 'week' ? 'Past Week' : 'Past Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary + Charts */}
      <HistorySummaryCards chartData={chartData} />
      <AdherenceChart      chartData={chartData} />
      <CalorieChart        chartData={chartData} target={TARGET} />

      {/* ✅ REAL DATA LIST */}
      <DailyRecordsList
        records={dynamicHistory}
        onSelect={setSelectedRecord}
      />

    </main>
  );
}