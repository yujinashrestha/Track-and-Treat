'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, Flame, TrendingUp, History, Scale,
  Clock, MessageSquare, Star, Lightbulb, Heart, AlertTriangle, Trash2, Plus,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { AppNav } from '@/components/app-nav';
import {
  getMealLogs, deleteMealLog, getWeeklyOverview, getWeeklyFeedback,
  getWeightHistory, createWeightLog, getStats, getActiveMealPlan,
  ApiError,
  type MealLog, type WeeklyOverview, type WeeklyFeedbackResponse, type WeightLogEntry,
} from '@/lib/api';

const MEAL_TYPE_EMOJI: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍿',
};

// Format a Date as YYYY-MM-DD in LOCAL time. Using toISOString() here would
// convert to UTC and shift the date by a day in non-UTC timezones.
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr() {
  return toISO(new Date());
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getMondayOfWeek(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7);
  const monday = new Date(d);
  monday.setDate(diff);
  return toISO(monday);
}

const RATING_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  excellent: { color: 'text-emerald-600', icon: <Star className="w-5 h-5" />, label: 'Excellent' },
  good: { color: 'text-sky-600', icon: <TrendingUp className="w-5 h-5" />, label: 'Good' },
  needs_improvement: { color: 'text-amber-600', icon: <Lightbulb className="w-5 h-5" />, label: 'Needs Improvement' },
  poor: { color: 'text-red-600', icon: <AlertTriangle className="w-5 h-5" />, label: 'Poor' },
};

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Date navigation
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(todayStr()));
  const [planStart, setPlanStart] = useState<string | null>(null);

  // Data
  const [dayLogs, setDayLogs] = useState<MealLog[]>([]);
  const [weekly, setWeekly] = useState<WeeklyOverview | null>(null);
  const [feedback, setFeedback] = useState<WeeklyFeedbackResponse | null>(null);
  const [loadingDay, setLoadingDay] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Weight tracking
  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [initialWeight, setInitialWeight] = useState<number | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [loggingWeight, setLoggingWeight] = useState(false);

  const loadDay = useCallback(async (date: string) => {
    setLoadingDay(true);
    try {
      const logs = await getMealLogs(date);
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDayLogs(logs);
    } catch { setDayLogs([]); }
    finally { setLoadingDay(false); }
  }, []);

  const loadWeek = useCallback(async (start: string) => {
    setLoadingWeekly(true);
    try {
      const overview = await getWeeklyOverview(start);
      setWeekly(overview);
    } catch { setWeekly(null); }
    finally { setLoadingWeekly(false); }
  }, []);

  const loadWeight = useCallback(async () => {
    try {
      const [history, stats] = await Promise.all([
        getWeightHistory(),
        getStats(),
      ]);
      setWeightLogs(history);
      setCurrentWeight(stats.currentWeight);
      setInitialWeight(stats.initialWeight);
    } catch {}
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    loadDay(selectedDate);
    loadWeight();
  }, [authLoading, isAuthenticated, router, selectedDate, loadDay, loadWeight]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    loadWeek(weekStart);
    setFeedback(null);
    setFeedbackError('');
  }, [authLoading, isAuthenticated, weekStart, loadWeek]);

  // Default the week to the active plan's start (the "meal-plan week"), once.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    getActiveMealPlan()
      .then((p) => { if (p?.startDate) { setPlanStart(p.startDate); setWeekStart(p.startDate); } })
      .catch(() => {});
  }, [authLoading, isAuthenticated]);

  const navigateDay = (dir: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + dir);
    const newDate = toISO(d);
    setSelectedDate(newDate);
    setWeekStart(getMondayOfWeek(newDate));
  };

  const handleDeleteMeal = async (id: number) => {
    try {
      await deleteMealLog(id);
      await loadDay(selectedDate);
      await loadWeek(weekStart);
    } catch {}
  };

  const handleLoadFeedback = async () => {
    setLoadingFeedback(true);
    setFeedbackError('');
    try {
      const fb = await getWeeklyFeedback(weekStart);
      setFeedback(fb);
    } catch (err) {
      if (err instanceof ApiError) setFeedbackError(err.message);
      else setFeedbackError('Failed to load feedback.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (!w || w < 20 || w > 500) return;
    setLoggingWeight(true);
    try {
      await createWeightLog({ weight: w });
      setNewWeight('');
      await loadWeight();
    } catch {}
    finally { setLoggingWeight(false); }
  };

  // Chart data
  const weightChartData = weightLogs.map((l) => ({
    date: new Date(l.loggedAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: Number(l.weight),
  }));

  const weightChange = currentWeight && initialWeight
    ? Number((Number(currentWeight) - Number(initialWeight)).toFixed(1))
    : null;

  const chartData = weekly?.days.map((d) => ({
    name: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    consumed: Math.round(d.consumed),
    target: Math.round(d.target),
    date: d.date,
  })) || [];

  const dayTotals = dayLogs.reduce(
    (acc, l) => ({
      cal: acc.cal + Number(l.calories),
      prot: acc.prot + Number(l.protein),
      carbs: acc.carbs + Number(l.carbs),
      fat: acc.fat + Number(l.fat),
    }),
    { cal: 0, prot: 0, carbs: 0, fat: 0 }
  );

  if (authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">History</h1>
            <p className="text-slate-500 font-medium text-sm">Track your meals and weekly progress</p>
          </div>
        </div>

        {/* Weekly Overview Chart */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Weekly Overview
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(weekStart + 'T00:00:00'); d.setDate(d.getDate() - 7); setWeekStart(toISO(d)); }} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              {/* Pick where the week starts (defaults to the active plan's start) */}
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="text-sm font-bold text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                title="Week starts on this date"
              />
              <button onClick={() => { const d = new Date(weekStart + 'T00:00:00'); d.setDate(d.getDate() + 7); setWeekStart(toISO(d)); }} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Quick align: to the active plan's week, or to Monday */}
          <div className="flex items-center gap-2 mb-4 text-xs font-bold">
            <span className="text-slate-400">Week of {formatDate(weekStart)} · 7 days</span>
            {planStart && weekStart !== planStart && (
              <button onClick={() => setWeekStart(planStart)} className="text-emerald-600 hover:underline cursor-pointer">Align to my plan</button>
            )}
            {weekStart !== getMondayOfWeek(todayStr()) && (
              <button onClick={() => setWeekStart(getMondayOfWeek(todayStr()))} className="text-slate-500 hover:underline cursor-pointer">This week (Mon)</button>
            )}
          </div>

          {loadingWeekly ? (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }}
                    />
                    {chartData.length > 0 && (
                      <ReferenceLine y={chartData[0]?.target || 0} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', position: 'right', fill: '#10b981', fontSize: 11, fontWeight: 700 }} />
                    )}
                    <Bar dataKey="consumed" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Consumed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly summary stats */}
              {weekly && (
                <div className="grid grid-cols-4 gap-4 mt-6">
                  {[
                    { l: 'Avg Daily', v: `${weekly.summary.avgDaily}`, u: 'kcal' },
                    { l: 'Days On Track', v: `${weekly.summary.daysOnTrack}`, u: '/ 7' },
                    { l: 'Days Logged', v: `${weekly.summary.daysLogged}`, u: '/ 7' },
                    { l: 'Weekly Total', v: `${weekly.summary.totalConsumed}`, u: 'kcal' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-slate-900">{s.v}<span className="text-xs text-slate-400 ml-1">{s.u}</span></p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Weight Progress */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" /> Weight Progress
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="kg"
                step="0.1"
                min="20"
                max="500"
                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogWeight(); }}
              />
              <button onClick={handleLogWeight} disabled={loggingWeight || !newWeight} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 cursor-pointer disabled:opacity-50 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Log
              </button>
            </div>
          </div>

          {/* Stats row */}
          {(currentWeight || initialWeight) && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{currentWeight ? Number(currentWeight).toFixed(1) : '-'}<span className="text-xs text-slate-400 ml-1">kg</span></p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{initialWeight ? Number(initialWeight).toFixed(1) : '-'}<span className="text-xs text-slate-400 ml-1">kg</span></p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <p className={`text-lg font-black ${weightChange !== null ? (weightChange < 0 ? 'text-emerald-600' : weightChange > 0 ? 'text-red-600' : 'text-slate-900') : 'text-slate-900'}`}>
                  {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange}` : '-'}<span className="text-xs text-slate-400 ml-1">kg</span>
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Change</p>
              </div>
            </div>
          )}

          {/* Weight chart */}
          {weightChartData.length > 1 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }} />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center py-8 text-slate-400 font-bold text-sm italic">
              {weightChartData.length === 1 ? 'Log at least 2 entries to see the chart' : 'No weight entries yet'}
            </p>
          )}
        </div>

        {/* Weekly Feedback */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-violet-600" /> Weekly Feedback
            </h3>
            {!feedback && (
              <button
                onClick={handleLoadFeedback}
                disabled={loadingFeedback}
                className="px-5 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loadingFeedback ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                {loadingFeedback ? 'Loading...' : 'Get Feedback'}
              </button>
            )}
          </div>

          {feedbackError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {feedbackError}
            </div>
          )}

          {feedback && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Rating badge */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-slate-50 ${RATING_CONFIG[feedback.feedback.overallRating]?.color || 'text-slate-600'}`}>
                  {RATING_CONFIG[feedback.feedback.overallRating]?.icon}
                </div>
                <div>
                  <p className={`font-black text-lg ${RATING_CONFIG[feedback.feedback.overallRating]?.color || 'text-slate-900'}`}>
                    {RATING_CONFIG[feedback.feedback.overallRating]?.label || feedback.feedback.overallRating}
                  </p>
                  <p className="text-slate-500 text-sm font-medium">{feedback.feedback.summary}</p>
                </div>
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Observations</p>
                {feedback.feedback.observations.map((obs, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <span className="text-emerald-600 font-black text-sm mt-0.5">{i + 1}.</span>
                    <p className="text-sm text-slate-700 font-medium">{obs}</p>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1">Tip</p>
                  <p className="text-sm text-amber-800 font-medium">{feedback.feedback.tip}</p>
                </div>
              </div>

              {/* Encouragement */}
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                <Heart className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 font-medium">{feedback.feedback.encouragement}</p>
              </div>
            </motion.div>
          )}

          {!feedback && !feedbackError && !loadingFeedback && (
            <p className="text-slate-400 text-sm font-medium text-center py-4">Click &quot;Get Feedback&quot; for a summary of your week</p>
          )}
        </div>

        {/* Day Meal Logs */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" /> Day Detail
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateDay(-1)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="flex items-center gap-2 px-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setWeekStart(getMondayOfWeek(e.target.value));
                  }}
                  className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                />
              </div>
              <button onClick={() => navigateDay(1)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Day totals */}
          {dayLogs.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { l: 'Calories', v: Math.round(dayTotals.cal), u: 'kcal', c: 'text-orange-600' },
                { l: 'Protein', v: Math.round(dayTotals.prot), u: 'g', c: 'text-emerald-600' },
                { l: 'Carbs', v: Math.round(dayTotals.carbs), u: 'g', c: 'text-amber-600' },
                { l: 'Fat', v: Math.round(dayTotals.fat), u: 'g', c: 'text-slate-600' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-black ${s.c}`}>{s.v}<span className="text-xs ml-1">{s.u}</span></p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p>
                </div>
              ))}
            </div>
          )}

          {loadingDay ? (
            <div className="py-10 flex justify-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : dayLogs.length === 0 ? (
            <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest italic">No meals logged on this day</p>
          ) : (
            <div className="space-y-3">
              {dayLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm">
                      {MEAL_TYPE_EMOJI[log.mealType] || '🍽️'}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{log.foodItem?.name || log.recipe?.name || log.groupName || 'Unknown'}</p>
                      <div className="flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>{log.mealType}</span>
                        <span>{log.quantity}x</span>
                        <span>{Math.round(Number(log.protein))}p / {Math.round(Number(log.carbs))}c / {Math.round(Number(log.fat))}f</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-slate-900">{Math.round(Number(log.calories))} <span className="text-[10px]">kcal</span></p>
                    <button onClick={() => handleDeleteMeal(log.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sm:hidden pb-20">
        <AppNav />
      </div>
    </div>
  );
}
