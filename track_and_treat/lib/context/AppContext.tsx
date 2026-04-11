'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { PhysicalMetrics } from '../algorithms/nutrition-logic';
import { calculateMacros } from '../algorithms/nutrition-logic';

// --- Types ---
interface Meal {
  id?: number;
  name: string;
  cal: number;
  prot: number;
  carbs: number;
  fat: number;
  fiber: number;
  time: string;
  emoji: string;
}

interface PlannedMeal {
  id: number;
  name: string;
  cal: number;
  time: string;
  icon: string;
  completed: boolean;
  skipped: boolean;
}

interface AppContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  metrics: PhysicalMetrics | null;
  setMetrics: (metrics: PhysicalMetrics) => void;
  dailyCals: number;
  setDailyCals: (cals: number) => void;
  targetMacros: { protein: number; carbs: number; fat: number };
  meals: Meal[];
  addMeal: (meal: Meal) => void;
  setMeals: (meals: Meal[]) => void;
  plannedMeals: PlannedMeal[];
  validateMeal: (plannedId: number) => void;
  skipMeal: (plannedId: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [metrics, setMetricsState] = useState<PhysicalMetrics | null>(null);
  const [dailyCals, setDailyCalsState] = useState<number>(2200);
  const [meals, setMealsState] = useState<Meal[]>([]);

  // Initialize Planned Meals (The Schedule)
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([
    { id: 1, name: 'Standard Daal Bhat', cal: 650, time: 'Morning', icon: '🍚', completed: false, skipped: false },
    { id: 2, name: 'Buff Momo (10 pcs)', cal: 450, time: 'Afternoon', icon: '🥟', completed: false, skipped: false },
    { id: 3, name: 'Chiura & Egg Curry', cal: 550, time: 'Evening', icon: '🍛', completed: false, skipped: false },
  ]);

  // Sync Load
  useEffect(() => {
    const savedToken = localStorage.getItem('auth');
    const savedMetrics = localStorage.getItem('userMetrics');
    const savedCals = localStorage.getItem('dailyCals');
    const savedMeals = localStorage.getItem('meals');
    const savedPlan = localStorage.getItem('plannedMeals');

    if (savedToken) setToken(savedToken);
    if (savedMetrics) setMetricsState(JSON.parse(savedMetrics));
    if (savedCals) setDailyCalsState(parseInt(savedCals));
    
    // If no meals, add a seed meal so it's not empty
    if (savedMeals) {
      setMealsState(JSON.parse(savedMeals));
    } else if (savedToken) {
      const seedMeal = { name: 'Morning Tea & Biscuits', cal: 150, prot: 5, carbs: 25, fat: 5, fiber: 2, time: 'Started Day', emoji: '☕' };
      setMealsState([seedMeal]);
      localStorage.setItem('meals', JSON.stringify([seedMeal]));
    }

    if (savedPlan) setPlannedMeals(JSON.parse(savedPlan));
  }, []);

  const targetMacros = useMemo(() => {
    if (!metrics || !dailyCals) return { protein: 0, carbs: 0, fat: 0 };
    return calculateMacros(dailyCals, metrics.goal);
  }, [dailyCals, metrics]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('auth', newToken);
    router.push('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setMetricsState(null);
    setMealsState([]);
    localStorage.clear();
    router.push('/login');
  };

  const addMeal = (meal: Meal) => {
    setMealsState(prev => {
      const updated = [meal, ...prev];
      localStorage.setItem('meals', JSON.stringify(updated));
      return updated;
    });
  };

  // NEW: Validate Function (Plan -> Reality)
  const validateMeal = (id: number) => {
    const planned = plannedMeals.find(m => m.id === id);
    if (!planned || planned.completed) return;

    // 1. Mark as completed in plan
    const updatedPlan = plannedMeals.map(m => m.id === id ? { ...m, completed: true } : m);
    setPlannedMeals(updatedPlan);
    localStorage.setItem('plannedMeals', JSON.stringify(updatedPlan));

    // 2. Automatically log into Reality
    const newLoggedMeal: Meal = {
      name: planned.name,
      cal: planned.cal,
      prot: Math.round(planned.cal * 0.1), // Estimated
      carbs: Math.round(planned.cal * 0.15),
      fat: Math.round(planned.cal * 0.05),
      fiber: 5,
      time: 'Validated',
      emoji: planned.icon
    };
    addMeal(newLoggedMeal);
  };

  const skipMeal = (id: number) => {
    const updatedPlan = plannedMeals.map(m => m.id === id ? { ...m, skipped: !m.skipped } : m);
    setPlannedMeals(updatedPlan);
    localStorage.setItem('plannedMeals', JSON.stringify(updatedPlan));
  };

  const setMetrics = (newMetrics: PhysicalMetrics) => {
    setMetricsState(newMetrics);
    localStorage.setItem('userMetrics', JSON.stringify(newMetrics));
  };

  const setDailyCals = (cals: number) => {
    setDailyCalsState(cals);
    localStorage.setItem('dailyCals', cals.toString());
  };

  const value = {
    token,
    isAuthenticated: !!token,
    login,
    logout,
    metrics,
    setMetrics,
    dailyCals,
    setDailyCals,
    targetMacros,
    meals,
    addMeal,
    setMeals: setMealsState,
    plannedMeals,
    validateMeal,
    skipMeal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}
