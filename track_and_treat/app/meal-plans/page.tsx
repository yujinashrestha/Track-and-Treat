'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CalendarDays, XCircle, Utensils, ChevronLeft, ChevronRight, ChevronDown,
  AlertTriangle, Coffee, Sun, Moon, Popcorn, Trash2, Minus, Plus, CookingPot,
  Search, ArrowLeftRight, X, PlusCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppNav } from '@/components/app-nav';
import {
  generateMealPlan, getActiveMealPlan, cancelMealPlan,
  updatePlanItem, deletePlanItem, addPlanItem, searchFood,
  ApiError,
  type MealPlan, type MealPlanItem, type FoodItem,
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
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  // Editing state
  const [swappingItemId, setSwappingItemId] = useState<number | null>(null);
  const [addingToRecipe, setAddingToRecipe] = useState<{ day: number; mealType: string; recipeName: string } | null>(null);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<FoodItem[]>([]);
  const [editSearching, setEditSearching] = useState(false);

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

  const handleEditSearch = async () => {
    if (!editSearchQuery.trim()) return;
    setEditSearching(true);
    try {
      const results = await searchFood(editSearchQuery, 10);
      setEditSearchResults(results);
    } catch {}
    finally { setEditSearching(false); }
  };

  const handleSwapFood = async (food: FoodItem) => {
    if (!plan || !swappingItemId) return;
    try {
      await updatePlanItem(plan.id, swappingItemId, { foodItemId: food.id });
      await reloadPlan();
    } catch {}
    finally { resetEditState(); }
  };

  const handleAddIngredient = async (food: FoodItem) => {
    if (!plan || !addingToRecipe) return;
    try {
      await addPlanItem(plan.id, {
        day: addingToRecipe.day,
        mealType: addingToRecipe.mealType,
        foodItemId: food.id,
        quantity: 1,
        notes: null,
      });
      await reloadPlan();
    } catch {}
    finally { resetEditState(); }
  };

  const resetEditState = () => {
    setSwappingItemId(null);
    setAddingToRecipe(null);
    setEditSearchQuery('');
    setEditSearchResults([]);
  };

  // Group items into recipes
  interface Recipe {
    recipeName: string;
    mealType: string;
    prepNotes: string | null;
    items: MealPlanItem[];
    totals: { calories: number; protein: number; carbs: number; fat: number };
  }

  const dayRecipes = useMemo(() => {
    if (!plan) return [];
    const filtered = plan.items
      .filter((item) => item.day === selectedDay)
      .sort((a, b) => {
        const order = ['breakfast', 'lunch', 'snack', 'dinner'];
        return order.indexOf(a.mealType) - order.indexOf(b.mealType);
      });

    const recipeMap = new Map<string, Recipe>();
    for (const item of filtered) {
      const key = `${item.mealType}::${item.recipeName || item.foodItem?.name || item.id}`;
      if (!recipeMap.has(key)) {
        recipeMap.set(key, {
          recipeName: item.recipeName || item.foodItem?.name || 'Unnamed',
          mealType: item.mealType,
          prepNotes: item.prepNotes,
          items: [],
          totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        });
      }
      const recipe = recipeMap.get(key)!;
      recipe.items.push(item);
      recipe.totals.calories += Number(item.calories);
      recipe.totals.protein += Number(item.protein);
      recipe.totals.carbs += Number(item.carbs);
      recipe.totals.fat += Number(item.fat);
    }

    return Array.from(recipeMap.values());
  }, [plan, selectedDay]);

  const dayTotals = useMemo(() => {
    return dayRecipes.reduce(
      (acc, r) => ({
        calories: acc.calories + r.totals.calories,
        protein: acc.protein + r.totals.protein,
        carbs: acc.carbs + r.totals.carbs,
        fat: acc.fat + r.totals.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [dayRecipes]);

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
              <p className="text-slate-500 font-medium text-sm">7-day meal plan</p>
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
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayDate = new Date(plan.startDate + 'T00:00:00');
                  dayDate.setDate(dayDate.getDate() + i);
                  const weekdayLong = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
                  const weekdayShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateLabel = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(i + 1)}
                      className={`py-3 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                        selectedDay === i + 1
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span className="hidden sm:inline">{weekdayLong}</span>
                      <span className="sm:hidden">{weekdayShort}</span>
                      <span className="block text-[10px] font-bold opacity-70 mt-0.5">{dateLabel}</span>
                    </button>
                  );
                })}
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

            {/* Recipes for selected day */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CookingPot className="w-5 h-5 text-emerald-600" />
                {(() => {
                  const d = new Date(plan.startDate + 'T00:00:00');
                  d.setDate(d.getDate() + selectedDay - 1);
                  return `${d.toLocaleDateString('en-US', { weekday: 'long' })}'s Recipes`;
                })()}
              </h3>

              {dayRecipes.length === 0 ? (
                <p className="text-center py-8 text-slate-400 font-bold italic">No recipes planned for this day</p>
              ) : (
                <div className="space-y-4">
                  {dayRecipes.map((recipe, ri) => {
                    const key = `${recipe.mealType}::${recipe.recipeName}`;
                    const isExpanded = expandedRecipe === key;
                    return (
                      <div key={ri} className="bg-slate-50 rounded-2xl overflow-hidden">
                        {/* Recipe header — click to expand */}
                        <button
                          onClick={() => setExpandedRecipe(isExpanded ? null : key)}
                          className="w-full p-5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-600">
                              {MEAL_ICONS[recipe.mealType] || <Utensils className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{recipe.recipeName}</p>
                              <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>{recipe.mealType}</span>
                                <span>{recipe.items.length} ingredients</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-black text-slate-900">{Math.round(recipe.totals.calories)} <span className="text-[10px]">kcal</span></p>
                              <p className="text-[10px] text-slate-400 font-bold">
                                {Math.round(recipe.totals.protein)}p / {Math.round(recipe.totals.carbs)}c / {Math.round(recipe.totals.fat)}f
                              </p>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </button>

                        {/* Expanded: prep notes + ingredients */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-5 pb-5 space-y-3">
                                {/* Prep notes */}
                                {recipe.prepNotes && (
                                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <p className="text-xs font-bold text-emerald-700">{recipe.prepNotes}</p>
                                  </div>
                                )}

                                {/* Ingredients */}
                                <div className="space-y-2">
                                  {recipe.items.map((item) => (
                                    <div key={item.id} className="p-3 bg-white rounded-xl group">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-bold text-slate-800 text-sm">{item.foodItem?.name || 'Unknown'}</p>
                                          <p className="text-[10px] text-slate-400 font-bold">
                                            {item.grams != null
                                              ? Math.round(Number(item.grams))
                                              : Math.round(Number(item.quantity) * (parseFloat(item.foodItem?.servingSize) || 100))}{item.foodItem?.servingUnit || 'g'}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="text-right">
                                            <p className="text-sm font-bold text-slate-700">{Math.round(Number(item.calories))} kcal</p>
                                            <p className="text-[10px] text-slate-400">{Math.round(Number(item.protein))}p / {Math.round(Number(item.carbs))}c / {Math.round(Number(item.fat))}f</p>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleUpdateQuantity(item.id, -0.25)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200 cursor-pointer" title="Less"><Minus className="w-3 h-3" /></button>
                                            <button onClick={() => handleUpdateQuantity(item.id, 0.25)} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200 cursor-pointer" title="More"><Plus className="w-3 h-3" /></button>
                                            <button onClick={() => { setSwappingItemId(item.id); setAddingToRecipe(null); setEditSearchQuery(''); setEditSearchResults([]); }} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center hover:bg-amber-200 text-slate-400 hover:text-amber-600 cursor-pointer" title="Swap"><ArrowLeftRight className="w-3 h-3" /></button>
                                            <button onClick={() => handleDeleteItem(item.id)} className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-red-500 cursor-pointer" title="Remove"><Trash2 className="w-3 h-3" /></button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Inline swap search for this item */}
                                      {swappingItemId === item.id && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                          <div className="flex gap-2">
                                            <input value={editSearchQuery} onChange={e => setEditSearchQuery(e.target.value)}
                                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEditSearch(); } }}
                                              placeholder="Search replacement..."
                                              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-emerald-500"
                                            />
                                            <button onClick={handleEditSearch} disabled={editSearching} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50">
                                              {editSearching ? '...' : <Search className="w-4 h-4" />}
                                            </button>
                                            <button onClick={resetEditState} className="px-2 py-2 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                                          </div>
                                          {editSearchResults.length > 0 && (
                                            <div className="max-h-[150px] overflow-y-auto space-y-1">
                                              {editSearchResults.map(food => (
                                                <button key={food.id} onClick={() => handleSwapFood(food)}
                                                  className="w-full flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-emerald-50 cursor-pointer text-left text-sm"
                                                >
                                                  <span className="font-bold text-slate-800">{food.name}</span>
                                                  <span className="text-xs text-slate-400">{food.calories} kcal/{food.servingSize}{food.servingUnit}</span>
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </motion.div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Add ingredient to this recipe */}
                                {addingToRecipe?.recipeName === recipe.recipeName && addingToRecipe?.day === selectedDay && addingToRecipe?.mealType === recipe.mealType ? (
                                  <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-2">
                                    <div className="flex gap-2">
                                      <input value={editSearchQuery} onChange={e => setEditSearchQuery(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEditSearch(); } }}
                                        placeholder="Search ingredient to add..."
                                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-emerald-500"
                                      />
                                      <button onClick={handleEditSearch} disabled={editSearching} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50">
                                        {editSearching ? '...' : <Search className="w-4 h-4" />}
                                      </button>
                                      <button onClick={resetEditState} className="px-2 py-2 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
                                    </div>
                                    {editSearchResults.length > 0 && (
                                      <div className="max-h-[150px] overflow-y-auto space-y-1">
                                        {editSearchResults.map(food => (
                                          <button key={food.id} onClick={() => handleAddIngredient(food)}
                                            className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-emerald-50 cursor-pointer text-left text-sm"
                                          >
                                            <span className="font-bold text-slate-800">{food.name}</span>
                                            <span className="text-xs text-slate-400">{food.calories} kcal/{food.servingSize}{food.servingUnit}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => { setAddingToRecipe({ day: selectedDay, mealType: recipe.mealType, recipeName: recipe.recipeName }); setSwappingItemId(null); setEditSearchQuery(''); setEditSearchResults([]); }}
                                    className="mt-3 w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:border-emerald-300 hover:text-emerald-600 transition-all cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <PlusCircle className="w-3.5 h-3.5" /> Add Ingredient
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
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
