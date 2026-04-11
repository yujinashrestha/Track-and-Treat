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

  if (res.status === 401 && accessToken) {
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
}

export interface Profile extends ProfileData {
  id: number;
  userId: number;
  initialWeight: number | null;
  targetCalories: number | null;
  onboardingCompleted: boolean;
}

export interface UserStats {
  bmr: number | null;
  tdee: number | null;
  targetCalories: number | null;
  currentWeight: number | null;
  initialWeight: number | null;
  dietaryGoal: string | null;
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

export { clearTokens };
export default request;
