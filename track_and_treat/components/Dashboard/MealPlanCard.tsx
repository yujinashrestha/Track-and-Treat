'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/dashboard/MealPlanCard.tsx
// Step 1: The Plan — shows AI-generated meal plan with validate/skip actions
// ─────────────────────────────────────────────────────────────────────────────

import { Target, ShieldAlert } from 'lucide-react';
import type { MealPlanItem } from '@/lib/types';

interface MealPlanCardProps {
  plan:       MealPlanItem[];
  planAdh:    number;
  dateLabel:  string;
  isToday:    boolean;
  isPast:     boolean;
  isFuture:   boolean;
  onValidate: (mealId: number) => void;
  onSkip:     (mealId: number) => void;
}

export default function MealPlanCard({
  plan, planAdh, dateLabel, isToday, isPast, isFuture, onValidate, onSkip,
}: MealPlanCardProps) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-emerald-950 flex items-center gap-3">
          <Target className="w-7 h-7 text-emerald-600" /> Step 1: The Plan
        </h3>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{dateLabel}</span>
      </div>

      {/* Meal rows */}
      <div className="space-y-4 flex-1">
        {plan.length === 0 ? (
          <div className="h-40 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-slate-300 font-black">
            No plan generated yet
          </div>
        ) : (
          plan.map(meal => (
            <MealPlanRow
              key={meal.id}
              meal={meal}
              isToday={isToday}
              isPast={isPast}
              isFuture={isFuture}
              onValidate={() => onValidate(meal.id)}
              onSkip={() => onSkip(meal.id)}
            />
          ))
        )}
      </div>

      {/* Plan adherence progress bar */}
      {(isToday || isPast) && plan.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Plan Adherence</span>
            <span className="text-sm font-black text-emerald-600">{Math.round(planAdh * 100)}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.round(planAdh * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single meal row inside the plan card ────────────────────────────────────

interface MealPlanRowProps {
  meal:       MealPlanItem;
  isToday:    boolean;
  isPast:     boolean;
  isFuture:   boolean;
  onValidate: () => void;
  onSkip:     () => void;
}

function MealPlanRow({ meal, isToday, isPast, isFuture, onValidate, onSkip }: MealPlanRowProps) {
  return (
    <div
      className={`group flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
        meal.skipped
          ? 'bg-slate-50 border-transparent opacity-50'
          : 'bg-white border-slate-100 hover:border-emerald-600/40'
      }`}
    >
      {/* Icon + name */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">
          {meal.icon}
        </div>
        <div>
          <p className="font-black text-emerald-950">{meal.name}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {meal.time} · {meal.cal} kcal
          </p>
        </div>
      </div>

      {/* Actions */}
      {(isToday || isPast) && (
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className={`p-3 rounded-2xl transition-all ${
              meal.skipped
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
          <button
            disabled={meal.completed || meal.skipped}
            onClick={onValidate}
            className={`px-5 py-3 rounded-2xl font-black text-sm transition-all ${
              meal.completed
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10'
            }`}
          >
            {meal.completed ? 'Validated' : 'Validate'}
          </button>
        </div>
      )}

      {isFuture && (
        <span className="px-4 py-2 rounded-2xl bg-slate-50 text-slate-300 font-black text-sm">Scheduled</span>
      )}
    </div>
  );
}
