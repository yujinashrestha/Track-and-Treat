/* Implements Mifflin-St Jeor and Strictness State Machine.
 */

export interface PhysicalMetrics {
  age: number;
  gender: string;
  weight: number; // kg
  height: number; // cm
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'extra_active';
  goal: 'lose' | 'maintain' | 'gain';
}

/**
 * ALGORITHM 1: BMR Calculation (Mifflin-St Jeor Equation)
 * Manual Implementation.
 */
export function calculateBMR(metrics: PhysicalMetrics): number {
  const w = metrics.weight;
  const h = metrics.height;
  const a = metrics.age;
  
  // Explicit Coefficients: 10*Weight + 6.25*Height - 5*Age
  const base = (10 * w) + (6.25 * h) - (5 * a);
  
  // Gender Offset: Male (+5), Female (-161)
  if (metrics.gender.toLowerCase() === 'male') {
    return base + 5;
  } else {
    return base - 161;
  }
}

/**
 * ALGORITHM 2: TDEE Calculation
 * Converts BMR into Total Daily Energy Expenditure (TDEE)
 */
export function calculateTDEE(metrics: PhysicalMetrics): number {
  const bmr = calculateBMR(metrics);
  let multiplier = 1.2; // Default
  //multiplier is the activity coefficient
  // Explicit conditional mapping
  if (metrics.activityLevel === 'moderate') multiplier = 1.375;
  else if (metrics.activityLevel === 'active') multiplier = 1.55;
  else if (metrics.activityLevel === 'extra_active') multiplier = 1.725;
  
  const maintenance = bmr * multiplier;
  
  // Manual Goal Adjustment
  if (metrics.goal === 'lose') return Math.round(maintenance - 500);
  if (metrics.goal === 'gain') return Math.round(maintenance + 300);
  return Math.round(maintenance);
}

/**
 * ALGORITHM 3: Macro Distribution
 * Logic: Protein focus for gain/lose, balanced for maintain.
 */
export function calculateMacros(calories: number, goal: string) {
  let pRatio = 0.3; // 30% Protein
  let cRatio = 0.4; // 40% Carbs
  let fRatio = 0.3; // 30% Fat

  if (goal === 'gain') {
    pRatio = 0.25;
    cRatio = 0.55;
    fRatio = 0.2;
  } else if (goal === 'lose') {
    pRatio = 0.4;
    cRatio = 0.3;
    fRatio = 0.3;
  }

  return {
    protein: Math.round((calories * pRatio) / 4), // 4 cal per gram
    carbs: Math.round((calories * cRatio) / 4),
    fat: Math.round((calories * fRatio) / 9) // 9 cal per gram
  };
}

/**
 * ALGORITHM 4a: Weighted Adherence Score
 * Factors in calories (50%) + protein (20%) + carbs (15%) + fat (15%).
 * Each component = 1 - |deviation from target ratio|, clamped to [0, 1].
 */
export interface MacroTotals {
  protein: number;
  carbs: number;
  fat: number;
}

export function calculateAdherence(
  consumedCals: number,
  targetCals: number,
  consumedMacros: MacroTotals,
  targetMacros: MacroTotals,
): number {
  if (targetCals <= 0) return 0;

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const ratio = (consumed: number, target: number) =>
    target > 0 ? clamp01(1 - Math.abs(consumed - target) / target) : 1;

  const calScore = ratio(consumedCals, targetCals);
  const protScore = ratio(consumedMacros.protein, targetMacros.protein);
  const carbScore = ratio(consumedMacros.carbs, targetMacros.carbs);
  const fatScore = ratio(consumedMacros.fat, targetMacros.fat);

  return calScore * 0.5 + protScore * 0.2 + carbScore * 0.15 + fatScore * 0.15;
}

/**
 * ALGORITHM 4b: Adaptive Strictness Mode (Behavior-Aware Logic)
   Deterministic state machine.
 */
export type StrictnessLevel = 'LENIENT' | 'MODERATE' | 'STRICT';

export function getStrictnessLevel(adherenceHistory: number[]): StrictnessLevel {
  /**
   * ADHERENCE ALGORITHM (Distance-Based):
   * We calculate the absolute deviation from 1.0 (perfect compliance).
   * Perfect Compliance = 1.0 (100%)
   */
  if (adherenceHistory.length === 0) return 'MODERATE';
  
  // Calculate average performance
  const avg = adherenceHistory.reduce((s, v) => s + v, 0) / adherenceHistory.length;
  
  // Calculate deviation from 1.0
  const deviation = Math.abs(1 - avg);
  
  // RULE 1: Consistency Reward (Within 10% of target)
  if (deviation <= 0.1) return 'LENIENT';
  
  // RULE 2: Corrective Pressure (Outside 30% of target)
  if (deviation >= 0.3) return 'STRICT';
  
  // DEFAULT: Standard Mode
  return 'MODERATE';
}

/**
 * ALGORITHM 5: BMI & Weight Categorization
 * Manual Implementation of Body Mass Index calculation.
 */
export function calculateBMI(weight: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM === 0) return 0;
  return Number((weight / (heightM * heightM)).toFixed(1));
}

export function getWeightCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight Identified', color: 'text-sky-500' };
  if (bmi < 25) return { label: 'Normal Weight Identified', color: 'text-emerald-500' };
  if (bmi < 30) return { label: 'Overweight Identified', color: 'text-orange-500' };
  return { label: 'Obese Category Identified', color: 'text-rose-600' };
}
