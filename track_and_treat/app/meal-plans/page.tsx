'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CalendarDays, XCircle, Utensils, ChevronLeft, ChevronRight,
  AlertTriangle, Coffee, Sun, Moon, Popcorn, Trash2, Minus, Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppNav } from '@/components/app-nav';
import {
  generateMealPlan, getActiveMealPlan, cancelMealPlan,
  updatePlanItem, deletePlanItem,
  ApiError,
  type MealPlan, type MealPlanItem,
} from '@/lib/api';

const MEAL_ICONS: Record<string, React.ReactNode> = {
  breakfast: <Coffee className="w-4 h-4" />,
  lunch: <Sun className="w-4 h-4" />,
  dinner: <Moon className="w-4 h-4" />,
  snack: <Popcorn className="w-4 h-4" />,
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MealPlansPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }

    getActiveMealPlan()
      .then(setPlan)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setPlan(null);
        } else {
          setError('Failed to load meal plan.');
        }
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const newPlan = await generateMealPlan();
      setPlan(newPlan);
      setSelectedDay(1);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to generate plan. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCancel = async () => {
    if (!plan) return;
    setCancelling(true);
    setError('');
    try {
      await cancelMealPlan(plan.id);
      setPlan(null);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to cancel plan.');
    } finally {
      setCancelling(false);
    }
  };

  const reloadPlan = async () => {
    try {
      const updated = await getActiveMealPlan();
      setPlan(updated);
    } catch {}
  };

  const handleUpdateQuantity = async (itemId: number, delta: number) => {
    if (!plan) return;
    const item = plan.items.find(i => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(0.25, Number(item.quantity) + delta);
    try {
      await updatePlanItem(plan.id, itemId, { quantity: Math.round(newQty * 100) / 100 });
      await reloadPlan();
    } catch {}
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!plan) return;
    try {
      await deletePlanItem(plan.id, itemId);
      await reloadPlan();
    } catch {}
  };

  const dayItems = useMemo(() => {
    if (!plan) return [];
    return plan.items
      .filter((item) => item.day === selectedDay)
      .sort((a, b) => {
        const order = ['breakfast', 'lunch', 'snack', 'dinner'];
        return order.indexOf(a.mealType) - order.indexOf(b.mealType);
      });
  }, [plan, selectedDay]);

  const dayTotals = useMemo(() => {
    return dayItems.reduce(
      (acc, item) => ({
        calories: acc.calories + Number(item.calories),
        protein: acc.protein + Number(item.protein),
        carbs: acc.carbs + Number(item.carbs),
        fat: acc.fat + Number(item.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [dayItems]);

  if (loading || authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Meal Plans</h1>
              <p className="text-slate-500 font-medium text-sm">AI-generated 7-day meal plans</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        {/* No active plan */}
        {!plan && !generating && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">No Active Meal Plan</h2>
              <p className="text-slate-500 font-medium max-w-md mx-auto">
                Generate a personalized 7-day meal plan based on your profile, goals, and dietary preferences.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer shadow-xl shadow-emerald-900/10"
            >
              Generate My Plan
            </button>
          </motion.div>
        )}

        {/* Generating overlay */}
        {generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-[2rem] animate-spin" />
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Generating Your Plan...</h2>
              <p className="text-slate-500 font-medium">Our AI is crafting a personalized 7-day meal plan for you. This may take a moment.</p>
            </div>
          </motion.div>
        )}

        {/* Active plan */}
        {plan && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Plan info bar */}
            <div className="bg-emerald-600 rounded-[2rem] p-6 text-white flex items-center justify-between shadow-xl shadow-emerald-900/10">
              <div className="flex items-center gap-4">
                <CalendarDays className="w-6 h-6" />
                <div>
                  <p className="font-black text-lg">Active Plan</p>
                  <p className="text-emerald-100 text-sm font-medium">{plan.startDate} to {plan.endDate}</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-5 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {cancelling ? 'Cancelling...' : 'Cancel Plan'}
              </button>
            </div>

            {/* Day selector */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4">
              <div className="grid grid-cols-7 gap-2">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i + 1)}
                    className={`py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                      selectedDay === i + 1
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="hidden sm:inline">{name}</span>
                    <span className="sm:hidden">{name.slice(0, 3)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day totals */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Calories', val: Math.round(dayTotals.calories), unit: 'kcal', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Protein', val: Math.round(dayTotals.protein), unit: 'g', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Carbs', val: Math.round(dayTotals.carbs), unit: 'g', color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Fat', val: Math.round(dayTotals.fat), unit: 'g', color: 'text-slate-600', bg: 'bg-slate-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-4 text-center`}>
                  <p className={`text-2xl font-black ${s.color}`}>{s.val}<span className="text-xs ml-1">{s.unit}</span></p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Meals for selected day */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                {DAY_NAMES[selectedDay - 1]}&apos;s Meals
              </h3>

              {dayItems.length === 0 ? (
                <p className="text-center py-8 text-slate-400 font-bold italic">No meals planned for this day</p>
              ) : (
                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <div key={item.id} className="p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                            {MEAL_ICONS[item.mealType] || <Utensils className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{item.foodItem?.name || 'Unknown'}</p>
                            <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>{item.mealType}</span>
                              <span>{Math.round(Number(item.quantity) * (parseFloat(item.foodItem?.servingSize) || 100))}{item.foodItem?.servingUnit || 'g'}</span>
                              {item.notes && <span className="text-emerald-500">{item.notes}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900">{Math.round(Number(item.calories))} <span className="text-[10px]">kcal</span></p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {Math.round(Number(item.protein))}p / {Math.round(Number(item.carbs))}c / {Math.round(Number(item.fat))}f
                          </p>
                        </div>
                      </div>
                      {/* Edit controls */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/50">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateQuantity(item.id, -0.25)}
                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer active:scale-90 transition-all">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-black text-slate-700 min-w-[4rem] text-center">{Math.round(Number(item.quantity) * (parseFloat(item.foodItem?.servingSize) || 100))}{item.foodItem?.servingUnit || 'g'}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, 0.25)}
                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer active:scale-90 transition-all">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      <div className="sm:hidden pb-20">
        <AppNav />
      </div>
    </div>
  );
}
