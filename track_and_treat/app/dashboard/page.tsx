'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Flame, Droplets, Scale, History,
  PlusCircle, LogOut, TrendingUp, X, Trash2, Search, Minus, Plus,
  Utensils, Clock, Zap, Target, CheckCircle2, PieChart as PieChartIcon
} from "lucide-react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
} from 'recharts';

import { calculateMacros, getStrictnessLevel, StrictnessLevel } from '@/lib/algorithms/nutrition-logic';
import { useAuth } from '@/lib/auth-context';
import { AppNav } from '@/components/app-nav';
import {
  getStats, getDailyProgress, parseText, deleteMealLog,
  searchFood, createMealLog,
  createWaterLog, getWaterSummary, deleteWaterLog,
  ApiError,
  type MealLog, type MealType, type DailyProgress, type FoodItem, type WaterSummary,
} from '@/lib/api';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const MEAL_TYPE_EMOJI: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿',
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [targetCals, setTargetCals] = useState(2100);
  const [targetMacros, setTargetMacros] = useState({ protein: 120, carbs: 250, fat: 70 });
  const [strictness, setStrictness] = useState<StrictnessLevel>('MODERATE');

  // Meal data from API
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null);
  const [allMealLogs, setAllMealLogs] = useState<MealLog[]>([]);
  const [water, setWater] = useState<WaterSummary | null>(null);
  const [customWaterAmt, setCustomWaterAmt] = useState(250);
  const [showWaterStepper, setShowWaterStepper] = useState(false);

  // Form State
  const [showMealForm, setShowMealForm] = useState(false);
  const [entryMode, setEntryMode] = useState<'text' | 'search'>('text');
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [parseResult, setParseResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [logged, setLogged] = useState(false);
  const [formError, setFormError] = useState('');

  // Search mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [manualLogging, setManualLogging] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [stats, progress, waterData] = await Promise.all([
        getStats(),
        getDailyProgress(todayStr()),
        getWaterSummary(todayStr()).catch(() => null),
      ]);

      setWater(waterData);

      if (stats.targetCalories) {
        setTargetCals(Math.round(stats.targetCalories));
        setTargetMacros(calculateMacros(Math.round(stats.targetCalories), stats.dietaryGoal || 'maintain'));
      }

      setDailyProgress(progress);

      // Flatten meals from grouped-by-type into a single sorted list
      const logs: MealLog[] = [];
      for (const mealLogs of Object.values(progress.meals)) {
        logs.push(...(mealLogs as MealLog[]));
      }
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllMealLogs(logs);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        router.push('/profile-setup');
        return;
      }
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [router, authLoading, isAuthenticated, loadDashboardData]);

  // Derived stats
  const totalCals = dailyProgress?.consumed ?? 0;
  const adherence = targetCals > 0 ? totalCals / targetCals : 0;

  useEffect(() => {
    const history = [adherence];
    setStrictness(getStrictnessLevel(history));
  }, [adherence]);

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

  const macroData = useMemo(() => {
    if (!dailyProgress) return [];
    const { protein, carbs, fat } = dailyProgress.macros;
    if (protein === 0 && carbs === 0 && fat === 0) return [];
    return [
      { name: 'Protein', value: Math.round(protein), color: '#10b981' },
      { name: 'Carbs', value: Math.round(carbs), color: '#f59e0b' },
      { name: 'Fat', value: Math.round(fat), color: '#6366f1' },
    ];
  }, [dailyProgress]);

  // --- Handlers ---

  const handleParseText = async () => {
    if (!mealText.trim()) return;
    setAnalyzing(true);
    setParseResult(null);
    setFormError('');

    try {
      const result = await parseText({ text: mealText, mealType });
      setParseResult(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Failed to analyze meal. Try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogSuccess = () => {
    setLogged(true);
    setTimeout(() => {
      setShowMealForm(false);
      setMealText('');
      setParseResult(null);
      setLogged(false);
      setFormError('');
      loadDashboardData();
    }, 800);
  };

  const handleDeleteMeal = async (logId: number) => {
    try {
      await deleteMealLog(logId);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to delete meal:', err);
    }
  };

  const handleFoodSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setFormError('');
    try {
      const results = await searchFood(searchQuery);
      setSearchResults(results);
      if (results.length === 0) setFormError('No food items found. Try a different search term.');
    } catch {
      setFormError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleManualLog = async () => {
    if (!selectedFood) return;
    setManualLogging(true);
    setFormError('');
    try {
      await createMealLog({ foodItemId: selectedFood.id, quantity, mealType });
      setLogged(true);
      setTimeout(() => {
        setShowMealForm(false);
        resetFormState();
        loadDashboardData();
      }, 800);
    } catch (err) {
      if (err instanceof ApiError) setFormError(err.message);
      else setFormError('Failed to log meal.');
    } finally {
      setManualLogging(false);
    }
  };

  const resetFormState = () => {
    setMealText('');
    setParseResult(null);
    setLogged(false);
    setFormError('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setQuantity(1);
    setEntryMode('text');
  };

  const handleAddWater = async (ml: number) => {
    try {
      await createWaterLog({ amount: ml });
      const updated = await getWaterSummary(todayStr());
      setWater(updated);
    } catch {}
  };

  const handleDeleteWater = async (id: number) => {
    try {
      await deleteWaterLog(id);
      const updated = await getWaterSummary(todayStr());
      setWater(updated);
    } catch {}
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
              <div className="hidden sm:block ml-4"><AppNav /></div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`hidden sm:flex px-4 py-1.5 rounded-full border ${theme.border} bg-white items-center gap-2 shadow-sm`}>
                <div className={`w-2 h-2 rounded-full ${theme.bg} animate-pulse`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>{theme.label}</span>
              </div>
              <button onClick={() => { logout().then(() => router.push('/login')); }} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 cursor-pointer"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
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
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Flame className="text-orange-600" />, bg: 'bg-orange-50', label: 'Calories', val: `${totalCals}`, target: `${targetCals}`, pct: Math.min(100, (totalCals / targetCals) * 100), color: 'bg-orange-500' },
                { icon: <Droplets className="text-sky-600" />, bg: 'bg-sky-50', label: 'Water', val: `${water ? (water.totalMl / 1000).toFixed(1) : '0'}L`, target: `${water ? (water.target / 1000).toFixed(1) : '2.5'}L`, pct: water?.percentage ?? 0, color: 'bg-sky-500' },
                { icon: <History className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Score', val: `${dailyProgress?.percentage ?? 0}%`, target: 'Adherence', pct: dailyProgress?.percentage ?? 0, color: 'bg-emerald-500' },
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

            {/* Water Intake */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Droplets className="w-4 h-4 text-sky-500" /> Water Intake</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{water ? `${(water.totalMl / 1000).toFixed(1)} / ${(water.target / 1000).toFixed(1)}L` : '0L'}</span>
                  <button onClick={() => setShowWaterStepper(!showWaterStepper)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${showWaterStepper ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
                  >
                    {showWaterStepper ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-sky-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, water?.percentage ?? 0)}%` }} />
              </div>

              {/* Stepper popup — only when toggled */}
              <AnimatePresence>
                {showWaterStepper && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">
                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCustomWaterAmt(Math.max(50, customWaterAmt - 50))} className="w-10 h-10 bg-sky-50 text-sky-700 rounded-xl hover:bg-sky-100 transition-all active:scale-90 cursor-pointer flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-black text-sky-700">{customWaterAmt}</span>
                        <span className="text-xs font-bold text-sky-400 ml-1">ml</span>
                      </div>
                      <button onClick={() => setCustomWaterAmt(Math.min(2000, customWaterAmt + 50))} className="w-10 h-10 bg-sky-50 text-sky-700 rounded-xl hover:bg-sky-100 transition-all active:scale-90 cursor-pointer flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => { handleAddWater(customWaterAmt); setShowWaterStepper(false); }} className="px-5 h-10 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    {/* Quick presets */}
                    <div className="flex gap-2">
                      {[250, 500, 750].map((ml) => (
                        <button key={ml} onClick={() => { handleAddWater(ml); setShowWaterStepper(false); }} className="flex-1 py-2 bg-sky-50 text-sky-600 rounded-lg font-bold text-xs hover:bg-sky-100 transition-all active:scale-95 cursor-pointer">
                          +{ml}ml
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Logged entries */}
              {water && water.logs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {water.logs.map((log) => (
                    <span key={log.id} className="inline-flex items-center gap-1 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold">
                      {Number(log.amount)}ml
                      <button onClick={() => handleDeleteWater(log.id)} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Macro Pie Chart */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-emerald-600" /> Intake Overview</h3>
              <div className="h-[240px]">
                {macroData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                    <Scale className="w-10 h-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No meals logged yet today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Meal Entry + History */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {!showMealForm ? (
                  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={() => setShowMealForm(true)} className="w-full p-6 border-2 border-dashed border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/10 rounded-[2rem] transition-all group flex items-center justify-center gap-4 text-slate-500 hover:text-emerald-700 font-black cursor-pointer">
                    <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-all duration-300" /> Record Daily Intake
                  </motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <div className={`w-8 h-8 ${theme.bg} rounded-lg flex items-center justify-center`}><Utensils className="w-4 h-4 text-white" /></div>
                        Log a Meal
                      </h3>
                      <button onClick={() => { setShowMealForm(false); resetFormState(); }} className="text-slate-400 hover:text-slate-900 cursor-pointer"><X /></button>
                    </div>

                    {/* Meal Type Selector */}
                    <div className="grid grid-cols-4 gap-2">
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mt) => (
                        <button key={mt} type="button" onClick={() => setMealType(mt)}
                          className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer ${mealType === mt ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                        >
                          {MEAL_TYPE_EMOJI[mt]} {MEAL_TYPE_LABELS[mt]}
                        </button>
                      ))}
                    </div>

                    {/* Entry Mode Tabs */}
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      <button onClick={() => setEntryMode('text')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${entryMode === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Zap className="w-4 h-4" /> Describe
                      </button>
                      <button onClick={() => setEntryMode('search')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${entryMode === 'search' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <Search className="w-4 h-4" /> Search Food
                      </button>
                    </div>

                    {formError && (
                      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">{formError}</div>
                    )}

                    {/* ── TEXT MODE ── */}
                    {entryMode === 'text' && (
                      <div className="space-y-4">
                        <input
                          value={mealText}
                          onChange={(e) => { setMealText(e.target.value); setParseResult(null); setFormError(''); }}
                          placeholder="e.g. 200g chicken and 100g rice..."
                          className="w-full px-7 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleParseText(); } }}
                        />
                        <button onClick={handleParseText} disabled={!mealText.trim() || analyzing}
                          className={`w-full py-5 ${theme.bg} text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50`}
                        >
                          {analyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                          {analyzing ? 'Analyzing...' : 'Analyze & Log'}
                        </button>

                        {parseResult && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-5">
                            {parseResult.logged.length > 0 && (
                              <>
                                <div className="space-y-2">
                                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Logged Items</p>
                                  {parseResult.logged.map((log: MealLog) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 bg-white rounded-xl">
                                      <div>
                                        <p className="font-bold text-slate-900 text-sm">{log.foodItem.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{log.quantity}x {log.foodItem.servingSize}{log.foodItem.servingUnit}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-black text-slate-900">{Math.round(Number(log.calories))} <span className="text-[10px]">kcal</span></p>
                                        <p className="text-[10px] text-slate-400">{Math.round(Number(log.protein))}p / {Math.round(Number(log.carbs))}c / {Math.round(Number(log.fat))}f</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button onClick={handleLogSuccess} className={`w-full py-5 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 cursor-pointer ${logged ? 'bg-emerald-500' : ''}`}>
                                  {logged ? <CheckCircle2 /> : <CheckCircle2 className="w-5 h-5" />}
                                  {logged ? 'Saved!' : 'Done'}
                                </button>
                              </>
                            )}
                            {parseResult.unresolved && (
                              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-amber-700 text-sm font-bold mb-1">Could not identify:</p>
                                <p className="text-amber-600 text-xs">{parseResult.unresolved.items.join(', ')}</p>
                              </div>
                            )}
                            {parseResult.logged.length === 0 && parseResult.unresolved && (
                              <p className="text-center py-2 text-slate-500 font-bold text-sm">No food items recognized.</p>
                            )}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* ── SEARCH MODE ── */}
                    {entryMode === 'search' && (
                      <div className="space-y-4">
                        {/* Search bar */}
                        <div className="flex gap-2">
                          <input
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setFormError(''); }}
                            placeholder="Search food database..."
                            className="flex-1 px-6 py-4 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFoodSearch(); } }}
                          />
                          <button onClick={handleFoodSearch} disabled={!searchQuery.trim() || searching}
                            className="px-5 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                          >
                            {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Selected food detail + quantity */}
                        {selectedFood && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-black text-slate-900">{selectedFood.name}</p>
                                <p className="text-xs text-slate-500 font-bold">{selectedFood.servingSize}{selectedFood.servingUnit} per serving &middot; {selectedFood.calories} kcal</p>
                              </div>
                              <button onClick={() => setSelectedFood(null)} className="text-slate-400 hover:text-slate-900 cursor-pointer"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Servings</span>
                              <div className="flex items-center gap-2 bg-white rounded-xl p-1">
                                <button onClick={() => setQuantity(Math.max(0.25, quantity - 0.25))} className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer"><Minus className="w-4 h-4 text-slate-600" /></button>
                                <span className="w-12 text-center font-black text-slate-900">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 0.25)} className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer"><Plus className="w-4 h-4 text-slate-600" /></button>
                              </div>
                              <div className="flex-1 text-right text-sm font-bold text-slate-500">
                                = {Math.round(Number(selectedFood.calories) * quantity)} kcal
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              {[
                                { l: 'Cal', v: Math.round(Number(selectedFood.calories) * quantity), c: 'text-orange-600' },
                                { l: 'Prot', v: Math.round(Number(selectedFood.protein) * quantity), c: 'text-emerald-600' },
                                { l: 'Carbs', v: Math.round(Number(selectedFood.carbs) * quantity), c: 'text-amber-600' },
                                { l: 'Fat', v: Math.round(Number(selectedFood.fat) * quantity), c: 'text-slate-600' },
                              ].map((s, i) => (
                                <div key={i}><p className={`font-black ${s.c}`}>{s.v}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{s.l}</p></div>
                              ))}
                            </div>
                            <button onClick={handleManualLog} disabled={manualLogging}
                              className={`w-full py-4 bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${logged ? 'bg-emerald-500' : ''}`}
                            >
                              {logged ? <CheckCircle2 className="w-5 h-5" /> : manualLogging ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                              {logged ? 'Logged!' : manualLogging ? 'Logging...' : 'Log This Meal'}
                            </button>
                          </motion.div>
                        )}

                        {/* Search results list */}
                        {!selectedFood && searchResults.length > 0 && (
                          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                            {searchResults.map((food) => (
                              <button key={food.id} onClick={() => { setSelectedFood(food); setQuantity(1); }}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all cursor-pointer text-left"
                              >
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">{food.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {food.servingSize}{food.servingUnit} &middot; {food.category || 'Uncategorized'}
                                  </p>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                  <p className="font-black text-slate-900 text-sm">{food.calories} <span className="text-[10px]">kcal</span></p>
                                  <p className="text-[10px] text-slate-400">{food.protein}p / {food.carbs}c / {food.fat}f</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Meal History */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <History className="w-6 h-6 text-emerald-600" />
                  Today&apos;s Meals
                  {allMealLogs.length > 0 && (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{allMealLogs.length} items</span>
                  )}
                </h3>
                {allMealLogs.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest italic">No meals logged today</p>
                ) : allMealLogs.map((log) => (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} key={log.id} className="flex items-center justify-between p-6 bg-slate-50 border border-transparent hover:border-slate-200 rounded-[1.5rem] group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-all">
                        {MEAL_TYPE_EMOJI[log.mealType as MealType] || '🍽️'}
                      </div>
                      <div>
                        <p className="font-black text-slate-900">{log.foodItem?.name || 'Unknown item'}</p>
                        <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(log.createdAt)}</span>
                          <span>{MEAL_TYPE_LABELS[log.mealType as MealType]}</span>
                          <span>{Math.round(Number(log.protein))}g P</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">{Math.round(Number(log.calories))} <span className="text-[10px]">kcal</span></p>
                      </div>
                      <button
                        onClick={() => handleDeleteMeal(log.id)}
                        className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group transition-all duration-500 ${theme.bg}`}>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-all duration-700" />
              <h3 className="text-lg font-black mb-6 relative z-10 flex items-center gap-2"><Target className="w-5 h-5" />Daily Targets</h3>
              <div className="space-y-4 relative z-10">
                {[
                  { l: 'Protein', v: `${targetMacros.protein}`, u: 'g', c: 'text-emerald-400' },
                  { l: 'Carbs', v: `${targetMacros.carbs}`, u: 'g', c: 'text-amber-400' },
                  { l: 'Fats', v: `${targetMacros.fat}`, u: 'g', c: 'text-orange-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/10 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-white/50">{s.l}</p><p className="text-xl font-black">{s.v}<span className="text-sm font-bold opacity-60 ml-1">{s.u}</span></p></div>
                    <div className={`w-2 h-2 rounded-full ${s.c} bg-current opacity-80`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Today&apos;s Progress</h3>
              <div className="space-y-3">
                {[
                  { l: 'Protein', consumed: Math.round(dailyProgress?.macros.protein ?? 0), target: targetMacros.protein, u: 'g' },
                  { l: 'Carbs', consumed: Math.round(dailyProgress?.macros.carbs ?? 0), target: targetMacros.carbs, u: 'g' },
                  { l: 'Fat', consumed: Math.round(dailyProgress?.macros.fat ?? 0), target: targetMacros.fat, u: 'g' },
                ].map((m, i) => {
                  const pct = m.target > 0 ? Math.min(100, (m.consumed / m.target) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-500">{m.l}</span>
                        <span className="text-xs font-bold text-slate-400">{m.consumed} / {m.target}{m.u}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose mt-2">
                Meals logged: <span className="text-emerald-500 px-2 bg-emerald-50 rounded-md">{dailyProgress?.logCount ?? 0}</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="sm:hidden pb-20">
        <AppNav />
      </div>
    </motion.div>
  );
}
