'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Flame, Droplets, Scale, History,
  PlusCircle, LogOut, Trophy, TrendingUp, X,
  Utensils, Clock, Zap, Target, CheckCircle2, PieChart as PieChartIcon
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector
} from 'recharts';

// Logic & Data
import { calculateMacros, getStrictnessLevel, StrictnessLevel } from '@/lib/algorithms/nutrition-logic';
import { parseMealAlgorithmic } from '@/lib/food-db';
import { useAuth } from '@/lib/auth-context';
import { getStats, ApiError } from '@/lib/api';

// --- Types ---
interface Meal {
  name: string;
  cal: number;
  prot: number;
  carbs: number;
  fat: number;
  fiber: number;
  time: string;
  emoji: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [targetCals, setTargetCals] = useState(2100);
  const [targetMacros, setTargetMacros] = useState({ protein: 120, carbs: 250, fat: 70 });
  const [strictness, setStrictness] = useState<StrictnessLevel>('MODERATE');

  // Form State
  const [showMealForm, setShowMealForm] = useState(false);
  const [mealName, setMealName] = useState('');
  const [analyzed, setAnalyzed] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load targets from API
    getStats()
      .then((stats) => {
        if (stats.targetCalories) {
          setTargetCals(Math.round(stats.targetCalories));
          const macros = calculateMacros(Math.round(stats.targetCalories), stats.dietaryGoal || 'maintain');
          setTargetMacros(macros);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          // Profile not created yet — redirect to setup
          router.push('/profile-setup');
          return;
        }
        console.error('Failed to load stats:', err);
      })
      .finally(() => {
        // Mock initial meals (will be replaced with meal-log API later)
        setMeals([
          { name: 'Oats with Milk', cal: 450, prot: 20, carbs: 65, fat: 12, fiber: 8, time: '3h ago', emoji: '🥣' },
        ]);
        setLoading(false);
      });
  }, [router, authLoading, isAuthenticated]);

  // ALGORITHM: Calculate current adherence & strictness
  const totalCals = useMemo(() => meals.reduce((s, m) => s + m.cal, 0), [meals]);
  const adherence = targetCals > 0 ? totalCals / targetCals : 0;

  useEffect(() => {
    const history = [adherence, 0.85, 0.75]; // Mock history for demo
    setStrictness(getStrictnessLevel(history));
  }, [adherence]);

  // THEME CALCULATOR: Deterministic mapping of state to UI
  const theme = useMemo(() => {
    if (adherence > 1.25) return {
      primary: 'red', bg: 'bg-red-900', text: 'text-red-800', border: 'border-red-200', label: 'Corrective Mode'
    };
    if (strictness === 'STRICT') return {
      primary: 'emerald', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Strict Focus'
    };
    if (strictness === 'LENIENT') return {
      primary: 'violet', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-100', label: 'Flexible Reward'
    };
    return {
      primary: 'slate', bg: 'bg-slate-900', text: 'text-slate-900', border: 'border-slate-100', label: 'Balanced'
    };
  }, [strictness, adherence]);

  // PIE CHART DATA: Daily Macro Intake
  const macroData = useMemo(() => {
    const p = meals.reduce((s, m) => s + m.prot, 0);
    const c = meals.reduce((s, m) => s + m.carbs, 0);
    const f = meals.reduce((s, m) => s + m.fat, 0);

    if (p === 0 && c === 0 && f === 0) return [];

    return [
      { name: 'Protein', value: p, color: '#10b981' },
      { name: 'Carbs', value: c, color: '#f59e0b' },
      { name: 'Fat', value: f, color: '#6366f1' },
    ];
  }, [meals]);

  const handleAnalyze = async () => {
    if (!mealName.trim()) return;
    setAnalyzing(true);
    setAnalyzed(null);
    await new Promise(r => setTimeout(r, 600));
    const result = parseMealAlgorithmic(mealName);

    if (result.matches.length > 0) {
      setAnalyzed(result);
    } else {
      setAnalyzed({ unrecognized: true, cal: 0, prot: 0, carbs: 0, fat: 0, fiber: 0, matches: [] });
    }
    setAnalyzing(false);
  };

  const handleLog = () => {
    if (!analyzed) return;
    setLogged(true);
    const newMeal: Meal = {
      name: mealName,
      cal: analyzed.cal,
      prot: analyzed.prot,
      carbs: analyzed.carbs,
      fat: analyzed.fat,
      fiber: analyzed.fiber,
      time: 'Just now',
      emoji: analyzed.matches[0] || '🍽️',
    };
    setMeals(prev => [newMeal, ...prev]);
    setTimeout(() => {
      setShowMealForm(false);
      setMealName('');
      setAnalyzed(null);
      setLogged(false);
    }, 1000);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${theme.bg} rounded-xl flex items-center justify-center transition-colors duration-500`}>
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Track <span className={theme.text}>&</span> Treat</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full border ${theme.border} bg-white flex items-center gap-2 shadow-sm`}>
                <div className={`w-2 h-2 rounded-full ${theme.bg} animate-pulse`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>{theme.label}</span>
              </div>
              <button onClick={() => { logout().then(() => router.push('/login')); }} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 cursor-pointer"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div layout className={`relative ${theme.bg} rounded-[2.5rem] p-8 mb-8 overflow-hidden shadow-2xl transition-colors duration-500 text-white`}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-lg leading-none">
              {adherence > 1.25 ? '⚠️' : strictness === 'STRICT' ? '🔒' : strictness === 'LENIENT' ? '🔓' : '⚖️'}
            </div>
            <div>
              <h2 className="text-3xl font-black mb-1">
                {adherence > 1.25 ? 'Corrective Discipline' : strictness === 'STRICT' ? 'Discipline is Key!' : strictness === 'LENIENT' ? 'Flexibility Earned!' : 'Balanced Living'}
              </h2>
              <p className="opacity-70 font-medium max-w-lg">
                {adherence > 1.25 ? 'Significant overeating detected. Switching to Corrective Mode to recalibrate.' :
                  `Your algorithm is in ${theme.label} mode based on recent analysis.`}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Flame className="text-orange-600" />, bg: 'bg-orange-50', label: 'Calories', val: `${totalCals}`, target: `${targetCals}`, pct: Math.min(100, (totalCals / targetCals) * 100), color: 'bg-orange-500' },
                { icon: <Droplets className="text-sky-600" />, bg: 'bg-sky-50', label: 'Water', val: '1.2L', target: '2.5L', pct: 45, color: 'bg-sky-500' },
                { icon: <History className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Score', val: `${Math.round(adherence * 100)}%`, target: 'Adherence', pct: adherence * 100, color: 'bg-emerald-500' },
              ].map((c, i) => (
                <div key={i} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 ${c.bg} rounded-2xl flex items-center justify-center`}>{c.icon}</div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.target}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 mb-1">{c.val}</p>
                  <p className="text-slate-500 font-bold text-xs mb-4 uppercase tracking-wide">{c.label}</p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} className={`h-full ${c.color} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>

            <div>
              {/* Macro Pie Chart */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-emerald-600" /> Intake Overview</h3>
                <div className="h-[240px]">
                  {macroData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                      <Scale className="w-10 h-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No data to display</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {!showMealForm ? (
                  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => setShowMealForm(true)} className="w-full p-6 border-2 border-dashed border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/10 rounded-[2rem] transition-all group flex items-center justify-center gap-4 text-slate-500 hover:text-emerald-700 font-black cursor-pointer">
                    <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-all duration-300" /> Record Daily Intake
                  </motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden p-8 space-y-6">
                    <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><div className={`w-8 h-8 ${theme.bg} rounded-lg flex items-center justify-center`}><Utensils className="w-4 h-4 text-white" /></div>Algorithmic Entry</h3><button onClick={() => { setShowMealForm(false); setAnalyzed(null); }} className="text-slate-400 hover:text-slate-900 cursor-pointer"><X /></button></div>
                    <div className="space-y-4"><input value={mealName} onChange={(e) => { setMealName(e.target.value); setAnalyzed(null); }} placeholder="e.g. 200g chicken and 100g rice..." className="w-full px-7 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900" /><button onClick={handleAnalyze} disabled={!mealName.trim() || analyzing} className={`w-full py-5 ${theme.bg} text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50`}>{analyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}{analyzing ? 'Calculating...' : 'Algorithmic Analysis'}</button></div>
                    {analyzed && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                        {analyzed.unrecognized ? (
                          <div className="text-center py-4">
                            <p className="text-slate-500 font-bold mb-2">Algorithm could not identify any food items.</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tip: Try using base words like 'chicken', 'rice', 'cake'</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                              {[{ l: 'Calories', v: analyzed.cal, u: 'kcal', c: 'text-orange-600' }, { l: 'Protein', v: analyzed.prot, u: 'g', c: 'text-emerald-600' }, { l: 'Carbs', v: analyzed.carbs, u: 'g', c: 'text-amber-600' }, { l: 'Fat', v: analyzed.fat, u: 'g', c: 'text-slate-600' }].map((item, id) => (
                                <div key={id} className="text-center"><p className={`text-2xl font-black ${item.c}`}>{item.v}<span className="text-[10px] ml-1">{item.u}</span></p><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.l}</p></div>
                              ))}
                            </div>
                            <button onClick={handleLog} className={`w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all cursor-pointer ${logged ? 'bg-emerald-500' : ''}`}>{logged ? <CheckCircle2 /> : <PlusCircle className="w-5 h-5" />}{logged ? 'Successfully Recorded!' : 'Confirm and Log Meal'}</button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3"><History className="w-6 h-6 text-emerald-600" />Meal History</h3>
                {meals.length === 0 ? (<p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest italic">No records found</p>) : meals.map((m, i) => (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex items-center justify-between p-6 bg-slate-50 border border-transparent hover:border-slate-200 rounded-[1.5rem] group transition-all">
                    <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-all">{m.emoji}</div><div><p className="font-black text-slate-900">{m.name}</p><div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.time}</span><span>• {m.prot}g Protein</span></div></div></div>
                    <div className="text-right"><p className="text-lg font-black text-slate-900">{m.cal} <span className="text-[10px]">kcal</span></p></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group transition-all duration-500 ${theme.bg}`}>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
              <h3 className="text-lg font-black mb-6 relative z-10 flex items-center gap-2"><Target className="w-5 h-5" />Adaptive Goals</h3>
              <div className="space-y-4 relative z-10">
                {[
                  { l: 'Protein', v: `${targetMacros.protein}g`, c: 'text-emerald-400' },
                  { l: 'Carbs', v: `${targetMacros.carbs}g`, c: 'text-amber-400' },
                  { l: 'Fats', v: `${targetMacros.fat}g`, c: 'text-orange-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-white/50">{s.l}</p><p className="text-xl font-black">{s.v}</p></div>
                    <div className={`w-2 h-2 rounded-full ${s.c} bg-current opacity-80`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">System Insights</h3>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl"><TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" /><div><p className="text-xs font-black text-slate-900 mb-1">State Machine Active</p><p className="text-[10px] font-medium text-slate-500">Currently in {theme.label} mode.</p></div></div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">Status: <span className="text-emerald-500 px-2 bg-emerald-50 rounded-md">Optimal</span></p>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}