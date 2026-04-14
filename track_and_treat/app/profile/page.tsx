'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Save, User, Activity, Target, Heart, Droplets,
  Wallet, CheckCircle2, AlertTriangle, X, Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AppNav } from '@/components/app-nav';
import { getProfile, updateProfile, getStats, ApiError, type Profile, type ProfileData, type UserStats } from '@/lib/api';
import { COUNTRIES, getCurrencySymbol } from '@/lib/countries';

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
  extra_active: 'Extra Active',
};

const LIFESTYLE_LABELS: Record<string, string> = {
  none: 'No Preference',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  pescatarian: 'Pescatarian',
  keto: 'Keto',
  paleo: 'Paleo',
};

const GOAL_LABELS: Record<string, string> = {
  lose: 'Lose Weight',
  maintain: 'Maintain',
  gain: 'Gain Muscle',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<UserStats | null>(null);

  const [form, setForm] = useState({
    region: '',
    birthDate: '',
    biologicalSex: '',
    heightCm: '',
    currentWeight: '',
    activityLevel: '',
    dietaryGoal: 'maintain',
    dietaryLifestyle: 'none',
    mealsPerDay: '3',
    budgetPerDay: '',
    dailyWaterTarget: '2500',
    allergies: [] as string[],
    restrictions: [] as string[],
    dislikes: [] as string[],
  });

  const loadProfile = useCallback(async () => {
    try {
      const [profile, userStats] = await Promise.all([
        getProfile(),
        getStats(),
      ]);
      setStats(userStats);
      setForm({
        region: profile.region || '',
        birthDate: profile.birthDate ? String(profile.birthDate).split('T')[0] : '',
        biologicalSex: profile.biologicalSex || '',
        heightCm: profile.heightCm ? String(profile.heightCm) : '',
        currentWeight: profile.currentWeight ? String(profile.currentWeight) : '',
        activityLevel: profile.activityLevel || '',
        dietaryGoal: profile.dietaryGoal || 'maintain',
        dietaryLifestyle: profile.dietaryLifestyle || 'none',
        mealsPerDay: String(profile.mealsPerDay || 3),
        budgetPerDay: profile.budgetPerDay ? String(profile.budgetPerDay) : '',
        dailyWaterTarget: String(profile.dailyWaterTarget || 2500),
        allergies: profile.allergies || [],
        restrictions: profile.restrictions || [],
        dislikes: profile.dislikes || [],
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // No profile yet — leave form empty
      } else {
        setError('Failed to load profile.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    loadProfile();
  }, [authLoading, isAuthenticated, router, loadProfile]);

  const update = (fields: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...fields }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: ProfileData = {};
      if (form.region) payload.region = form.region;
      if (form.birthDate) payload.birthDate = form.birthDate;
      if (form.biologicalSex) payload.biologicalSex = form.biologicalSex as ProfileData['biologicalSex'];
      if (form.heightCm) payload.heightCm = parseFloat(form.heightCm);
      if (form.currentWeight) payload.currentWeight = parseFloat(form.currentWeight);
      if (form.activityLevel) payload.activityLevel = form.activityLevel as ProfileData['activityLevel'];
      if (form.dietaryGoal) payload.dietaryGoal = form.dietaryGoal as ProfileData['dietaryGoal'];
      if (form.dietaryLifestyle) payload.dietaryLifestyle = form.dietaryLifestyle as ProfileData['dietaryLifestyle'];
      payload.mealsPerDay = parseInt(form.mealsPerDay) || 3;
      if (form.budgetPerDay) payload.budgetPerDay = parseFloat(form.budgetPerDay);
      if (form.dailyWaterTarget) payload.dailyWaterTarget = parseFloat(form.dailyWaterTarget);
      if (form.allergies.length) payload.allergies = form.allergies;
      if (form.restrictions.length) payload.restrictions = form.restrictions;
      if (form.dislikes.length) payload.dislikes = form.dislikes;

      await updateProfile(payload);
      const newStats = await getStats();
      setStats(newStats);
      setSuccess('Profile saved! Targets recalculated.');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap'); * { font-family: 'Space Grotesk', sans-serif; }`}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Profile</h1>
              <p className="text-slate-500 font-medium text-sm">Manage your account and preferences</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </motion.div>
        )}

        {/* Account Info (read-only) */}
        <Section icon={<User className="w-5 h-5 text-emerald-600" />} title="Account">
          <div className="grid grid-cols-2 gap-4">
            <ReadOnlyField label="Username" value={user?.username || '-'} />
            <ReadOnlyField label="Email" value={user?.email || '-'} />
          </div>
        </Section>

        {/* Computed Stats (read-only) */}
        {stats && stats.bmr && (
          <Section icon={<Activity className="w-5 h-5 text-orange-600" />} title="Computed Targets">
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="BMR" value={`${stats.bmr}`} unit="kcal" />
              <StatCard label="TDEE" value={`${stats.tdee}`} unit="kcal" />
              <StatCard label="Target" value={`${stats.targetCalories ? Math.round(stats.targetCalories) : '-'}`} unit="kcal" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">Auto-calculated from your profile. Changes update on save.</p>
          </Section>
        )}

        {/* Basic Info */}
        <Section icon={<User className="w-5 h-5 text-sky-600" />} title="Basic Info">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth</Label>
              <input type="date" value={form.birthDate} onChange={e => update({ birthDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <Label>Country</Label>
              <select value={form.region} onChange={e => update({ region: e.target.value })} className="input-field appearance-none">
                <option value="">Select country...</option>
                {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Biological Sex</Label>
            <div className="grid grid-cols-3 gap-2">
              {['male', 'female', 'other'].map(s => (
                <button key={s} type="button" onClick={() => update({ biologicalSex: s })}
                  className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer capitalize ${form.biologicalSex === s ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >{s}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Physical */}
        <Section icon={<Activity className="w-5 h-5 text-lime-600" />} title="Physical Metrics">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Height (cm)</Label>
              <input type="number" value={form.heightCm} min={50} max={300} step="0.1" onChange={e => update({ heightCm: e.target.value })} placeholder="170" className="input-field" />
            </div>
            <div>
              <Label>Current Weight (kg)</Label>
              <input type="number" value={form.currentWeight} min={20} max={500} step="0.1" onChange={e => update({ currentWeight: e.target.value })} placeholder="70" className="input-field" />
            </div>
          </div>
          <div className="mt-4">
            <Label>Activity Level</Label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(ACTIVITY_LABELS).map(([id, label]) => (
                <button key={id} type="button" onClick={() => update({ activityLevel: id })}
                  className={`p-3 rounded-xl border-2 text-left font-bold text-sm transition-all active:scale-[0.98] cursor-pointer ${form.activityLevel === id ? 'bg-lime-600 border-lime-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-600 hover:border-lime-200'}`}
                >{label}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Goals & Lifestyle */}
        <Section icon={<Target className="w-5 h-5 text-orange-600" />} title="Goals & Lifestyle">
          <div>
            <Label>Dietary Goal</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(GOAL_LABELS).map(([id, label]) => (
                <button key={id} type="button" onClick={() => update({ dietaryGoal: id })}
                  className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer ${form.dietaryGoal === id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >{label}</button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Label>Dietary Lifestyle</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(LIFESTYLE_LABELS).map(([id, label]) => (
                <button key={id} type="button" onClick={() => update({ dietaryLifestyle: id })}
                  className={`py-3 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer ${form.dietaryLifestyle === id ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                >{label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <Label>Meals / Day</Label>
              <select value={form.mealsPerDay} onChange={e => update({ mealsPerDay: e.target.value })} className="input-field appearance-none">
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <Label>Daily Budget{form.region && getCurrencySymbol(form.region) ? ` (${getCurrencySymbol(form.region)})` : ''}</Label>
              <div className="relative">
                {form.region && getCurrencySymbol(form.region) && (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{getCurrencySymbol(form.region)}</span>
                )}
                <input type="number" value={form.budgetPerDay} min={0} step="0.01" onChange={e => update({ budgetPerDay: e.target.value })} placeholder="Optional"
                  className={`input-field ${form.region && getCurrencySymbol(form.region) ? 'pl-10' : ''}`} />
              </div>
            </div>
            <div>
              <Label>Water Target (ml)</Label>
              <input type="number" value={form.dailyWaterTarget} min={500} max={10000} step="100" onChange={e => update({ dailyWaterTarget: e.target.value })} className="input-field" />
            </div>
          </div>
        </Section>

        {/* Dietary Preferences */}
        <Section icon={<Heart className="w-5 h-5 text-rose-600" />} title="Dietary Preferences">
          <TagEditor label="Allergies" tags={form.allergies} onChange={v => update({ allergies: v })} color="red" />
          <TagEditor label="Restrictions" tags={form.restrictions} onChange={v => update({ restrictions: v })} color="amber" />
          <TagEditor label="Dislikes" tags={form.dislikes} onChange={v => update({ dislikes: v })} color="slate" />
        </Section>

        {/* Danger Zone */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
          <button onClick={() => { logout().then(() => router.push('/login')); }}
            className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-all cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>

      <div className="sm:hidden pb-20"><AppNav /></div>
    </div>
  );
}

// ─── Shared components ───

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">{icon} {title}</h3>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700 mb-1.5">{children}</label>;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="px-4 py-3 bg-slate-50 rounded-xl text-slate-700 font-bold text-sm">{value}</div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 text-center">
      <p className="text-2xl font-black text-slate-900">{value}<span className="text-xs text-slate-400 ml-1">{unit}</span></p>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function TagEditor({ label, tags, onChange, color }: { label: string; tags: string[]; onChange: (t: string[]) => void; color: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };
  return (
    <div className="mt-4">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden transition-all font-medium text-sm"
        />
        <button type="button" onClick={add} className="px-4 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all cursor-pointer">
          <Plus className="w-4 h-4 text-slate-600" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <span key={tag} className={`inline-flex items-center gap-1 px-3 py-1 bg-${color}-50 text-${color}-700 rounded-full text-xs font-bold`}>
              {tag}
              <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-red-600 cursor-pointer"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
