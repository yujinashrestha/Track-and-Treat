// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/types/index.ts
// Central type definitions for Track & Treat
// ─────────────────────────────────────────────────────────────────────────────

export interface PhysicalMetrics {
  age: number;
  gender: string;
  weight: number;    // kg
  height: number;    // cm
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'extra_active';
  goal: 'lose' | 'maintain' | 'gain';
}

export type StrictnessLevel = 'LENIENT' | 'MODERATE' | 'STRICT';

export interface MacroTargets {
  cals: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanItem {
  id: number;
  name: string;
  icon: string;
  time: string;
  cal: number;
  completed: boolean;
  skipped: boolean;
}

export interface MealLogItem {
  name: string;
  emoji: string;
  cal: number;
  prot: number;
  carbs: number;
  fat: number;
  time: string;
}

export interface DayTotals {
  cal: number;
  prot: number;
  carbs: number;
  fat: number;
}

export interface DayPlans {
  [dayIndex: number]: MealPlanItem[];
}

export interface DayLogs {
  [dayIndex: number]: MealLogItem[];
}

export interface HistoryRecord {
  date: string;
  dayIdx: number;
  goalAdh: number;
  planAdh: number;
  cals: number;
  prot: number;
  carbs: number;
  fat: number;
}

export interface ChartDataPoint {
  day: string;
  goalAdherence: number;
  planAdherence: number;
  cals: number;
}

export interface ComplianceInfo {
  label: string;
  color: string;
  bg: string;
  emoji: string;
}

export interface ModeInfo {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export interface MacroData {
  name: string;
  value: number;
  color: string;
}

export interface BMIResult {
  bmi: number;
  label: string;
  color: string;
}
