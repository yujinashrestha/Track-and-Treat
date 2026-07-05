'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, X, Search, CheckCircle2, Carrot, Utensils, PlusSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppNav } from '@/components/app-nav';
import {
  searchFood, createFood, createRecipe, ApiError,
  type FoodItem,
} from '@/lib/api';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'grains', label: 'Grains' },
  { id: 'legumes', label: 'Legumes' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'fish', label: 'Fish' },
  { id: 'red_meat', label: 'Red meat' },
  { id: 'dairy_eggs', label: 'Dairy & eggs' },
  { id: 'nuts_seeds', label: 'Nuts & seeds' },
  { id: 'fats_oils', label: 'Fats & oils' },
  { id: 'other', label: 'Other' },
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function CreatePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'ingredient' | 'recipe'>('ingredient');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  // ── Ingredient form ──
  const [ing, setIng] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', category: 'other' });
  const [ingSaving, setIngSaving] = useState(false);
  const [ingMsg, setIngMsg] = useState('');
  const [ingErr, setIngErr] = useState('');

  const saveIngredient = async () => {
    setIngErr(''); setIngMsg('');
    if (!ing.name.trim() || ing.calories === '') { setIngErr('Name and calories are required.'); return; }
    setIngSaving(true);
    try {
      const created = await createFood({
        name: ing.name.trim(), servingSize: '100', servingUnit: 'g',
        calories: Number(ing.calories), protein: Number(ing.protein || 0),
        carbs: Number(ing.carbs || 0), fat: Number(ing.fat || 0), fiber: Number(ing.fiber || 0),
        category: ing.category,
      });
      setIngMsg(`Saved "${created.name}". You can now use it in a recipe or when building a meal.`);
      setIng({ name: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', category: 'other' });
    } catch (e) {
      setIngErr(e instanceof ApiError ? e.message : 'Failed to save ingredient.');
    } finally { setIngSaving(false); }
  };

  // ── Recipe builder ──
  const [rName, setRName] = useState('');
  const [rMealTypes, setRMealTypes] = useState<string[]>(['lunch']);
  const [rComplexity, setRComplexity] = useState(3);
  const [rPrep, setRPrep] = useState(20);
  const [rQuery, setRQuery] = useState('');
  const [rResults, setRResults] = useState<FoodItem[]>([]);
  const [rSearching, setRSearching] = useState(false);
  const [rComposition, setRComposition] = useState<{ food: FoodItem; grams: number }[]>([]);
  const [rSaving, setRSaving] = useState(false);
  const [rMsg, setRMsg] = useState('');
  const [rErr, setRErr] = useState('');

  const toggleMealType = (mt: string) =>
    setRMealTypes((cur) => (cur.includes(mt) ? cur.filter((x) => x !== mt) : [...cur, mt]));
  const searchIngredients = async () => {
    if (!rQuery.trim()) return;
    setRSearching(true);
    try { setRResults(await searchFood(rQuery)); } catch { /* ignore */ } finally { setRSearching(false); }
  };
  const addComp = (food: FoodItem) =>
    setRComposition((c) => (c.some((x) => x.food.id === food.id) ? c : [...c, { food, grams: 100 }]));
  const setGrams = (id: number, g: number) =>
    setRComposition((c) => c.map((x) => (x.food.id === id ? { ...x, grams: Math.max(1, Math.round(g)) } : x)));
  const removeComp = (id: number) => setRComposition((c) => c.filter((x) => x.food.id !== id));

  const saveRecipe = async () => {
    setRErr(''); setRMsg('');
    if (!rName.trim()) { setRErr('Give the recipe a name.'); return; }
    if (rMealTypes.length === 0) { setRErr('Pick at least one meal type.'); return; }
    if (rComposition.length === 0) { setRErr('Add at least one ingredient.'); return; }
    setRSaving(true);
    try {
      const created = await createRecipe({
        name: rName.trim(), mealTypes: rMealTypes, complexity: rComplexity, prepMinutes: rPrep,
        composition: rComposition.map((x) => ({ foodItemId: x.food.id, grams: x.grams })),
      });
      setRMsg(`Saved "${created.name}" (~${Math.round(Number(created.calories))} kcal). Find it in the Recipes tab to log it.`);
      setRName(''); setRMealTypes(['lunch']); setRComplexity(3); setRPrep(20);
      setRComposition([]); setRQuery(''); setRResults([]);
    } catch (e) {
      setRErr(e instanceof ApiError ? e.message : 'Failed to save recipe.');
    } finally { setRSaving(false); }
  };

  const rTotals = rComposition.reduce(
    (acc, x) => {
      const f = x.grams / 100;
      return { cal: acc.cal + Number(x.food.calories) * f, p: acc.p + Number(x.food.protein) * f, c: acc.c + Number(x.food.carbs) * f, ft: acc.ft + Number(x.food.fat) * f };
    },
    { cal: 0, p: 0, c: 0, ft: 0 },
  );

  const inputCls = 'w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-slate-900';

  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>

      {/* Header (matches the rest of the app) */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <PlusSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Track <span className="text-emerald-600">&amp;</span> Treat</h1>
              <div className="hidden sm:block ml-4"><AppNav /></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Create</h2>
          <p className="text-slate-500 font-medium">Add your own ingredients and recipes. They&apos;re private to you and saved to your catalog.</p>
        </div>

        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          <button onClick={() => setTab('ingredient')} className={`flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all ${tab === 'ingredient' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Carrot className="w-4 h-4" /> Ingredient
          </button>
          <button onClick={() => setTab('recipe')} className={`flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all ${tab === 'recipe' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Utensils className="w-4 h-4" /> Recipe
          </button>
        </div>

        {/* ── INGREDIENT ── */}
        {tab === 'ingredient' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Nutrition per 100 g</p>
            {ingErr && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{ingErr}</div>}
            {ingMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{ingMsg}</div>}
            <input value={ing.name} onChange={(e) => setIng({ ...ing, name: e.target.value })} placeholder="Ingredient name" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              {([['calories', 'Calories'], ['protein', 'Protein (g)'], ['carbs', 'Carbs (g)'], ['fat', 'Fat (g)'], ['fiber', 'Fiber (g)']] as const).map(([k, label]) => (
                <input key={k} type="number" min="0" value={ing[k]} onChange={(e) => setIng({ ...ing, [k]: e.target.value })} placeholder={label} className={inputCls} />
              ))}
              <select value={ing.category} onChange={(e) => setIng({ ...ing, category: e.target.value })} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <button onClick={saveIngredient} disabled={ingSaving} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:bg-emerald-700 transition-colors">
              {ingSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />} Save ingredient
            </button>
          </div>
        )}

        {/* ── RECIPE ── */}
        {tab === 'recipe' && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
            {rErr && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">{rErr}</div>}
            {rMsg && <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{rMsg}</div>}
            <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder="Recipe name" className={inputCls} />

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Meal types</p>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button key={mt} onClick={() => toggleMealType(mt)} className={`px-4 py-2 rounded-xl font-bold text-sm capitalize cursor-pointer transition-all ${rMealTypes.includes(mt) ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{mt}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Complexity (1–10)
                <input type="number" min="1" max="10" value={rComplexity} onChange={(e) => setRComplexity(Math.min(10, Math.max(1, Number(e.target.value))))} className={inputCls + ' mt-1'} />
              </label>
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Prep minutes
                <input type="number" min="0" value={rPrep} onChange={(e) => setRPrep(Math.max(0, Number(e.target.value)))} className={inputCls + ' mt-1'} />
              </label>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Ingredients</p>
              <div className="flex gap-2">
                <input value={rQuery} onChange={(e) => setRQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchIngredients(); } }} placeholder="Search ingredients to add..." className={inputCls} />
                <button onClick={searchIngredients} disabled={!rQuery.trim() || rSearching} className="px-5 bg-emerald-600 text-white rounded-xl font-black cursor-pointer disabled:opacity-50 flex items-center">
                  {rSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
              {rResults.length > 0 && (
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 mt-2 pr-1">
                  {rResults.map((food) => (
                    <button key={food.id} onClick={() => addComp(food)} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 cursor-pointer text-left">
                      <span className="font-bold text-slate-900 text-sm">{food.name}</span>
                      <Plus className="w-4 h-4 text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {rComposition.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                {rComposition.map((x) => (
                  <div key={x.food.id} className="flex items-center gap-2 bg-white rounded-xl p-2.5">
                    <span className="flex-1 min-w-0 font-bold text-slate-800 text-sm truncate">{x.food.name}</span>
                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5">
                      <button onClick={() => setGrams(x.food.id, x.grams - 10)} className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Minus className="w-3 h-3 text-slate-600" /></button>
                      <span className="w-14 text-center font-black text-slate-900 text-xs">{x.grams} g</span>
                      <button onClick={() => setGrams(x.food.id, x.grams + 10)} className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Plus className="w-3 h-3 text-slate-600" /></button>
                    </div>
                    <button onClick={() => removeComp(x.food.id)} className="text-slate-300 hover:text-red-500 cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <p className="text-center text-sm font-black text-emerald-700 pt-1">
                  ≈ {Math.round(rTotals.cal)} kcal · {Math.round(rTotals.p)}p / {Math.round(rTotals.c)}c / {Math.round(rTotals.ft)}f per serving
                </p>
              </div>
            )}

            <button onClick={saveRecipe} disabled={rSaving} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:bg-emerald-700 transition-colors">
              {rSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />} Save recipe to my catalog
            </button>
          </div>
        )}
      </main>

      <div className="sm:hidden"><AppNav /></div>
    </div>
  );
}
