// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/lib/constants/mockData.ts
// ─────────────────────────────────────────────────────────────────────────────

import type { DayPlans, DayLogs, HistoryRecord, ChartDataPoint } from '@/lib/types';

export const INITIAL_SEVEN_DAY_PLANS: DayPlans = {
  0: [
    { id: 1,  name: 'Daal Bhat Set',      icon: '🍛', time: 'MORNING',   cal: 650, completed: true,  skipped: false },
    { id: 2,  name: 'Buff Momo (10 pcs)', icon: '🥟', time: 'AFTERNOON', cal: 450, completed: false, skipped: false },
    { id: 3,  name: 'Chiura & Egg Curry', icon: '🥚', time: 'EVENING',   cal: 490, completed: false, skipped: false },
  ],
  1: [
    { id: 4,  name: 'Sel Roti & Tea',     icon: '🍩', time: 'MORNING',   cal: 380, completed: false, skipped: false },
    { id: 5,  name: 'Daal Bhat Set',      icon: '🍛', time: 'AFTERNOON', cal: 650, completed: false, skipped: false },
    { id: 6,  name: 'Thukpa Soup',        icon: '🍜', time: 'EVENING',   cal: 420, completed: false, skipped: false },
  ],
  2: [
    { id: 7,  name: 'Poha & Milk',        icon: '🥣', time: 'MORNING',   cal: 320, completed: false, skipped: false },
    { id: 8,  name: 'Chicken Chowmein',   icon: '🍝', time: 'AFTERNOON', cal: 580, completed: false, skipped: false },
    { id: 9,  name: 'Daal Bhat Set',      icon: '🍛', time: 'EVENING',   cal: 650, completed: false, skipped: false },
  ],
  3: [
    { id: 10, name: 'Daal Bhat Set',      icon: '🍛', time: 'MORNING',   cal: 650, completed: true,  skipped: false },
    { id: 11, name: 'Sel Roti & Tea',     icon: '🍩', time: 'AFTERNOON', cal: 380, completed: true,  skipped: false },
    { id: 12, name: 'Thukpa Soup',        icon: '🍜', time: 'EVENING',   cal: 420, completed: true,  skipped: false },
  ],
  4: [
    { id: 13, name: 'Chiura & Egg Curry', icon: '🥚', time: 'MORNING',   cal: 490, completed: true,  skipped: false },
    { id: 14, name: 'Buff Momo (10 pcs)', icon: '🥟', time: 'AFTERNOON', cal: 450, completed: false, skipped: true  },
    { id: 15, name: 'Daal Bhat Set',      icon: '🍛', time: 'EVENING',   cal: 650, completed: true,  skipped: false },
  ],
  5: [
    { id: 16, name: 'Poha & Milk',        icon: '🥣', time: 'MORNING',   cal: 320, completed: false, skipped: true  },
    { id: 17, name: 'Daal Bhat Set',      icon: '🍛', time: 'AFTERNOON', cal: 650, completed: true,  skipped: false },
    { id: 18, name: 'Chicken Chowmein',   icon: '🍝', time: 'EVENING',   cal: 580, completed: false, skipped: true  },
  ],
  6: [
    { id: 19, name: 'Daal Bhat Set',      icon: '🍛', time: 'MORNING',   cal: 650, completed: true,  skipped: false },
    { id: 20, name: 'Buff Momo (10 pcs)', icon: '🥟', time: 'AFTERNOON', cal: 450, completed: true,  skipped: false },
    { id: 21, name: 'Chiura & Egg Curry', icon: '🥚', time: 'EVENING',   cal: 490, completed: true,  skipped: false },
  ],
};

export const INITIAL_DAY_LOGS: DayLogs = {
  0: [
    { name: 'Daal Bhat',        emoji: '🍛', cal: 650, prot: 28, carbs: 95, fat: 18, time: '8:30 AM' },
    { name: 'Burger w/ Cheese', emoji: '🍔', cal: 500, prot: 24, carbs: 45, fat: 28, time: '1:00 PM' },
  ],
  3: [
    { name: 'Daal Bhat', emoji: '🍛', cal: 650, prot: 28, carbs: 95, fat: 18, time: '8:00 AM'  },
    { name: 'Sel Roti',  emoji: '🍩', cal: 360, prot:  6, carbs: 72, fat:  8, time: '12:30 PM' },
    { name: 'Thukpa',    emoji: '🍜', cal: 410, prot: 18, carbs: 62, fat: 12, time: '7:00 PM'  },
  ],
  4: [
    { name: 'Chiura Egg', emoji: '🥚', cal: 480, prot: 22, carbs: 58, fat: 16, time: '8:00 AM'  },
    { name: 'Daal Bhat',  emoji: '🍛', cal: 650, prot: 28, carbs: 95, fat: 18, time: '7:30 PM'  },
  ],
  5: [
    { name: 'Daal Bhat', emoji: '🍛', cal: 650, prot: 28, carbs: 95, fat: 18, time: '1:00 PM' },
  ],
  6: [
    { name: 'Daal Bhat',  emoji: '🍛', cal: 650, prot: 28, carbs: 95, fat: 18, time: '8:30 AM' },
    { name: 'Buff Momo',  emoji: '🥟', cal: 440, prot: 26, carbs: 48, fat: 16, time: '1:00 PM' },
    { name: 'Chiura Egg', emoji: '🥚', cal: 480, prot: 22, carbs: 58, fat: 16, time: '7:00 PM' },
  ],
};

export const WEEK_HISTORY_DATA: ChartDataPoint[] = [
  { day: 'Mon', goalAdherence: 88,  planAdherence: 100, cals: 1420 },
  { day: 'Tue', goalAdherence: 95,  planAdherence: 100, cals: 1510 },
  { day: 'Wed', goalAdherence: 92,  planAdherence: 100, cals: 1460 },
  { day: 'Thu', goalAdherence: 72,  planAdherence:  67, cals: 1150 },
  { day: 'Fri', goalAdherence: 41,  planAdherence:  33, cals:  650 },
  { day: 'Sat', goalAdherence: 99,  planAdherence: 100, cals: 1570 },
  { day: 'Sun', goalAdherence: 72,  planAdherence:  33, cals: 1150 },
];

export const MONTH_HISTORY_DATA: ChartDataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  day: `Apr ${i + 1}`,
  goalAdherence: [88,72,95,60,85,78,99,41,92,65,88,74,91,55,83,79,96,68,87,73,94,62,89,77,98,44,90,71,86,75][i],
  planAdherence: [100,67,100,50,100,80,100,33,100,60,100,70,100,50,90,80,100,60,100,70,100,55,95,75,100,40,95,65,90,70][i],
  cals:          [1420,1150,1510,990,1360,1240,1570,650,1460,1040,1420,1180,1490,870,1340,1260,1580,1080,1400,1170,1520,1020,1450,1230,1590,730,1470,1140,1380,1200][i],
}));

export const HISTORY_RECORDS: HistoryRecord[] = [
  { date: 'Sat, Apr 5', dayIdx: 6, goalAdh: 99, planAdh: 100, cals: 1570, prot:  76, carbs: 213, fat: 50 },
  { date: 'Fri, Apr 4', dayIdx: 5, goalAdh: 41, planAdh:  33, cals:  650, prot:  28, carbs:  95, fat: 18 },
  { date: 'Thu, Apr 3', dayIdx: 4, goalAdh: 72, planAdh:  67, cals: 1130, prot:  50, carbs: 153, fat: 34 },
  { date: 'Wed, Apr 2', dayIdx: 3, goalAdh: 92, planAdh: 100, cals: 1460, prot:  74, carbs: 229, fat: 38 },
];
