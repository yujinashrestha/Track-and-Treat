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
    BicepsFlexed,
    Zap
} from "lucide-react";

import type { PhysicalMetrics } from '../../lib/algorithms/nutrition-logic';
import { calculateTDEE, calculateMacros, calculateBMI, getWeightCategory } from '../../lib/algorithms/nutrition-logic';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProfileSetup() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        age: '',
        gender: 'male',
        weight: '',
        height: '',
        goal: 'maintain',
        activityLevel: 'moderate',
    });

    const [isCalculating, setIsCalculating] = useState(false);
    const [analysisStage, setAnalysisStage] = useState(1);
    const [weightCategory, setWeightCategory] = useState({ label: "", color: "" });

    const updateFields = (fields: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...fields }));
    };

    const steps = [
        <BasicInfo key="basic" {...formData} updateFields={updateFields} />,
        <PhysicalMetrics key="metrics" {...formData} updateFields={updateFields} />,
        <GoalSelection key="goals" {...formData} weightCategory={weightCategory} updateFields={updateFields} />,
        <ResultsSummary key="results" {...formData} />
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

        // After Step 2 (Physical Metrics), set the weight category for Step 3 reference
        if (currentStepIndex === 1) {
            const bmi = calculateBMI(parseFloat(formData.weight) || 70, parseFloat(formData.height) || 170);
            setWeightCategory(getWeightCategory(bmi));
            next();
            return;
        }

        // After Step 3 (Goal Selection), show calculation loading for targets
        if (currentStepIndex === 2) {
            setIsCalculating(true);
            setAnalysisStage(1);
            
            // Sequential Calculation steps
            await new Promise(r => setTimeout(r, 600));
            setAnalysisStage(2); // "Applying Mifflin-St Jeor"
            
            await new Promise(r => setTimeout(r, 800));
            setAnalysisStage(3); // "Finalizing"
            
            await new Promise(r => setTimeout(r, 600));
            setIsCalculating(false);
            next();
            return;
        }

        if (!isLastStep) {
            next();
            return;
        }

        setLoading(true);
        setTimeout(() => {
            const metrics: PhysicalMetrics = {
                age: parseInt(formData.age) || 25,
                gender: formData.gender,
                weight: parseFloat(formData.weight) || 70,
                height: parseFloat(formData.height) || 170,
                activityLevel: formData.activityLevel as any,
                goal: formData.goal as any,
            };
            const dailyCals = calculateTDEE(metrics);
            localStorage.setItem('userMetrics', JSON.stringify(metrics));
            localStorage.setItem('dailyCals', dailyCals.toString());
            localStorage.setItem('auth', 'real-token');
            router.push('/dashboard');
        }, 1000);
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

                {/* Main Card */}
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
                                    <p className={`text-sm font-black uppercase tracking-widest transition-all duration-300 ${analysisStage >= 1 ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        {analysisStage === 1 && "• Aligning Biometrics..."}
                                        {analysisStage === 2 && "• Applying Mifflin-St Jeor..."}
                                        {analysisStage === 3 && "• Finalizing Metabolic Goals..."}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{weightCategory.label} Verified</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Header */}
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">
                                {currentStepIndex === 3 ? "Analysis Complete ✨" : `Step ${currentStepIndex + 1} of ${steps.length}`}
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

                    <form onSubmit={handleSubmit}>
                        <div className="min-h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeStep}
                        </div>

                        <div className="flex gap-4 mt-12 pt-8 border-t border-slate-50">
                            {!isFirstStep && currentStepIndex !== 3 && (
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
                                className={`flex-2 py-5 px-8 rounded-2xl ${currentStepIndex === 3 ? 'bg-emerald-900' : 'bg-emerald-600'} text-white font-black shadow-xl shadow-emerald-900/10 hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50`}
                            >
                                {loading ? 'Finalizing Profile...' : isLastStep ? 'Start My Journey →' : 'Next Step'}
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

function ResultsSummary({ weight, height, age, gender, activityLevel, goal }: any) {
    const metrics: PhysicalMetrics = {
        age: parseInt(age) || 25,
        gender: gender || 'male',
        weight: parseFloat(weight) || 70,
        height: parseFloat(height) || 170,
        activityLevel: activityLevel as any || 'moderate',
        goal: goal as any || 'maintain',
    };

    const tdee = calculateTDEE(metrics);
    const macros = calculateMacros(tdee, goal);
    const bmi = calculateBMI(metrics.weight, metrics.height);
    const category = getWeightCategory(bmi);

    return (
        <div className="space-y-8">
            <div className="text-center space-y-2">
              
                <h2 className="text-3xl font-black text-slate-900">Your Adaptive Plan</h2>
                <p className="text-slate-500 font-semibold italic">Targets generated using Behavioral Nutrient Computation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calories Card */}
                <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-900/10">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Daily Calorie Target</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black">{tdee}</span>
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

function BasicInfo({ username, fullName, age, gender, updateFields }: any) {
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
                <div className="grid grid-cols-2 gap-4 mb-2">
                    {[
                        { id: 'male', label: 'Male' },
                        { id: 'female', label: 'Female' }
                    ].map((g) => (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => updateFields({ gender: g.id })}
                            className={`py-4 rounded-2xl border-2 font-black transition-all active:scale-95 cursor-pointer ${
                                gender === g.id 
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-900/10' 
                                : 'bg-slate-50 border-transparent text-slate-400 hover:border-emerald-200'
                            }`}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
                
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

function GoalSelection({ goal, weightCategory, updateFields }: any) {
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
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Main Goal</h2>
                            <p className="text-slate-500 font-medium">What do you want to achieve?</p>
                        </div>
                        {weightCategory.label && (
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
