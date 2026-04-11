'use client';

import { useState, useMemo } from 'react';

// ✅ IMPORT CONTEXT
import { useAppContext } from '@/lib/context/AppContext';

import WeekCalendar     from '@/components/Dashboard/WeekCalendar';
import ComplianceHero   from '@/components/Dashboard/ComplianceHero';
import MealPlanCard     from '@/components/Dashboard/MealPlanCard';
import MealLogCard      from '@/components/Dashboard/MealLogCard';
import MetabolicSummary from '@/components/Dashboard/MetabolicSummary';

import { TODAY, WEEK_DAYS, MONTHS } from '@/lib/constants/dates';
import { WEEK_HISTORY_DATA } from '@/lib/constants/mockdata';
import { TARGET } from '@/lib/constants/targets';

import { getWeekDates, isSameDay, getDayIndex } from '@/lib/utils/dateUtils';
import { getDayTotals, getGoalAdherenceRatio, getPlanAdherenceRatio } from '@/lib/utils/adherenceUtils';


export default function DashboardPage() {

  // ✅ USE CONTEXT
  const {
    dayPlans,
    dayLogs,
    validateMeal,
    skipMeal,
    logMealFromText,
  } = useAppContext();

  const weekDates = useMemo(() => getWeekDates(TODAY), []);

  const [selectedDate, setSelectedDate] = useState<Date>(TODAY);

  const selectedIdx = getDayIndex(selectedDate, weekDates);
  const isToday     = isSameDay(selectedDate, TODAY);
  const isPast      = selectedDate < TODAY && !isToday;
  const isFuture    = selectedDate > TODAY;

  const currentPlan = dayPlans[selectedIdx] ?? [];
  const currentLogs = dayLogs[selectedIdx]  ?? [];

  const totals    = useMemo(() => getDayTotals(dayLogs, selectedIdx), [dayLogs, selectedIdx]);
  const adherence = getGoalAdherenceRatio(dayLogs, selectedIdx);
  const planAdh   = getPlanAdherenceRatio(dayPlans, selectedIdx);

  const dateLabel = isToday
    ? 'Today'
    : `${WEEK_DAYS[selectedDate.getDay()]}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`;

  // ── HANDLERS (NOW USING CONTEXT) ─────────────────────────

  const handleValidateMeal = (mealId: number) => {
    validateMeal(selectedIdx, mealId);
  };

  const handleSkipMeal = (mealId: number) => {
    skipMeal(selectedIdx, mealId);
  };

  const handleAddLog = (mealText: string) => {
    logMealFromText(selectedIdx, mealText); // 🔥 THIS IS YOUR AI FEATURE
  };

  // ── UI ──────────────────────────────────────────────────

  return (
    <main className="w-full px-4 sm:px-8 lg:px-12 py-8">

      <WeekCalendar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        weekDates={weekDates}
        dayPlans={dayPlans}
        dayLogs={dayLogs}
        target={TARGET}
      />

      <ComplianceHero
        dateLabel={dateLabel}
        adherence={adherence}
        planAdh={planAdh}
        isFuture={isFuture}
        target={TARGET}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">

        <MealPlanCard
          plan={currentPlan}
          planAdh={planAdh}
          dateLabel={dateLabel}
          isToday={isToday}
          isPast={isPast}
          isFuture={isFuture}
          onValidate={handleValidateMeal}
          onSkip={handleSkipMeal}
        />

        <MealLogCard
          logs={currentLogs}
          dateLabel={dateLabel}
          isToday={isToday}
          onAddLog={handleAddLog} // 🔥 now uses parser
        />

      </div>

      <MetabolicSummary
        totals={totals}
        adherence={adherence}
        planAdh={planAdh}
        target={TARGET}
      />

    </main>
  );
}