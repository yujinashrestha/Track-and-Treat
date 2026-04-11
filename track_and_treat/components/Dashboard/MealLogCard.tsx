'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/dashboard/MealLogCard.tsx
// Step 2: Reality — shows what the user actually ate with an add-log form
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Utensils, PlusCircle, Zap } from 'lucide-react';
import type { MealLogItem } from '@/lib/types';

interface MealLogCardProps {
  logs:       MealLogItem[];
  dateLabel:  string;
  isToday:    boolean;
  onAddLog:   (mealName: string) => void;
}

export default function MealLogCard({ logs, dateLabel, isToday, onAddLog }: MealLogCardProps) {
  const [showForm,   setShowForm]   = useState(false);
  const [mealInput,  setMealInput]  = useState('');

  const handleSubmit = () => {
    if (!mealInput.trim()) return;
    onAddLog(mealInput);
    setMealInput('');
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-emerald-950 flex items-center gap-3">
          <Utensils className="w-7 h-7 text-emerald-600" /> Step 2: Reality
        </h3>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{dateLabel}</span>
      </div>

      {/* Log list */}
      <div className="space-y-4 max-h-[340px] overflow-y-auto mb-6 pr-1 flex-1">
        {logs.length === 0 ? (
          <div className="h-40 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 font-black italic">
            No logs for this day
          </div>
        ) : (
          logs.map((m, i) => <MealLogRow key={i} meal={m} />)
        )}
      </div>

      {/* Record intake — only for today */}
      {isToday && (
        !showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full p-6 bg-emerald-900 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-emerald-900/10"
          >
            <PlusCircle className="w-6 h-6" /> Record Intake
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: 200g Daal Bhat..."
                value={mealInput}
                onChange={e => setMealInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 focus:border-emerald-600 rounded-3xl outline-none font-bold text-lg pr-20 shadow-inner"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2">
                <Zap className={`w-6 h-6 ${mealInput ? 'text-emerald-600' : 'text-slate-200'}`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setShowForm(false); setMealInput(''); }}
                className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-900/10"
              >
                Save Log
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ─── Single logged meal row ───────────────────────────────────────────────────

function MealLogRow({ meal }: { meal: MealLogItem }) {
  return (
    <div className="flex flex-col p-5 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">
            {meal.emoji}
          </div>
          <div>
            <p className="font-black text-emerald-950">{meal.name}</p>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{meal.cal} kcal</p>
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{meal.time}</span>
      </div>
      <div className="flex gap-3 border-t border-emerald-100/50 pt-3">
        <span className="text-[9px] font-black text-emerald-700 bg-white px-2 py-1 rounded-md shadow-sm">P: {meal.prot}g</span>
        <span className="text-[9px] font-black text-amber-600   bg-white px-2 py-1 rounded-md shadow-sm">C: {meal.carbs}g</span>
        <span className="text-[9px] font-black text-indigo-600  bg-white px-2 py-1 rounded-md shadow-sm">F: {meal.fat}g</span>
      </div>
    </div>
  );
}
