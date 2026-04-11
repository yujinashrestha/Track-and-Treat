'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

import type { PhysicalMetrics, DayPlans, DayLogs, MealLogItem } from '@/lib/types';
import { calculateMacros } from '@/lib/algorithms/nutrition-logic';
import { parseMealAlgorithmic } from '@/lib/food-db';

import { INITIAL_SEVEN_DAY_PLANS, INITIAL_DAY_LOGS } from '@/lib/constants/mockdata';

interface AppContextType {
  token: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;   // ← NEW: true until localStorage has been read

  login: (token: string, name?: string) => void;
  logout: () => void;

  metrics: PhysicalMetrics | null;
  setMetrics: (m: PhysicalMetrics) => void;

  dailyCals: number;
  setDailyCals: (cals: number) => void;

  targetMacros: { protein: number; carbs: number; fat: number };

  dayPlans: DayPlans;
  dayLogs: DayLogs;

  validateMeal: (dayIdx: number, mealId: number) => void;
  skipMeal: (dayIdx: number, mealId: number) => void;
  logMealFromText: (dayIdx: number, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function setCookie(name: string, value: string, days: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${days * 24 * 60 * 60}`;
}
function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [token,    setToken]    = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [metrics,       setMetricsState]   = useState<PhysicalMetrics | null>(null);
  const [dailyCals,     setDailyCalsState] = useState(2200);

  const [dayPlans, setDayPlans] = useState<DayPlans>(INITIAL_SEVEN_DAY_PLANS);
  const [dayLogs,  setDayLogs]  = useState<DayLogs>(INITIAL_DAY_LOGS);

  // stays true until localStorage has been fully read on the client
  const [isInitializing, setIsInitializing] = useState(true);

  // ─── Load from localStorage on mount ────────────────────────────────────────
  useEffect(() => {
    const load = (k: string) => {
      try { return localStorage.getItem(k); } catch { return null; }
    };

    const savedToken   = load('auth');
    const savedName    = load('userName');
    const savedMetrics = load('userMetrics');
    const savedCals    = load('dailyCals');
    const savedPlans   = load('dayPlans');
    const savedLogs    = load('dayLogs');

    if (savedToken)   setToken(savedToken);
    if (savedName)    setUserName(savedName);
    if (savedMetrics) setMetricsState(JSON.parse(savedMetrics));
    if (savedCals)    setDailyCalsState(Number(savedCals));
    if (savedPlans)   setDayPlans(JSON.parse(savedPlans));
    if (savedLogs)    setDayLogs(JSON.parse(savedLogs));

    // done reading — navbar can now safely render the correct auth state
    setIsInitializing(false);
  }, []);

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback((newToken: string, name?: string) => {
    const displayName = name || 'User';

    setToken(newToken);
    setUserName(displayName);

    localStorage.setItem('auth',     newToken);
    localStorage.setItem('userName', displayName);
    setCookie('auth', newToken, 7);

    router.push('/dashboard');
  }, [router]);

  // ─── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setToken(null);
    setUserName(null);
    setMetricsState(null);

    localStorage.clear();
    clearCookie('auth');

    router.push('/login');
  }, [router]);

  // ─── Metrics ─────────────────────────────────────────────────────────────────
  const setMetrics = useCallback((m: PhysicalMetrics) => {
    setMetricsState(m);
    localStorage.setItem('userMetrics', JSON.stringify(m));
  }, []);

  // ─── Daily calories ──────────────────────────────────────────────────────────
  const setDailyCals = useCallback((cals: number) => {
    setDailyCalsState(cals);
    localStorage.setItem('dailyCals', String(cals));
  }, []);

  // ─── Computed macros ─────────────────────────────────────────────────────────
  const targetMacros = useMemo(() => {
    if (!metrics) return { protein: 0, carbs: 0, fat: 0 };
    return calculateMacros(dailyCals, metrics.goal);
  }, [dailyCals, metrics]);

  // ─── Meal plan actions ───────────────────────────────────────────────────────
  const validateMeal = useCallback((dayIdx: number, mealId: number) => {
    setDayPlans(prev => {
      const updated = {
        ...prev,
        [dayIdx]: prev[dayIdx].map(m =>
          m.id === mealId ? { ...m, completed: true } : m
        ),
      };
      localStorage.setItem('dayPlans', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const skipMeal = useCallback((dayIdx: number, mealId: number) => {
    setDayPlans(prev => {
      const updated = {
        ...prev,
        [dayIdx]: prev[dayIdx].map(m =>
          m.id === mealId ? { ...m, skipped: !m.skipped } : m
        ),
      };
      localStorage.setItem('dayPlans', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─── Meal logging ────────────────────────────────────────────────────────────
  const logMealFromText = useCallback((dayIdx: number, text: string) => {
    const parsed = parseMealAlgorithmic(text);
    if (!parsed.cal) return;

    const meal: MealLogItem = {
      name:  text,
      emoji: parsed.matches.join('') || '🍽️',
      cal:   parsed.cal,
      prot:  parsed.prot,
      carbs: parsed.carbs,
      fat:   parsed.fat,
      time:  new Date().toLocaleTimeString(),
    };

    setDayLogs(prev => {
      const updated = {
        ...prev,
        [dayIdx]: [...(prev[dayIdx] || []), meal],
      };
      localStorage.setItem('dayLogs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      token,
      userName,
      isAuthenticated: !!token,
      isInitializing,
      login,
      logout,
      metrics,
      setMetrics,
      dailyCals,
      setDailyCals,
      targetMacros,
      dayPlans,
      dayLogs,
      validateMeal,
      skipMeal,
      logMealFromText,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}