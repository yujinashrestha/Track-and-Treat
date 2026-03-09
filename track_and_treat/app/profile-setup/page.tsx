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
    Dumbbell,
    Utensils,
    BicepsFlexed
} from "lucide-react";

export default function ProfileSetup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        age: '',
        gender: '',
        weight: '',
        height: '',
        goal: '',
        activityLevel: '',
    });

    const updateFields = (fields: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    const steps = [
        <BasicInfo key="basic" {...formData} updateFields={updateFields} />,
        <PhysicalMetrics key="metrics" {...formData} updateFields={updateFields} />,
        <GoalSelection key="goals" {...formData} updateFields={updateFields} />,
    ];

    const {
        currentStepIndex,
        step: activeStep,
        isFirstStep,
        isLastStep,
        back,
        next
    } = useMultistepForm(steps);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLastStep) return next();

        setLoading(true);
        setTimeout(() => {
            console.log('Final Data:', formData);
            localStorage.setItem('auth', 'real-token');
            router.push('/dashboard');
        }, 1000);
    };

    const progressValue = ((currentStepIndex + 1) / steps.length) * 100;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-80 bg-linear-to-b from-emerald-100/30 to-transparent pointer-events-none"></div>

            <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/[0.03] border border-slate-100 p-8 md:p-12 relative z-10">
                {/* Progress Header */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            Step {currentStepIndex + 1} of {steps.length}
                        </span>
                        <div className="flex gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'bg-emerald-500 scale-125' : 'bg-slate-200'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="min-h-[340px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeStep}
                    </div>

                    <div className="flex gap-4 mt-12 pt-8 border-t border-slate-50">
                        {!isFirstStep && (
                            <button
                                type="button"
                                onClick={back}
                                className="flex-1 py-4 px-6 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-2 py-4 px-6 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            {loading ? 'Finalizing...' : isLastStep ? 'Complete ✨' : 'Continue'}
                            {!loading && (isLastStep ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function BasicInfo({ username, fullName, age, updateFields }: any) {
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
                <input
                    required
                    type="text"
                    value={fullName}
                    onChange={e => updateFields({ fullName: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-hidden transition-all font-medium"
                    placeholder="Full Name"
                />
                <input
                    required
                    type="text"
                    value={username}
                    onChange={e => updateFields({ username: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-hidden transition-all font-medium"
                    placeholder="Username"
                />
                <input
                    required
                    type="number"
                    value={age}
                    min={0}
                    onChange={e => updateFields({ age: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 outline-hidden transition-all font-medium"
                    placeholder="Age"
                />
            </div>
        </div>
    );
}

function PhysicalMetrics({ weight, height, activityLevel, updateFields }: any) {
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
                <input
                    required
                    type="number"
                    value={weight}
                    min={0}
                    onChange={e => updateFields({ weight: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-lime-500 outline-hidden transition-all font-medium"
                    placeholder="Weight (kg)"
                />
                <input
                    required
                    type="number"
                    value={height}
                    min={0}
                    onChange={e => updateFields({ height: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-lime-500 outline-hidden transition-all font-medium"
                    placeholder="Height (cm)"
                />
            </div>

            <select
                required
                value={activityLevel}
                onChange={e => updateFields({ activityLevel: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-lime-500 outline-hidden transition-all font-medium appearance-none"
            >
                <option value="">Select Activity Level...</option>
                <option value="sedentary">Sedentary</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="extra_active">Extra Active</option>
            </select>
        </div>
    );
}

function GoalSelection({ goal, updateFields }: any) {
    const goals = [
        { id: 'lose', label: 'Lose Weight', icon: <Utensils className="w-6 h-6" />, desc: 'Calorie deficit focus' },
        { id: 'maintain', label: 'Maintain', icon: <Scale className="w-6 h-6" />, desc: 'Weight management' },
        { id: 'gain', label: 'Gain Muscle', icon: <BicepsFlexed className="w-6 h-6" />, desc: 'Focus on growth' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                    <Target className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Main Goal</h2>
                    <p className="text-slate-500 font-medium">What do you want to achieve?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {goals.map((g) => (
                    <button
                        key={g.id}
                        type="button"
                        onClick={() => updateFields({ goal: g.id })}
                        className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-5 text-left active:scale-[0.98] ${goal === g.id
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                                : 'bg-white border-slate-100 hover:border-emerald-200'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${goal === g.id ? 'bg-white/20' : 'bg-slate-50 text-emerald-600'
                            }`}>
                            {g.icon}
                        </div>
                        <div>
                            <p className="font-black text-lg leading-tight">{g.label}</p>
                            <p className={`text-sm ${goal === g.id ? 'text-emerald-100' : 'text-slate-400'}`}>{g.desc}</p>
                        </div>
                        {goal === g.id && <CheckCircle2 className="ml-auto w-6 h-6" />}
                    </button>
                ))}
            </div>
        </div>
    );
}
