'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Flame, Droplets, Scale, History,
  PlusCircle, LogOut, Trophy, TrendingUp, X,
  Utensils, Clock, Zap
} from "lucide-react";
import { Calendar } from '@/components/ui/calendar';

// --- Types ---
interface Nutrient {
  label: string;
  value: number;
  color: string;
}

interface NutrientSlice extends Nutrient {
  d: string;
  angle: number;
}

interface MacroData {
  cal: number;
  prot: number;
  carbs: number;
  fat: number;
  fiber: number;
}

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

interface User {
  email: string;
}

type PresetKey = 'default' | 'chicken' | 'rice' | 'salad' | 'pasta' | 'burger' | 'shake' | 'egg' | 'oat';

// --- Pie Chart ---
function NutrientPieChart({ nutrients }: { nutrients: Nutrient[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 75;
  const total = nutrients.reduce((s, n) => s + n.value, 0);
  if (total === 0) return null;

  let cumAngle = -Math.PI / 2;
  const slices: NutrientSlice[] = nutrients.map((n) => {
    const angle = (n.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...n, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, angle };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#f1f5f9" strokeWidth="2" />
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity="0.9"
            className="transition-all duration-300 hover:opacity-100 cursor-pointer"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="#94a3b8" fontWeight="700" fontFamily="monospace">TOTAL</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="16" fill="#0f172a" fontWeight="900" fontFamily="monospace">{total}g</text>
      </svg>
      <div className="flex flex-wrap gap-3 justify-center">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-xs font-bold text-slate-600">{s.label} <span className="text-slate-400">{s.value}g</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MEALS_INIT: Meal[] = [
  { name: 'Grilled Chicken Breast', cal: 350, prot: 45, carbs: 0, fat: 8, fiber: 0, time: '2h ago', emoji: '🍗' },
  { name: 'Brown Rice & Broccoli', cal: 420, prot: 12, carbs: 78, fat: 4, fiber: 6, time: '5h ago', emoji: '🥦' },
  { name: 'Protein Shake', cal: 180, prot: 24, carbs: 10, fat: 3, fiber: 1, time: '8h ago', emoji: '🥤' },
];

const PRESETS: Record<PresetKey, MacroData> = {
  default: { cal: 320, prot: 18, carbs: 35, fat: 10, fiber: 4 },
  chicken: { cal: 350, prot: 45, carbs: 2, fat: 8, fiber: 0 },
  rice:    { cal: 390, prot: 8,  carbs: 82, fat: 2, fiber: 3 },
  salad:   { cal: 180, prot: 6,  carbs: 18, fat: 9, fiber: 6 },
  pasta:   { cal: 520, prot: 16, carbs: 88, fat: 12, fiber: 5 },
  burger:  { cal: 680, prot: 34, carbs: 52, fat: 32, fiber: 3 },
  shake:   { cal: 180, prot: 24, carbs: 10, fat: 3, fiber: 1 },
  egg:     { cal: 220, prot: 18, carbs: 2,  fat: 14, fiber: 0 },
  oat:     { cal: 290, prot: 10, carbs: 52, fat: 6, fiber: 8 },
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showMealForm, setShowMealForm] = useState(false);
  const [meals, setMeals] = useState<Meal[]>(MEALS_INIT);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState<MacroData | null>(null);
  const [logged, setLogged] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem('auth');
    if (!token) { /* router.push('/login') */ }
    setUser({ email: 'user@example.com' });
    setLoading(false);
  }, []);

  const totalCals = meals.reduce((s, m) => s + m.cal, 0);

  const handleAnalyze = async () => {
    if (!mealName.trim()) return;
    setAnalyzing(true);
    setAnalyzed(null);
    await new Promise(r => setTimeout(r, 1400));
    const base = mealName.toLowerCase();
    const key = (Object.keys(PRESETS) as PresetKey[]).find(k => base.includes(k)) ?? 'default';
    setAnalyzed(PRESETS[key]);
    setAnalyzing(false);
  };

  const handleLog = () => {
    if (!analyzed || !mealName.trim()) return;
    setLogged(true);
    const newMeal: Meal = {
      name: mealName,
      cal: analyzed.cal,
      prot: analyzed.prot,
      carbs: analyzed.carbs,
      fat: analyzed.fat,
      fiber: analyzed.fiber,
      time: 'Just now',
      emoji: '🍽️',
    };
    setMeals(prev => [newMeal, ...prev]);
    setTimeout(() => {
      setShowMealForm(false);
      setMealName('');
      setMealNotes('');
      setAnalyzed(null);
      setLogged(false);
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  const nutrientData: Nutrient[] = analyzed ? [
    { label: 'Protein', value: analyzed.prot,  color: '#10b981' },
    { label: 'Carbs',   value: analyzed.carbs, color: '#f59e0b' },
    { label: 'Fat',     value: analyzed.fat,   color: '#f97316' },
    { label: 'Fiber',   value: analyzed.fiber, color: '#6366f1' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap');
        * { font-family: 'Space Grotesk', sans-serif; }
        .slide-down { animation: slideDown 0.4s cubic-bezier(.16,1,.3,1) both; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-16px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease both; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .pulse-green { animation: pulseGreen 1s ease infinite; }
        @keyframes pulseGreen { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); } }
      `}</style>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-emerald-600" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Track <span className="text-emerald-600">&</span> Treat</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{user?.email}</span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <Trophy className="w-3 h-3" />
                  <span className="text-xs font-black uppercase tracking-wider">7 Day Streak</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner */}
        <div className="relative bg-slate-900 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">👋</div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black text-white mb-1">Afternoon, Healthy Human!</h2>
              <p className="text-slate-400 font-medium">
                You've logged <span className="text-emerald-400 font-black">{totalCals} cal</span> so far. Keep hitting your protein targets! 🥩
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Stats + Meal Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: <Flame className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', label: 'Daily Calories', val: '2,100', pct: 65, bar: 'bg-orange-500', tag: 'Main Goal' },
                { icon: <Droplets className="w-5 h-5 text-sky-600" />, bg: 'bg-sky-50', label: 'Target Water', val: '2.5L', pct: 40, bar: 'bg-sky-500', tag: 'Hydration' },
                { icon: <History className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50', label: 'Protein Goal', val: '120g', pct: 80, bar: 'bg-emerald-500', tag: 'Macros' },
              ].map((c, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>{c.icon}</div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{c.tag}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 mb-1">{c.val}</p>
                  <p className="text-slate-500 font-bold text-sm mb-4">{c.label}</p>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${c.bar} rounded-full transition-all duration-700`} style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            
{/* Calendar */}
<div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
    📅 <span>Meal Calendar</span>
  </h3>
  <Calendar
    className="mx-auto"
    selected={selectedDate}
    onSelect={setSelectedDate}
    markedDates={[new Date("2025-03-08"), new Date("2025-03-10")]}
  />
  {selectedDate && (
    <p className="text-center text-xs font-bold text-emerald-600 mt-3">
      📌 Selected: {selectedDate.toDateString()}
    </p>
  )}
</div>
            {/* Add Meal Button */}
            {!showMealForm && (
              <button
                onClick={() => setShowMealForm(true)}
                className="w-full p-5 border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-400 rounded-2xl transition-all group flex items-center justify-center gap-3 text-emerald-700 font-black"
              >
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Add Meal
              </button>
            )}

            {/* Meal Form Panel */}
            {showMealForm && (
              <div className="slide-down bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden" ref={formRef}>
                <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Utensils className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Log a Meal</h3>
                      <p className="text-xs text-slate-400 font-medium">AI-powered nutrition analysis</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowMealForm(false); setAnalyzed(null); setMealName(''); setMealNotes(''); }}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Meal Name *</label>
                    <input
                      value={mealName}
                      onChange={e => { setMealName(e.target.value); setAnalyzed(null); }}
                      placeholder="e.g. Grilled chicken with rice..."
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Additional Notes</label>
                    <textarea
                      value={mealNotes}
                      onChange={e => setMealNotes(e.target.value)}
                      placeholder="Portion size, ingredients, preparation method..."
                      rows={2}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={!mealName.trim() || analyzing}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing Nutrients...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Analyze with AI
                      </>
                    )}
                  </button>

                  {analyzed && (
                    <div className="fade-in space-y-6 pt-2">
                      <div className="grid grid-cols-4 gap-3">
                        {([
                          { label: 'Calories', val: analyzed.cal,   unit: 'kcal', color: 'text-orange-600', bg: 'bg-orange-50' },
                          { label: 'Protein',  val: analyzed.prot,  unit: 'g',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
                          { label: 'Carbs',    val: analyzed.carbs, unit: 'g',    color: 'text-amber-600',  bg: 'bg-amber-50' },
                          { label: 'Fat',      val: analyzed.fat,   unit: 'g',    color: 'text-rose-600',   bg: 'bg-rose-50' },
                        ] as { label: string; val: number; unit: string; color: string; bg: string }[]).map((m, i) => (
                          <div key={i} className={`${m.bg} rounded-2xl p-4 text-center`}>
                            <p className={`text-xl font-black ${m.color}`}>{m.val}<span className="text-xs ml-0.5">{m.unit}</span></p>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">{m.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-6">
                        <p className="text-sm font-black text-slate-600 uppercase tracking-widest mb-5 text-center">Macro Breakdown</p>
                        <NutrientPieChart nutrients={nutrientData} />
                      </div>

                      <button
                        onClick={handleLog}
                        disabled={logged}
                        className={`w-full py-4 rounded-2xl font-black transition-all text-white flex items-center justify-center gap-2 ${
                          logged ? 'bg-emerald-500 pulse-green' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        {logged ? '✅ Meal Logged!' : (
                          <>
                            <PlusCircle className="w-5 h-5" />
                            Log This Meal
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Nutrition */}
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  Recent Nutrition
                </h3>
                <button className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {meals.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all group ${i === 0 && item.time === 'Just now' ? 'fade-in ring-1 ring-emerald-200 bg-emerald-50/50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-lg">{item.emoji}</div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{item.name}</p>
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{item.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-sm">{item.cal} cal</p>
                      <p className="text-xs font-bold text-emerald-600">{item.prot}g protein</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-emerald-600 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <h3 className="text-lg font-black mb-5 relative z-10">Quick Logs</h3>
              <div className="space-y-2.5 relative z-10">
                {([
                  { label: 'Food',   icon: <PlusCircle className="w-4 h-4" /> },
                  { label: 'Water',  icon: <Droplets className="w-4 h-4" /> },
                  { label: 'Weight', icon: <Scale className="w-4 h-4" /> },
                ] as { label: string; icon: React.ReactNode }[]).map((b, i) => (
                  <button key={i} className="w-full p-3.5 bg-white/10 hover:bg-white text-white hover:text-emerald-900 rounded-xl transition-all font-black flex items-center justify-between group/btn text-sm">
                    <span>{b.label}</span>
                    <span className="group-hover/btn:scale-110 transition-transform">{b.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm">
              <h3 className="text-slate-900 font-black mb-4 text-sm">Daily Insights</h3>
              <div className="flex items-start gap-3 p-4 bg-lime-50 rounded-2xl border border-lime-100 mb-3">
                <TrendingUp className="w-5 h-5 text-lime-600 mt-0.5 shrink-0" />
                <p className="text-xs font-bold text-lime-900 leading-relaxed">Your metabolism is 15% higher this week!</p>
              </div>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                Great progress! You've hit your water goals 4 days in a row. 💧
              </p>
            </div>

            <div className="bg-slate-900 rounded-3xl p-7 text-white shadow-xl">
              <h3 className="font-black mb-4 text-sm">Today's Summary</h3>
              <div className="space-y-3">
                {([
                  { label: 'Meals logged',   val: `${meals.length}`,                                        icon: '🍽️' },
                  { label: 'Total calories', val: `${totalCals} kcal`,                                      icon: '🔥' },
                  { label: 'Total protein',  val: `${meals.reduce((s, m) => s + m.prot, 0)}g`,              icon: '💪' },
                ] as { label: string; val: string; icon: string }[]).map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                    <span className="text-slate-400 text-xs font-bold flex items-center gap-2"><span>{s.icon}</span>{s.label}</span>
                    <span className="text-white font-black text-sm">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}