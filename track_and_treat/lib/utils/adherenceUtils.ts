import { TARGET } from "@/lib/constants/targets";
import type { DayLogs } from "@/lib/types";
import { INITIAL_DAY_LOGS } from "@/lib/constants/mockdata";

export function getDayTotals(dayLogs: DayLogs, dayIdx: number) {
  const logs = dayLogs[dayIdx] || [];
  return {
    cal: logs.reduce((s, m) => s + m.cal, 0),
    prot: logs.reduce((s, m) => s + m.prot, 0),
    carbs: logs.reduce((s, m) => s + m.carbs, 0),
    fat: logs.reduce((s, m) => s + m.fat, 0),
  };
}

export function getGoalAdherenceRatio(dayLogs: any, dayIdx: number) {
  const totals = getDayTotals(dayLogs, dayIdx);
  return TARGET.cals > 0 ? totals.cal / TARGET.cals : 0;
}

export function getPlanAdherenceRatio(plans: any, dayIdx: number) {
  const plan = plans[dayIdx] || [];
  return plan.length === 0 ? 0 : plan.filter((m: any) => m.completed).length / plan.length;
}



export function getComplianceLabel(pct: number) {
  if (pct >= 0.85 && pct <= 1.10)
    return { label: "On Track", color: "#10b981", bg: "bg-emerald-600", emoji: "🥗" };
  if (pct < 0.85)
    return { label: "Under Target", color: "#f59e0b", bg: "bg-amber-500", emoji: "📉" };
  return { label: "Over Target", color: "#ef4444", bg: "bg-rose-500", emoji: "⚠️" };
}

export function getModeLabel(planPct: number) {
  if (planPct >= 0.9)
    return { label: "Strict Mode", icon: "🎯", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (planPct >= 0.6)
    return { label: "Balanced Mode", icon: "⚖️", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  return { label: "Lenient Mode", icon: "🌿", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" };
}