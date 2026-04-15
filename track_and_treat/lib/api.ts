const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { body, headers: customHeaders, ...rest } = opts;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders as Record<string, string>,
  };

  const accessToken =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}/${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isAuthEndpoint = path.startsWith('auth/');
  if (res.status === 401 && accessToken && !isAuthEndpoint) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
      const retry = await fetch(`${API_BASE}/${path}`, {
        ...rest,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ message: retry.statusText }));
        throw new ApiError(retry.status, err.message ?? retry.statusText);
      }
      return retry.json();
    }
    // Refresh failed — clear tokens and throw
    clearTokens();
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, err.message ?? res.statusText);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json();
}

async function tryRefreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// --- Auth API ---

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: number; username: string; email: string };
}

export function register(data: { email: string; username: string; password: string }) {
  return request<{ message: string; username: string }>('auth/register', {
    method: 'POST',
    body: data,
  });
}

export function verifyOtp(data: { username: string; code: string }) {
  return request<AuthTokens>('auth/verify-otp', {
    method: 'POST',
    body: data,
  });
}

export function resendOtp(data: { username: string }) {
  return request<{ message: string }>('auth/resend-otp', {
    method: 'POST',
    body: data,
  });
}

export function login(data: { username: string; password: string }) {
  return request<AuthTokens>('auth/login', {
    method: 'POST',
    body: data,
  });
}

export function logout() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.resolve();
  return request<void>('auth/logout', {
    method: 'POST',
    body: { refreshToken },
  }).finally(() => clearTokens());
}

// --- Profile API ---

export interface ProfileData {
  region?: string;
  birthDate?: string;
  biologicalSex?: 'male' | 'female' | 'other';
  heightCm?: number;
  currentWeight?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  dietaryGoal?: 'lose' | 'maintain' | 'gain';
  dietaryLifestyle?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  allergies?: string[];
  restrictions?: string[];
  dislikes?: string[];
  mealsPerDay?: number;
  budgetPerDay?: number;
  dailyWaterTarget?: number;
}

export interface Profile extends ProfileData {
  id: number;
  userId: number;
  initialWeight: number | null;
  targetCalories: number | null;
  dailyWaterTarget: number;
  mealsPerDayAuto: boolean;
  onboardingCompleted: boolean;
}

export interface UserStats {
  bmr: number | null;
  tdee: number | null;
  targetCalories: number | null;
  currentWeight: number | null;
  initialWeight: number | null;
  dietaryGoal: string | null;
  mealsPerDay: number;
  mealsPerDayAuto: boolean;
  onboardingCompleted: boolean;
}

export function getProfile() {
  return request<Profile>('users/me/profile', { method: 'GET' });
}

export function updateProfile(data: ProfileData) {
  return request<Profile>('users/me/profile', {
    method: 'PUT',
    body: data,
  });
}

export function getStats() {
  return request<UserStats>('users/me/stats', { method: 'GET' });
}

// --- Food API ---

export interface FoodItem {
  id: number;
  name: string;
  servingSize: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string | null;
  source: 'system' | 'user';
}

export function searchFood(query: string, limit = 20) {
  return request<FoodItem[]>(`food/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
    method: 'GET',
  });
}

// --- Meal Log API ---

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  id: number;
  userId: number;
  foodItemId: number;
  foodItem: FoodItem;
  quantity: number;
  mealType: MealType;
  source: 'manual' | 'ai_parsed' | 'plan';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  groupId: string | null;
  groupName: string | null;
  loggedAt: string;
  createdAt: string;
}

export interface ParseTextResult {
  logged: MealLog[];
  unresolved: { items: string[]; message: string } | null;
}

export interface DailySummary {
  date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  meals: Record<string, MealLog[]>;
  logCount: number;
}

export type Quadrant = 'ideal' | 'plan_wrong' | 'self_directed' | 'struggling';
export type StrictnessLevel = 'lenient' | 'moderate' | 'strict';
export type PlanMode = 'prescriptive' | 'flexible' | 'suggestive';

export interface DailyProgress {
  date: string;
  target: number;
  consumed: number;
  remaining: number;
  percentage: number;
  macros: { protein: number; carbs: number; fat: number };
  macroTargets: { protein: number; carbs: number; fat: number };
  outcomeScore: number;
  planAdherence: number | null;
  strictness: StrictnessLevel;
  quadrant: Quadrant | null;
  planMode: PlanMode | null;
  pressureScore: number | null;
  plannedMeals: MealPlanItem[] | null;
  meals: Record<string, MealLog[]>;
  logCount: number;
  mealCount: number;
}

export interface AdaptiveProfileData {
  quadrant: Quadrant;
  strictnessLevel: StrictnessLevel;
  planMode: PlanMode;
  pressureScore: number;
  complexityTarget: number;
  simplifyFlag: boolean;
  recalibrateFlag: boolean;
  adherenceScore: number;
  outcomeScore: number;
  weekStreak: number;
  weekNumber: number;
  skippedFoods: number[];
  preferredFoods: number[];
  slotAdherence: Record<string, number>;
  weekStartDate: string;
  computedAt: string;
}

export function parseText(data: { text: string; mealType: MealType; loggedAt?: string }) {
  return request<ParseTextResult>('meal-logs/parse-text', {
    method: 'POST',
    body: data,
  });
}

export function createMealLog(data: { foodItemId: number; quantity: number; mealType: MealType; loggedAt?: string }) {
  return request<MealLog>('meal-logs', {
    method: 'POST',
    body: data,
  });
}

export function getMealLogs(date: string, endDate?: string) {
  let url = `meal-logs?date=${date}`;
  if (endDate) url += `&endDate=${endDate}`;
  return request<MealLog[]>(url, { method: 'GET' });
}

export function getDailySummary(date: string) {
  return request<DailySummary>(`meal-logs/summary?date=${date}`, { method: 'GET' });
}

export function deleteMealLog(id: number) {
  return request<void>(`meal-logs/${id}`, { method: 'DELETE' });
}

export function getDailyProgress(date?: string) {
  const query = date ? `?date=${date}` : '';
  return request<DailyProgress>(`tracking/daily${query}`, { method: 'GET' });
}

// --- Food CRUD ---

export function getCategories() {
  return request<string[]>('food/categories', { method: 'GET' });
}

export function getFoodById(id: number) {
  return request<FoodItem>(`food/${id}`, { method: 'GET' });
}

export function createFood(data: {
  name: string;
  servingSize: string;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  category?: string;
}) {
  return request<FoodItem>('food', { method: 'POST', body: data });
}

// --- Meal Plan API ---

export interface MealPlanItem {
  id: number;
  day: number;
  mealType: string;
  recipeName: string | null;
  prepNotes: string | null;
  foodItemId: number;
  foodItem: FoodItem;
  quantity: number;
  notes: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlan {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  items: MealPlanItem[];
  createdAt: string;
}

export function generateMealPlan(startDate?: string) {
  return request<MealPlan>('meal-plans/generate', {
    method: 'POST',
    body: startDate ? { startDate } : {},
  });
}

export function getActiveMealPlan() {
  return request<MealPlan>('meal-plans/active', { method: 'GET' });
}

export function getMealPlanById(id: number) {
  return request<MealPlan>(`meal-plans/${id}`, { method: 'GET' });
}

export function cancelMealPlan(id: number) {
  return request<MealPlan>(`meal-plans/${id}/cancel`, { method: 'POST' });
}

export function updatePlanItem(planId: number, itemId: number, data: { foodItemId?: number; quantity?: number; notes?: string | null }) {
  return request<MealPlanItem>(`meal-plans/${planId}/items/${itemId}`, { method: 'PUT', body: data });
}

export function deletePlanItem(planId: number, itemId: number) {
  return request<void>(`meal-plans/${planId}/items/${itemId}`, { method: 'DELETE' });
}

export function addPlanItem(planId: number, data: { day: number; mealType: string; foodItemId: number; quantity: number; notes?: string | null }) {
  return request<MealPlanItem>(`meal-plans/${planId}/items`, { method: 'POST', body: data });
}

// --- Tracking: Weekly & Feedback ---

export interface WeeklyDay {
  date: string;
  consumed: number;
  target: number;
  delta: number;
}

export interface WeeklyOverview {
  startDate: string;
  days: WeeklyDay[];
  summary: {
    totalConsumed: number;
    avgDaily: number;
    weeklyTarget: number;
    daysOnTrack: number;
    daysLogged: number;
  };
}

export interface WeeklyFeedback {
  overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  summary: string;
  observations: string[];
  tip: string;
  encouragement: string;
}

export interface WeeklyFeedbackResponse {
  feedback: WeeklyFeedback;
  weeklyOverview: WeeklyOverview;
  adherenceScores?: number[];
}

export function getWeeklyOverview(startDate?: string) {
  const query = startDate ? `?startDate=${startDate}` : '';
  return request<WeeklyOverview>(`tracking/weekly${query}`, { method: 'GET' });
}

export function getAdherence(date: string) {
  return request<any>(`tracking/adherence?date=${date}`, { method: 'GET' });
}

export function getWeeklyFeedback(startDate?: string) {
  const query = startDate ? `?startDate=${startDate}` : '';
  return request<WeeklyFeedbackResponse>(`tracking/feedback${query}`, { method: 'GET' });
}

// --- Water Log API ---

export interface WaterLog {
  id: number;
  userId: number;
  amount: number;
  loggedAt: string;
  createdAt: string;
}

export interface WaterSummary {
  date: string;
  totalMl: number;
  target: number;
  percentage: number;
  logs: WaterLog[];
}

export function createWaterLog(data: { amount: number; loggedAt?: string }) {
  return request<WaterLog>('water-logs', { method: 'POST', body: data });
}

export function getWaterSummary(date?: string) {
  const query = date ? `?date=${date}` : '';
  return request<WaterSummary>(`water-logs/summary${query}`, { method: 'GET' });
}

export function deleteWaterLog(id: number) {
  return request<void>(`water-logs/${id}`, { method: 'DELETE' });
}

// --- Weight Log API ---

export interface WeightLogEntry {
  id: number;
  userId: number;
  weight: number;
  loggedAt: string;
  createdAt: string;
}

export function createWeightLog(data: { weight: number; loggedAt?: string }) {
  return request<WeightLogEntry>('weight-logs', { method: 'POST', body: data });
}

export function getWeightHistory(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const query = params.toString() ? `?${params}` : '';
  return request<WeightLogEntry[]>(`weight-logs${query}`, { method: 'GET' });
}

export function deleteWeightLog(id: number) {
  return request<void>(`weight-logs/${id}`, { method: 'DELETE' });
}

// --- Adaptive Profile API ---

export function computeAdaptiveProfileApi(weekStartDate?: string) {
  const query = weekStartDate ? `?weekStartDate=${weekStartDate}` : '';
  return request<AdaptiveProfileData>(`adaptive/compute${query}`, { method: 'POST' });
}

export function getCurrentAdaptiveProfile() {
  return request<AdaptiveProfileData>('adaptive/current', { method: 'GET' });
}

export function getAdaptiveHistory() {
  return request<AdaptiveProfileData[]>('adaptive/history', { method: 'GET' });
}

export { clearTokens };
export default request;
