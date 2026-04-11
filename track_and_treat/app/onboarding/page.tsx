'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAppContext } from '@/lib/context/AppContext';

import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateBMI,
  getWeightCategory,
  getStrictnessLevel,
} from '@/lib/algorithms/nutrition-logic';

import type { PhysicalMetrics, MacroTargets } from '@/lib/types';

export default function OnboardingPage() {
  const router = useRouter();
  const { setMetrics, setDailyCals, userName, metrics: savedMetrics } = useAppContext();

  const [metrics, setLocal] = useState<PhysicalMetrics>({
    age: 25,
    gender: 'male',
    weight: 70,
    height: 170,
    activityLevel: 'moderate',
    goal: 'maintain',
  });

  const [result, setResult] = useState<{
    bmr: number;
    tdee: number;
    bmi: number;
    macros: MacroTargets;
    strictness: string;
    bmiLabel: string;
    bmiColor: string;
  } | null>(null);

  const [saved, setSaved] = useState(false);

  // Pre-fill from context or localStorage
  useEffect(() => {
    if (savedMetrics) {
      setLocal(savedMetrics);
      return;
    }
    try {
      const raw = localStorage.getItem('userMetrics');
      if (raw) { setLocal(JSON.parse(raw)); return; }

      const age           = localStorage.getItem('age');
      const gender        = localStorage.getItem('gender');
      const weight        = localStorage.getItem('weight');
      const height        = localStorage.getItem('height');
      const activityLevel = localStorage.getItem('activityLevel');
      const goal          = localStorage.getItem('goal');

      setLocal(prev => ({
        age:           age           ? parseInt(age)                                           : prev.age,
        gender:        gender        ? (gender as PhysicalMetrics['gender'])                   : prev.gender,
        weight:        weight        ? parseFloat(weight)                                      : prev.weight,
        height:        height        ? parseFloat(height)                                      : prev.height,
        activityLevel: activityLevel ? (activityLevel as PhysicalMetrics['activityLevel'])     : prev.activityLevel,
        goal:          goal          ? (goal as PhysicalMetrics['goal'])                       : prev.goal,
      }));
    } catch { /* fall back to defaults */ }
  }, [savedMetrics]);

  const update = <K extends keyof PhysicalMetrics>(key: K, value: PhysicalMetrics[K]) =>
    setLocal(prev => ({ ...prev, [key]: value }));

  const calculate = () => {
    const bmr        = calculateBMR(metrics);
    const tdee       = calculateTDEE(metrics);
    const macros     = calculateMacros(tdee, metrics.goal);
    const bmi        = calculateBMI(metrics.weight, metrics.height);
    const bmiInfo    = getWeightCategory(bmi);
    const strictness = getStrictnessLevel([0.9, 0.8, 0.95, 0.88]);
    setResult({ bmr, tdee, macros, bmi, bmiLabel: bmiInfo.label, bmiColor: bmiInfo.color, strictness });
  };

  const save = () => {
    if (!result) return;

    // 1. Persist to context + localStorage
    setMetrics(metrics);
    setDailyCals(result.tdee);

    // 2. Show success tick
    setSaved(true);

    // 3. Navigate to dashboard after a short delay
    setTimeout(() => router.push('/dashboard'), 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-white p-8 rounded-3xl shadow border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-emerald-700">
                {userName ? userName[0].toUpperCase() : 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black">Welcome, {userName || 'User'} 👋</h1>
              <p className="text-slate-500 font-medium">
                Your stats are pre-filled from signup — update anything below.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white p-8 rounded-3xl shadow border space-y-6">
          <h2 className="font-black flex gap-2 items-center text-lg">
            <Activity className="text-emerald-600" /> Your Stats
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Age (years)">
              <input type="number" value={metrics.age}
                onChange={e => update('age', Number(e.target.value))}
                className="w-full bg-transparent font-black text-lg outline-none" />
            </Field>

            <Field label="Weight (kg)">
              <input type="number" value={metrics.weight}
                onChange={e => update('weight', Number(e.target.value))}
                className="w-full bg-transparent font-black text-lg outline-none" />
            </Field>

            <Field label="Height (cm)">
              <input type="number" value={metrics.height}
                onChange={e => update('height', Number(e.target.value))}
                className="w-full bg-transparent font-black text-lg outline-none" />
            </Field>

            <Field label="Gender">
              <select value={metrics.gender}
                onChange={e => update('gender', e.target.value as PhysicalMetrics['gender'])}
                className="w-full bg-transparent font-black capitalize">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>

            <Field label="Activity Level">
              <select value={metrics.activityLevel}
                onChange={e => update('activityLevel', e.target.value as PhysicalMetrics['activityLevel'])}
                className="w-full bg-transparent font-black capitalize">
                <option value="sedentary">Sedentary</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="extra_active">Extra Active</option>
              </select>
            </Field>

            <Field label="Goal">
              <select value={metrics.goal}
                onChange={e => update('goal', e.target.value as PhysicalMetrics['goal'])}
                className="w-full bg-transparent font-black capitalize">
                <option value="lose">Lose Weight</option>
                <option value="maintain">Maintain</option>
                <option value="gain">Gain Muscle</option>
              </select>
            </Field>
          </div>

          <button onClick={calculate}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black hover:bg-emerald-700 transition">
            Recalculate Plan
          </button>
        </div>

        {/* RESULTS */}
        {result && (
          <div className="bg-white p-8 rounded-3xl shadow border space-y-6">
            <h2 className="font-black text-lg">Your Results</h2>

            <div className="grid grid-cols-2 gap-4">
              <ResultBox label="BMR"        value={`${result.bmr} kcal`}  />
              <ResultBox label="TDEE"       value={`${result.tdee} kcal`} />
              <ResultBox label="BMI"        value={`${result.bmi}`}       sub={result.bmiLabel} color={result.bmiColor} />
              <ResultBox label="Strictness" value={result.strictness}     />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <ResultBox label="Protein" value={`${result.macros.protein}g`} color="text-emerald-600" />
              <ResultBox label="Carbs"   value={`${result.macros.carbs}g`}   color="text-amber-600"   />
              <ResultBox label="Fat"     value={`${result.macros.fat}g`}     color="text-indigo-600"  />
            </div>

            {/* Save button — shows spinner → tick → navigates */}
            <button
              onClick={save}
              disabled={saved}
              className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 ${
                saved
                  ? 'bg-emerald-500 text-white scale-[0.99]'
                  : 'bg-black text-white hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Saved! Redirecting...
                </>
              ) : (
                'Save Profile →'
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl">
      <p className="text-xs text-slate-400 font-bold mb-1">{label}</p>
      {children}
    </div>
  );
}

function ResultBox({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl">
      <p className="text-xs text-slate-400 font-bold mb-1">{label}</p>
      <p className={`text-xl font-black ${color ?? 'text-emerald-950'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}