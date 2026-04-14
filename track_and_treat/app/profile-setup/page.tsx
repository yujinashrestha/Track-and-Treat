'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultistepForm } from '../../hooks/useMultistepForm';
import { Progress } from "@/components/ui/progress";
import {
    User,
    Target,
    Activity,
    Scale,
    ChevronRight,
    ChevronLeft,
    CheckCircle2,
    BicepsFlexed,
    Utensils,
    Zap,
    Heart,
    UtensilsCrossed,
    Wallet,
    X,
    Plus,
} from "lucide-react";

import { updateProfile, getStats, ApiError } from '@/lib/api';
import type { ProfileData, UserStats } from '@/lib/api';
import { COUNTRIES } from '@/lib/countries';
import { calculateBMI, getWeightCategory } from '../../lib/algorithms/nutrition-logic';
import { AnimatePresence, motion } from 'framer-motion';

interface FormData {
    region: string;
    birthDate: string;
    biologicalSex: 'male' | 'female' | 'other' | '';
    currentWeight: string;
    heightCm: string;
    activityLevel: string;
    dietaryGoal: string;
    dietaryLifestyle: string;
    mealsPerDay: string;
    budgetPerDay: string;
    allergies: string[];
    restrictions: string[];
    dislikes: string[];
}

export default function ProfileSetup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<FormData>({
        region: '',
        birthDate: '',
        biologicalSex: '',
        currentWeight: '',
        heightCm: '',
        activityLevel: '',
        dietaryGoal: 'maintain',
        dietaryLifestyle: 'none',
        mealsPerDay: '3',
        budgetPerDay: '',
        allergies: [],
        restrictions: [],
        dislikes: [],
    });

    const [isCalculating, setIsCalculating] = useState(false);
    const [analysisStage, setAnalysisStage] = useState(1);
    const [weightCategory, setWeightCategory] = useState({ label: "", color: "" });
    const [stats, setStats] = useState<UserStats | null>(null);

    const updateFields = (fields: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    const steps = [
        <BasicInfo key="basic" {...formData} updateFields={updateFields} />,
        <PhysicalMetricsStep key="metrics" {...formData} updateFields={updateFields} />,
        <GoalsAndLifestyle key="goals" {...formData} weightCategory={weightCategory} updateFields={updateFields} />,
        <DietaryPreferences key="prefs" {...formData} updateFields={updateFields} />,
        <ResultsSummary key="results" stats={stats} dietaryGoal={formData.dietaryGoal} />,
    ];

    const {
        currentStepIndex,
        step: activeStep,
        isFirstStep,
        isLastStep,
        back,
        next
    } = useMultistepForm(steps);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // After Physical Metrics step, compute BMI for the Goal step display
        if (currentStepIndex === 1) {
            const bmi = calculateBMI(parseFloat(formData.currentWeight) || 70, parseFloat(formData.heightCm) || 170);
            setWeightCategory(getWeightCategory(bmi));
            next();
            return;
        }

        // After Dietary Preferences (step 3), save to API and show results
        if (currentStepIndex === 3) {
            setIsCalculating(true);
            setAnalysisStage(1);

            try {
                await new Promise(r => setTimeout(r, 500));
                setAnalysisStage(2);

                const payload: ProfileData = {
                    region: formData.region || undefined,
                    birthDate: formData.birthDate || undefined,
                    biologicalSex: formData.biologicalSex as ProfileData['biologicalSex'] || undefined,
                    heightCm: parseFloat(formData.heightCm) || undefined,
                    currentWeight: parseFloat(formData.currentWeight) || undefined,
                    activityLevel: formData.activityLevel as ProfileData['activityLevel'] || undefined,
                    dietaryGoal: formData.dietaryGoal as ProfileData['dietaryGoal'] || undefined,
                    dietaryLifestyle: formData.dietaryLifestyle as ProfileData['dietaryLifestyle'] || undefined,
                    mealsPerDay: parseInt(formData.mealsPerDay) || 3,
                    budgetPerDay: formData.budgetPerDay ? parseFloat(formData.budgetPerDay) : undefined,
                    allergies: formData.allergies.length ? formData.allergies : undefined,
                    restrictions: formData.restrictions.length ? formData.restrictions : undefined,
                    dislikes: formData.dislikes.length ? formData.dislikes : undefined,
                };

                await updateProfile(payload);
                setAnalysisStage(3);

                await new Promise(r => setTimeout(r, 400));
                const fetchedStats = await getStats();
                setStats(fetchedStats);

                setIsCalculating(false);
                next();
            } catch (err) {
                setIsCalculating(false);
                if (err instanceof ApiError) {
                    setError(err.message);
                } else {
                    setError('Failed to save profile. Please try again.');
                }
            }
            return;
        }

        // Final step — go to dashboard
        if (isLastStep) {
            router.push('/dashboard');
            return;
        }

        next();
    };

    const progressValue = ((currentStepIndex + 1) / steps.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;800;900&display=swap');
                * { font-family: 'Space Grotesk', sans-serif; }
            `}</style>

            <div className="absolute top-0 left-0 w-full h-80 bg-linear-to-b from-emerald-100/30 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-2xl flex flex-col gap-8 relative z-10 items-center">

                <div className="w-full bg-white rounded-[3rem] shadow-2xl shadow-emerald-900/5 border border-slate-100 p-8 md:p-16 relative overflow-hidden">

                    {/* Calculation Loading Overlay */}
                    <AnimatePresence>
                        {isCalculating && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center"
                            >
                                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-[2rem] animate-spin" />
                                    <Zap className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Generating Targets...</h3>
                                <div className="space-y-1">
                                    <p className={`text-sm font-black uppercase tracking-widest transition-all duration-300 text-emerald-600`}>
                                        {analysisStage === 1 && "Saving your profile..."}
                                        {analysisStage === 2 && "Applying Mifflin-St Jeor..."}
                                        {analysisStage === 3 && "Finalizing metabolic goals..."}
                                    </p>
                                    {weightCategory.label && (
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{weightCategory.label} Verified</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Header */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">
                                {currentStepIndex === 4 ? "Analysis Complete" : `Step ${currentStepIndex + 1} of ${steps.length}`}
                            </span>
                            <div className="flex gap-2">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'bg-emerald-500 scale-125 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <Progress value={progressValue} className="h-2.5 bg-slate-100" />
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="min-h-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeStep}
                        </div>

                        <div className="flex gap-4 mt-12 pt-8 border-t border-slate-50">
                            {!isFirstStep && currentStepIndex !== 4 && (
                                <button
                                    type="button"
                                    onClick={back}
                                    className="flex-1 py-5 px-8 rounded-2xl border-2 border-slate-100 text-slate-400 font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Back
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading || isCalculating}
                                className={`flex-2 py-5 px-8 rounded-2xl ${currentStepIndex === 4 ? 'bg-emerald-900' : 'bg-emerald-600'} text-white font-black shadow-xl shadow-emerald-900/10 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50`}
                            >
                                {loading ? 'Finalizing Profile...' : isLastStep ? 'Start My Journey' : 'Next Step'}
                                {!loading && (isLastStep ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />)}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest opacity-50">
                    <Zap className="w-4 h-4" />
                    Algorithmic Logic Layer Active
                </div>
            </div>
        </div>
    );
}

// ─── Step 1: Basic Info ───

function BasicInfo({ region, birthDate, biologicalSex, updateFields }: any) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <User className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Tell us about you</h2>
                    <p className="text-slate-500 font-medium">Create your personalized profile</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Biological Sex</label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'male', label: 'Male' },
                            { id: 'female', label: 'Female' },
                            { id: 'other', label: 'Other' },
                        ].map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                onClick={() => updateFields({ biologicalSex: g.id })}
                                className={`py-4 rounded-2xl border-2 font-black transition-all active:scale-95 cursor-pointer ${biologicalSex === g.id
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/10'
                                    : 'bg-slate-50 border-transparent text-slate-400 hover:border-emerald-200'
                                    }`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Date of Birth</label>
                    <input
                        required
                        type="date"
                        value={birthDate}
                        onChange={e => updateFields({ birthDate: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-hidden transition-all font-medium"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Country</label>
                    <select
                        value={region}
                        onChange={e => updateFields({ region: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-hidden transition-all font-medium appearance-none"
                    >
                        <option value="">Select country...</option>
                        {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

// ─── Step 2: Physical Metrics ───

function PhysicalMetricsStep({ currentWeight, heightCm, activityLevel, updateFields }: any) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-lime-50 rounded-2xl flex items-center justify-center">
                    <Activity className="w-7 h-7 text-lime-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Your Stats</h2>
                    <p className="text-slate-500 font-medium">To calculate your daily targets</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Weight (kg)</label>
                    <input
                        required
                        type="number"
                        value={currentWeight}
                        min={20}
                        max={500}
                        step="0.1"
                        onChange={e => updateFields({ currentWeight: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-lime-500 outline-hidden transition-all font-medium"
                        placeholder="70"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Height (cm)</label>
                    <input
                        required
                        type="number"
                        value={heightCm}
                        min={50}
                        max={300}
                        step="0.1"
                        onChange={e => updateFields({ heightCm: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-lime-500 outline-hidden transition-all font-medium"
                        placeholder="170"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Activity Level</label>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
                        { id: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                        { id: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                        { id: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
                        { id: 'extra_active', label: 'Extra Active', desc: 'Very hard exercise or physical job' },
                    ].map((a) => (
                        <button
                            key={a.id}
                            type="button"
                            onClick={() => updateFields({ activityLevel: a.id })}
                            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left active:scale-[0.98] cursor-pointer ${activityLevel === a.id
                                ? 'bg-lime-600 border-lime-600 text-white shadow-md'
                                : 'bg-white border-slate-100 hover:border-lime-200'
                                }`}
                        >
                            <div>
                                <p className="font-black text-sm">{a.label}</p>
                                <p className={`text-xs ${activityLevel === a.id ? 'text-lime-100' : 'text-slate-400'}`}>{a.desc}</p>
                            </div>
                            {activityLevel === a.id && <CheckCircle2 className="ml-auto w-5 h-5 shrink-0" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Step 3: Goals & Lifestyle ───

function GoalsAndLifestyle({ dietaryGoal, dietaryLifestyle, mealsPerDay, budgetPerDay, weightCategory, updateFields }: any) {
    const goals = [
        { id: 'lose', label: 'Lose Weight', icon: <Utensils className="w-6 h-6" />, desc: 'Calorie deficit focus' },
        { id: 'maintain', label: 'Maintain', icon: <Scale className="w-6 h-6" />, desc: 'Weight management' },
        { id: 'gain', label: 'Gain Muscle', icon: <BicepsFlexed className="w-6 h-6" />, desc: 'Focus on growth' },
    ];

    const lifestyles = [
        { id: 'none', label: 'No Preference' },
        { id: 'vegetarian', label: 'Vegetarian' },
        { id: 'vegan', label: 'Vegan' },
        { id: 'pescatarian', label: 'Pescatarian' },
        { id: 'keto', label: 'Keto' },
        { id: 'paleo', label: 'Paleo' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-orange-600" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Goals & Lifestyle</h2>
                            <p className="text-slate-500 font-medium">What do you want to achieve?</p>
                        </div>
                        {weightCategory?.label && (
                            <div className="text-right">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${weightCategory.color}`}>
                                    Status Identified
                                </p>
                                <p className={`text-sm font-black ${weightCategory.color}`}>
                                    {weightCategory.label}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Goal */}
            <div className="grid grid-cols-1 gap-3">
                {goals.map((g) => (
                    <button
                        key={g.id}
                        type="button"
                        onClick={() => updateFields({ dietaryGoal: g.id })}
                        className={`p-5 rounded-3xl border-2 transition-all flex items-center gap-5 text-left active:scale-[0.98] cursor-pointer ${dietaryGoal === g.id
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                            : 'bg-white border-slate-100 hover:border-emerald-200'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dietaryGoal === g.id ? 'bg-white/20' : 'bg-slate-50 text-emerald-600'
                            }`}>
                            {g.icon}
                        </div>
                        <div>
                            <p className="font-black text-lg leading-tight">{g.label}</p>
                            <p className={`text-sm ${dietaryGoal === g.id ? 'text-emerald-100' : 'text-slate-400'}`}>{g.desc}</p>
                        </div>
                        {dietaryGoal === g.id && <CheckCircle2 className="ml-auto w-6 h-6" />}
                    </button>
                ))}
            </div>

            {/* Dietary Lifestyle */}
            <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Dietary Lifestyle</label>
                <div className="grid grid-cols-3 gap-2">
                    {lifestyles.map((l) => (
                        <button
                            key={l.id}
                            type="button"
                            onClick={() => updateFields({ dietaryLifestyle: l.id })}
                            className={`py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 cursor-pointer ${dietaryLifestyle === l.id
                                ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                                : 'bg-slate-50 border-transparent text-slate-500 hover:border-orange-200'
                                }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Meals per day & Budget */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Meals / Day</label>
                    <select
                        value={mealsPerDay}
                        onChange={e => updateFields({ mealsPerDay: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-hidden transition-all font-medium appearance-none"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Daily Budget</label>
                    <input
                        type="number"
                        value={budgetPerDay}
                        min={0}
                        step="0.01"
                        onChange={e => updateFields({ budgetPerDay: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-orange-500 outline-hidden transition-all font-medium"
                        placeholder="Optional"
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Step 4: Dietary Preferences ───

function DietaryPreferences({ allergies, restrictions, dislikes, updateFields }: any) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center">
                    <Heart className="w-7 h-7 text-rose-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Dietary Preferences</h2>
                    <p className="text-slate-500 font-medium">Help us personalize your experience</p>
                </div>
            </div>

            <TagInput
                label="Allergies"
                icon={<UtensilsCrossed className="w-4 h-4 text-red-500" />}
                placeholder="e.g. peanuts, shellfish, dairy..."
                tags={allergies}
                color="red"
                onChange={(val: string[]) => updateFields({ allergies: val })}
            />

            <TagInput
                label="Dietary Restrictions"
                icon={<X className="w-4 h-4 text-amber-500" />}
                placeholder="e.g. gluten-free, halal, no pork..."
                tags={restrictions}
                color="amber"
                onChange={(val: string[]) => updateFields({ restrictions: val })}
            />

            <TagInput
                label="Disliked Foods"
                icon={<UtensilsCrossed className="w-4 h-4 text-slate-500" />}
                placeholder="e.g. broccoli, liver, tofu..."
                tags={dislikes}
                color="slate"
                onChange={(val: string[]) => updateFields({ dislikes: val })}
            />
        </div>
    );
}

function TagInput({ label, icon, placeholder, tags, color, onChange }: {
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    tags: string[];
    color: string;
    onChange: (tags: string[]) => void;
}) {
    const [input, setInput] = useState('');

    const addTag = () => {
        const trimmed = input.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter(t => t !== tag));
    };

    return (
        <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                {icon} {label}
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden transition-all font-medium text-sm"
                />
                <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-3 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4 text-slate-600" />
                </button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                        <span
                            key={tag}
                            className={`inline-flex items-center gap-1 px-3 py-1 bg-${color}-50 text-${color}-700 rounded-full text-xs font-bold`}
                        >
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600 cursor-pointer">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Step 5: Results Summary ───

function ResultsSummary({ stats, dietaryGoal }: { stats: UserStats | null; dietaryGoal: string }) {
    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-[300px] text-slate-400">
                <p className="font-bold">Loading results...</p>
            </div>
        );
    }

    const tdee = stats.tdee ?? 0;
    const targetCalories = stats.targetCalories ?? tdee;
    const bmr = stats.bmr ?? 0;

    // Derive macro split from target calories and goal (same logic as backend-agnostic display)
    const macros = computeMacroSplit(targetCalories, dietaryGoal);

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-900">Your Adaptive Plan</h2>
                <p className="text-slate-500 font-semibold italic">Server-calculated using Mifflin-St Jeor</p>
            </div>

            {/* BMR & TDEE cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">BMR</p>
                    <p className="text-3xl font-black text-slate-900">{bmr}</p>
                    <p className="text-xs text-slate-400 font-bold">kcal/day</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">TDEE</p>
                    <p className="text-3xl font-black text-slate-900">{tdee}</p>
                    <p className="text-xs text-slate-400 font-bold">kcal/day</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Calories */}
                <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-900/10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Daily Calorie Target</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black">{targetCalories}</span>
                        <span className="text-xl font-bold opacity-60">kcal</span>
                    </div>
                </div>

                {/* Macro Distribution */}
                <div className="bg-slate-50 rounded-[2rem] p-8 space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Macro Allocation</h4>
                    <div className="space-y-4">
                        {[
                            { label: 'Protein', value: macros.protein, color: 'bg-emerald-500', bar: '40%' },
                            { label: 'Carbohydrates', value: macros.carbs, color: 'bg-amber-400', bar: '35%' },
                            { label: 'Dietary Fat', value: macros.fat, color: 'bg-orange-500', bar: '25%' },
                        ].map((m, id) => (
                            <div key={id} className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-black text-slate-700">{m.label}</span>
                                    <span className="text-xs font-bold text-slate-400">{m.value}g</span>
                                </div>
                                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: m.bar }}
                                        transition={{ duration: 1, delay: id * 0.2 }}
                                        className={`h-full ${m.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Simple macro distribution for display — same logic as the existing frontend algorithm */
function computeMacroSplit(calories: number, goal: string) {
    let pRatio = 0.3, cRatio = 0.4, fRatio = 0.3;
    if (goal === 'gain') { pRatio = 0.25; cRatio = 0.55; fRatio = 0.2; }
    else if (goal === 'lose') { pRatio = 0.4; cRatio = 0.3; fRatio = 0.3; }
    return {
        protein: Math.round((calories * pRatio) / 4),
        carbs: Math.round((calories * cRatio) / 4),
        fat: Math.round((calories * fRatio) / 9),
    };
}
