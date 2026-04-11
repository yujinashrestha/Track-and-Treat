'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, User } from 'lucide-react';

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

const DEFAULT: PhysicalMetrics = {
  age: 25,
  gender: 'male',
  weight: 70,
  height: 170,
  activityLevel: 'moderate',
  goal: 'maintain',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { userName, setMetrics, setDailyCals, login } = useAppContext();

  const [metrics, setLocal] = useState<PhysicalMetrics>(DEFAULT);

  const [result, setResult] = useState<{
    bmr: number;
    tdee: number;
    bmi: number;
    macros: MacroTargets;
    strictness: string;
    bmiLabel: string;
  } | null>(null);

  const update = (key: keyof PhysicalMetrics, value: any) => {
    setLocal((p) => ({ ...p, [key]: value }));
  };

  const calculate = () => {
    const bmr = calculateBMR(metrics);
    const tdee = calculateTDEE(metrics);
    const macros = calculateMacros(tdee, metrics.goal);
    const bmi = calculateBMI(metrics.weight, metrics.height);
    const bmiInfo = getWeightCategory(bmi);
    const strictness = getStrictnessLevel([0.9, 0.8, 0.95, 0.88]);

    setResult({
      bmr,
      tdee,
      macros,
      bmi,
      bmiLabel: bmiInfo.label,
      strictness,
    });
  };

  const save = () => {
    if (!result) return;

    setMetrics(metrics);
    setDailyCals(result.tdee);

    login('demo-token', userName || 'User');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">

      <div className="w-full max-w-3xl space-y-6">

        {/* HEADER */}
        <div className="bg-white p-8 rounded-3xl shadow border">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-100 rounded-2xl">
              <User className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black">
                Welcome, {userName || 'User'} 👋
              </h1>
              <p className="text-slate-500">
                Let’s build your nutrition profile
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-white p-8 rounded-3xl shadow border space-y-5">

          <h2 className="font-black flex gap-2 items-center">
            <Activity className="text-emerald-600" />
            Your Stats
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Input label="Age" value={metrics.age}
              onChange={(v: string) => update('age', Number(v))} />

            <Input label="Weight" value={metrics.weight}
              onChange={(v: string) => update('weight', Number(v))} />

            <Input label="Height" value={metrics.height}
              onChange={(v: string) => update('height', Number(v))} />

            <Select label="Gender"
              value={metrics.gender}
              onChange={(v: string) => update('gender', v as PhysicalMetrics['gender'])}
              options={['male', 'female']} />

          </div>

          <button
            onClick={calculate}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black"
          >
            Calculate Plan
          </button>
        </div>

        {/* RESULTS */}
        {result && (
          <div className="bg-white p-8 rounded-3xl shadow border space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <Box label="BMR" value={result.bmr} />
              <Box label="TDEE" value={result.tdee} />
              <Box label="BMI" value={result.bmi} />
              <Box label="Strictness" value={result.strictness} />
            </div>

            <button
              onClick={save}
              className="w-full bg-black text-white py-4 rounded-2xl font-black"
            >
              Save & Continue →
            </button>

          </div>
        )}
      </div>
    </div>
  );
}

/* UI COMPONENTS */

function Input({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl">
      <p className="text-xs text-slate-400 font-bold">{label}</p>
      <input
        className="w-full bg-transparent font-bold outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl">
      <p className="text-xs text-slate-400 font-bold">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-bold"
      >
        {options.map((o: string) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Box({ label, value }: any) {
  return (
    <div className="bg-slate-50 p-4 rounded-2xl">
      <p className="text-xs text-slate-400 font-bold">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}