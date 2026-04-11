// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/algorithms/nutrition.ts
// Implements: Mifflin-St Jeor BMR, TDEE, Macro Distribution,
//             Adaptive Strictness State Machine, BMI Categorization
// ─────────────────────────────────────────────────────────────────────────────

import type { PhysicalMetrics, StrictnessLevel, MacroTargets } from '@/lib/types';

// ─── ALGORITHM 1: BMR Calculation (Mifflin-St Jeor Equation) ─────────────────
// Formula: (10 × weight_kg) + (6.25 × height_cm) − (5 × age) ± gender_offset
// Male offset: +5 | Female offset: −161
export function calculateBMR(metrics: PhysicalMetrics): number {
  const { weight: w, height: h, age: a } = metrics;

  // Explicit coefficients: 10*Weight + 6.25*Height - 5*Age
  const base = 10 * w + 6.25 * h - 5 * a;

  // Gender offset: Male (+5), Female (−161)
  return metrics.gender.toLowerCase() === 'male' ? base + 5 : base - 161;
}

// ─── ALGORITHM 2: TDEE Calculation ───────────────────────────────────────────
// Converts BMR → Total Daily Energy Expenditure via activity multiplier,
// then applies a caloric offset based on the user's goal.
export function calculateTDEE(metrics: PhysicalMetrics): number {
  const bmr = calculateBMR(metrics);

  // Activity multipliers (Harris-Benedict / Katch-McArdle standard coefficients)
  const multiplierMap: Record<PhysicalMetrics['activityLevel'], number> = {
    sedentary:    1.2,
    moderate:     1.375,
    active:       1.55,
    extra_active: 1.725,
  };

  const maintenance = bmr * multiplierMap[metrics.activityLevel];

  // Goal adjustment: lose → −500 kcal/day, gain → +300 kcal/day
  if (metrics.goal === 'lose') return Math.round(maintenance - 500);
  if (metrics.goal === 'gain') return Math.round(maintenance + 300);
  return Math.round(maintenance);
}

// ─── ALGORITHM 3: Macro Distribution ─────────────────────────────────────────
// Protein yields 4 kcal/g | Carbs yield 4 kcal/g | Fat yields 9 kcal/g
// Ratios shift based on goal: lose → high-protein, gain → high-carb
export function calculateMacros(calories: number, goal: PhysicalMetrics['goal']): MacroTargets {
  // Default ratio: 30 / 40 / 30 (P / C / F)
  let pRatio = 0.30;
  let cRatio = 0.40;
  let fRatio = 0.30;

  if (goal === 'gain') {
    // Hypertrophy: prioritise carbs for glycogen and insulin response
    pRatio = 0.25; cRatio = 0.55; fRatio = 0.20;
  } else if (goal === 'lose') {
    // Cut: elevated protein to preserve lean mass during deficit
    pRatio = 0.40; cRatio = 0.30; fRatio = 0.30;
  }

  return {
    cals:    calories,
    protein: Math.round((calories * pRatio) / 4),  // 4 kcal per gram
    carbs:   Math.round((calories * cRatio) / 4),  // 4 kcal per gram
    fat:     Math.round((calories * fRatio) / 9),  // 9 kcal per gram
  };
}

// ─── ALGORITHM 4: Adaptive Strictness State Machine ──────────────────────────
// Deterministic state machine based on deviation from perfect compliance (1.0).
// Input: array of adherence ratios (0.0 – 1.0+)
// Output: LENIENT | MODERATE | STRICT
export function getStrictnessLevel(adherenceHistory: number[]): StrictnessLevel {
  if (adherenceHistory.length === 0) return 'MODERATE';

  // Step 1: Compute rolling average
  const avg = adherenceHistory.reduce((sum, v) => sum + v, 0) / adherenceHistory.length;

  // Step 2: Distance-based deviation from perfect compliance (1.0 = 100%)
  const deviation = Math.abs(1 - avg);

  // Rule 1 — Consistency Reward: within 10% of target → ease restrictions
  if (deviation <= 0.1) return 'LENIENT';

  // Rule 2 — Corrective Pressure: >30% off target → enforce stricter controls
  if (deviation >= 0.3) return 'STRICT';

  // Default: balanced standard mode
  return 'MODERATE';
}

// ─── ALGORITHM 5: BMI & Weight Categorization ────────────────────────────────
// BMI = weight_kg / height_m²
// Thresholds: <18.5 Underweight | 18.5–24.9 Normal | 25–29.9 Overweight | ≥30 Obese
export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM === 0) return 0;
  return Number((weight / (heightM * heightM)).toFixed(1));
}

export function getWeightCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight',   color: 'text-sky-500'     };
  if (bmi < 25.0) return { label: 'Normal Weight', color: 'text-emerald-500' };
  if (bmi < 30.0) return { label: 'Overweight',    color: 'text-orange-500'  };
  return               { label: 'Obese',           color: 'text-rose-600'    };
}

// ─── Convenience: compute everything in one call ──────────────────────────────
export function computeFullProfile(metrics: PhysicalMetrics) {
  const tdee    = calculateTDEE(metrics);
  const macros  = calculateMacros(tdee, metrics.goal);
  const bmi     = calculateBMI(metrics.weight, metrics.height);
  const bmiInfo = getWeightCategory(bmi);
  return { tdee, macros, bmi, bmiInfo };
}
