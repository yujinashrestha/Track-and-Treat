'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/context/AppContext';

export default function VerifyOtp() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAppContext();
  const [regUsername, setRegUsername] = useState('');

  useEffect(() => {
    const username = sessionStorage.getItem('regUsername') || '';
    setRegUsername(username);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation of verification logic (Step 3.2 in Backend)
    setTimeout(() => {
      localStorage.setItem('verified', 'true');
      // Login with the registered username
      login('verified-token', regUsername || 'User');
      router.push('/profile-setup');
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
            📧
          </div>
          <h2 className="text-3xl font-black text-emerald-950 mb-2">Check Your Email</h2>
          <p className="text-slate-500 font-medium">We've sent a 6-digit verification code to your inbox. Enter it below to secure your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            className="w-full p-6 bg-slate-50 border-2 border-slate-100 focus:border-emerald-600 rounded-3xl outline-none font-black text-4xl text-center tracking-[0.5em] transition-all placeholder:text-slate-200"
          />
          
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full bg-emerald-600 text-white p-6 rounded-3xl font-black text-xl hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>

          <p className="text-center text-sm font-bold text-slate-400">
            Didn't receive the code? <button type="button" className="text-emerald-600 hover:underline">Resend</button>
          </p>
        </form>
      </div>
    </div>
  );
}