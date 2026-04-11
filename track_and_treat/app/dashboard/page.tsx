'use client';

import React, { useState, useMemo } from 'react';
import {
  PlusCircle, Utensils, Zap, Target, PieChart as PieChartIcon,
  ShieldAlert, Activity
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

// Logic & Data
import { useAppContext } from '@/lib/context/AppContext';
import { parseMealAlgorithmic } from '@/lib/food-db';

export default function Dashboard() {
  const { 
    meals, 
    addMeal, 
    dailyCals, 
    targetMacros, 
    plannedMeals,
    validateMeal,
    skipMeal
  } = useAppContext();

  // DASHBOARD UI STATE
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealInput, setMealInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // ALGORITHM: Calculate current adherence
  const totalCals = useMemo(() => meals.reduce((s, m) => s + m.cal, 0), [meals]);
  const adherence = dailyCals > 0 ? totalCals / dailyCals : 0;

  // CURRENT TOTALS for Summary
  const totals = useMemo(() => ({
    p: meals.reduce((s, m) => s + m.prot, 0),
    c: meals.reduce((s, m) => s + m.carbs, 0),
    f: meals.reduce((s, m) => s + m.fat, 0),
  }), [meals]);

  // COMPLIANCE LOGIC
  const compliance = useMemo(() => {
    if (totalCals === 0) return { label: 'Awaiting Logs', status: 'pending' };
    if (adherence >= 0.85 && adherence <= 1.10) return { label: 'On Track', status: 'on-track' };
    if (adherence < 0.85) return { label: 'Under Target', status: 'under' };
    return { label: 'Over Target', status: 'over' };
  }, [adherence, totalCals]);

  // PIE CHART DATA (Refined with names)
  const macroData = useMemo(() => {
    if (totals.p === 0 && totals.c === 0 && totals.f === 0) return [];
    return [
      { name: 'Protein', value: totals.p, color: '#10b981' },
      { name: 'Carbs', value: totals.c, color: '#f59e0b' },
      { name: 'Fat', value: totals.f, color: '#6366f1' },
    ];
  }, [totals]);

  const handleLogFood = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mealInput.trim()) return;

    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate analysis
    
    const result = parseMealAlgorithmic(mealInput);
    
    const newMeal = {
      name: mealInput,
      cal: result.cal,
      prot: result.prot,
      carbs: result.carbs,
      fat: result.fat,
      fiber: result.fiber,
      time: 'Just now',
      emoji: result.matches[0] || '🍱',
    };

    addMeal(newMeal);
    setMealInput('');
    setAnalyzing(false);
    setShowMealForm(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full min-h-screen bg-slate-50 font-sans pb-20">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>
      
      <main className="w-full px-4 sm:px-8 lg:px-12 py-8">
        {/* COMPLIANCE HERO */}
        <motion.div layout className="relative bg-emerald-600 rounded-[2.5rem] p-10 mb-8 overflow-hidden shadow-2xl text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-4xl shadow-xl">
                {compliance.status === 'on-track' ? '🥗' : '📉'}
              </div>
              <div>
                <h2 className="text-4xl font-black mb-2">{compliance.label}</h2>
                <p className="opacity-80 font-medium max-w-sm text-lg leading-relaxed">
                  Your metabolic efficiency is at <span className="underline decoration-2 underline-offset-4">{Math.round(adherence * 100)}%</span> for today.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/20 text-center min-w-[120px]">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Daily Target</p>
                <p className="text-2xl font-black">{dailyCals} kcal</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/20 text-center min-w-[120px]">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Current</p>
                <p className="text-2xl font-black">{totalCals} kcal</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* TOP SECTION: PLAN & REALITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">
          
          {/* COLUMN 1: THE PLAN (STEP 1) */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-emerald-950 flex items-center gap-3">
                <Target className="w-7 h-7 text-emerald-600" />
                Step 1: The Plan
              </h3>
            </div>
            
            <div className="space-y-4">
              {plannedMeals.map((meal) => (
                <div key={meal.id} className={`group flex items-center justify-between p-6 rounded-3xl border-2 transition-all ${meal.skipped ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-slate-100 hover:border-emerald-600/50'}`}>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {meal.icon}
                    </div>
                    <div>
                      <p className="font-black text-emerald-950 text-lg">{meal.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{meal.time} • {meal.cal} kcal</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => skipMeal(meal.id)} className={`p-3 rounded-2xl transition-all cursor-pointer ${meal.skipped ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}>
                      <ShieldAlert className="w-5 h-5" />
                    </button>
                    <button disabled={meal.completed || meal.skipped} onClick={() => validateMeal(meal.id)} className={`px-5 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer ${meal.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10'}`}>
                      {meal.completed ? 'Validated' : 'Validate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: REALITY LOGS (STEP 2) */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-emerald-950 flex items-center gap-3">
                <Utensils className="w-7 h-7 text-emerald-600" />
                Step 2: Reality
              </h3>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-8 pr-2">
              {meals.length === 0 ? (
                <div className="h-40 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-slate-400 font-medium italic">No logs recorded...</div>
              ) : (
                meals.map((m, i) => (
                  <div key={i} className="flex flex-col p-5 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">{m.emoji}</div>
                        <div>
                          <p className="font-black text-emerald-950">{m.name}</p>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{m.cal} kcal</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.time}</span>
                    </div>
                    <div className="flex gap-3 border-t border-emerald-100/50 pt-3">
                      <span className="text-[9px] font-black text-emerald-700 bg-white px-2 py-1 rounded-md shadow-sm">P: {m.prot}g</span>
                      <span className="text-[9px] font-black text-amber-600 bg-white px-2 py-1 rounded-md shadow-sm">C: {m.carbs}g</span>
                      <span className="text-[9px] font-black text-indigo-600 bg-white px-2 py-1 rounded-md shadow-sm">F: {m.fat}g</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <AnimatePresence mode="wait">
              {!showMealForm ? (
                <motion.button onClick={() => setShowMealForm(true)} className="w-full p-6 bg-emerald-900 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98]">
                  <PlusCircle className="w-6 h-6" /> Record Intake
                </motion.button>
              ) : (
                <motion.form onSubmit={handleLogFood} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="relative">
                    <input type="text" placeholder="Ex: 200g Daal Bhat..." value={mealInput} onChange={(e) => setMealInput(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 focus:border-emerald-600 rounded-3xl outline-none font-bold text-lg pr-20 shadow-inner" />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2"><Zap className={`w-6 h-6 ${mealInput ? "text-emerald-600 animate-pulse" : "text-slate-200"}`} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => { setShowMealForm(false); setMealInput(''); }} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black">Cancel</button>
                    <button type="submit" disabled={analyzing} className="py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-900/10">{analyzing ? '...' : 'Save Log'}</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* BOTTOM SECTION: FULL WIDTH METABOLIC SUMMARY (HALF & HALF) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 overflow-hidden flex flex-col min-h-[500px] w-full">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl font-black text-emerald-950 flex items-center gap-3">
              <Activity className="w-8 h-8 text-emerald-600" />
              Metabolic Summary
            </h3>
            <span className="px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100">Descriptive Analytics</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-20 items-center flex-1">
            {/* LEFT HALF: THE GRAPH */}
            <div className="flex flex-col items-center justify-center relative bg-slate-50/30 rounded-[3rem] p-10 border border-slate-100">
              <div className="h-80 w-80 relative shrink-0">
                {macroData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={90} outerRadius={125} paddingAngle={8} dataKey="value" stroke="none">
                        {macroData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 border-4 border-dashed border-slate-100 rounded-full"><PieChartIcon className="w-16 h-16 opacity-10" /></div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-5xl font-black text-emerald-950 leading-none">{Math.round(adherence * 100)}%</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Efficiency</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-8 mt-10">
                {macroData.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT HALF: DETAILED PROGRESS */}
            <div className="space-y-12 py-4">
              {[
                { label: 'Protein Target', current: totals.p, target: targetMacros.protein, color: 'bg-emerald-500', icon: '🥩' },
                { label: 'Carbohydrates', current: totals.c, target: targetMacros.carbs, color: 'bg-amber-500', icon: '🍞' },
                { label: 'Dietary Fat', current: totals.f, target: targetMacros.fat, color: 'bg-indigo-500', icon: '🥑' },
              ].map((item, idx) => {
                const prcnt = Math.min(100, Math.round((item.current / (item.target || 1)) * 100));
                return (
                  <div key={idx} className="space-y-5">
                    <div className="flex justify-between items-end px-2">
                      <div className="flex items-center gap-5">
                        <span className="text-3xl bg-white shadow-sm w-14 h-14 rounded-2xl flex items-center justify-center border border-slate-50">{item.icon}</span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 leading-none mb-2">{item.label}</p>
                          <p className="text-2xl font-black text-emerald-950">{item.current}g <span className="text-slate-300 font-bold">/ {item.target}g</span></p>
                        </div>
                      </div>
                      <span className="text-xl font-black text-emerald-600">{prcnt}%</span>
                    </div>
                    <div className="h-5 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1.5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${prcnt}%` }} transition={{ duration: 1.2, delay: idx * 0.2 }} className={`h-full ${item.color} rounded-full shadow-lg`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}