'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

import type {
  PhysicalMetrics,
  DayPlans,
  DayLogs,
  MealLogItem,
} from '@/lib/types';

import { calculateMacros } from '@/lib/algorithms/nutrition-logic';
import { parseMealAlgorithmic } from '@/lib/food-db';

import {
  INITIAL_SEVEN_DAY_PLANS,
  INITIAL_DAY_LOGS,
} from '@/lib/constants/mockdata';

/* ───────────────── TYPES ───────────────── */

interface AppContextType {
  token: string | null;
  userName: string | null;
  isAuthenticated: boolean;

  login: (token: string, name?: string) => void;
  logout: () => void;

  metrics: PhysicalMetrics | null;
  setMetrics: (m: PhysicalMetrics) => void;

  onboardingComplete: (m: PhysicalMetrics) => void;

  dailyCals: number;
  setDailyCals: (cals: number) => void;

  targetMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };

  dayPlans: DayPlans;
  dayLogs: DayLogs;

  validateMeal: (dayIdx: number, mealId: number) => void;
  skipMeal: (dayIdx: number, mealId: number) => void;
  logMealFromText: (dayIdx: number, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ───────────────── PROVIDER ───────────────── */

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [metrics, setMetricsState] = useState<PhysicalMetrics | null>(null);
  const [dailyCals, setDailyCalsState] = useState(2200);

  const [dayPlans, setDayPlans] = useState<DayPlans>(INITIAL_SEVEN_DAY_PLANS);
  const [dayLogs, setDayLogs] = useState<DayLogs>(INITIAL_DAY_LOGS);

  /* ───────── HYDRATION ───────── */
  useEffect(() => {
    const load = (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    };

    const savedToken = load('auth');
    const savedName = load('userName');
    const savedMetrics = load('userMetrics');
    const savedCals = load('dailyCals');
    const savedPlans = load('dayPlans');
    const savedLogs = load('dayLogs');

    if (savedToken) setToken(savedToken);
    if (savedName) setUserName(savedName);
    if (savedMetrics) setMetricsState(JSON.parse(savedMetrics));
    if (savedCals) setDailyCalsState(Number(savedCals));
    if (savedPlans) setDayPlans(JSON.parse(savedPlans));
    if (savedLogs) setDayLogs(JSON.parse(savedLogs));
  }, []);

  /* ───────── LOGIN ───────── */
  const login = useCallback((newToken: string, name?: string) => {
    setToken(newToken);
    localStorage.setItem('auth', newToken);

    if (name) {
      setUserName(name);
      localStorage.setItem('userName', name);
    }

    router.push('/onboarding');
  }, [router]);

  /* ───────── LOGOUT ───────── */
  const logout = useCallback(() => {
    setToken(null);
    setUserName(null);
    setMetricsState(null);

    localStorage.clear();
    router.push('/login');
  }, [router]);

  /* ───────── METRICS ───────── */
  const setMetrics = useCallback((m: PhysicalMetrics) => {
    setMetricsState(m);
    localStorage.setItem('userMetrics', JSON.stringify(m));
  }, []);

  const setDailyCals = useCallback((cals: number) => {
    setDailyCalsState(cals);
    localStorage.setItem('dailyCals', String(cals));
  }, []);

  /* ───────── ONBOARDING ───────── */
  const onboardingComplete = useCallback((m: PhysicalMetrics) => {
    setMetricsState(m);
    localStorage.setItem('userMetrics', JSON.stringify(m));

    const cals = calculateMacros(2200, m.goal);
    setDailyCalsState(2200);

    router.push('/dashboard');
  }, [router]);

  /* ───────── MACROS ───────── */
  const targetMacros = useMemo(() => {
    if (!metrics) return { protein: 0, carbs: 0, fat: 0 };
    return calculateMacros(dailyCals, metrics.goal);
  }, [dailyCals, metrics]);

  /* ───────── ACTIONS ───────── */
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

  const logMealFromText = useCallback((dayIdx: number, text: string) => {
    const parsed = parseMealAlgorithmic(text);
    if (!parsed.cal) return;

    const meal: MealLogItem = {
      name: text,
      emoji: parsed.matches.join('') || '🍽️',
      cal: parsed.cal,
      prot: parsed.prot,
      carbs: parsed.carbs,
      fat: parsed.fat,
      time: new Date().toLocaleTimeString(),
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

  /* ───────── CONTEXT VALUE ───────── */
  const value = useMemo(() => ({
    token,
    userName,
    isAuthenticated: !!token,

    login,
    logout,

    metrics,
    setMetrics,

    onboardingComplete,

    dailyCals,
    setDailyCals,

    targetMacros,

    dayPlans,
    dayLogs,

    validateMeal,
    skipMeal,
    logMealFromText,
  }), [
    token,
    userName,
    metrics,
    dailyCals,
    targetMacros,
    dayPlans,
    dayLogs,
    login,
    logout,
    setMetrics,
    onboardingComplete,
    setDailyCals,
    validateMeal,
    skipMeal,
    logMealFromText,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

/* ───────── HOOK ───────── */
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}