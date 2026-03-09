'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOTP() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!sessionStorage.getItem('regEmail')) router.push('/register');
    }, []); //origin must be register page

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            sessionStorage.setItem('token', 'ephemeral');
            router.push('/profile-setup');
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50 to-lime-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(5,150,105,0.1)] p-8">
                <div className="text-center mb-8">
                    <span className="text-5xl">📧</span>
                    <h2 className="text-3xl font-extrabold mt-4 text-emerald-800">Verify OTP</h2>
                    <p className="text-emerald-600/70 mt-2 font-medium">Check your email for the 6-digit code</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className="w-full p-4 border border-emerald-100 rounded-2xl text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-emerald-50/30 text-emerald-800"
                    />
                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify & Continue →'}
                    </button>
                </form>
            </div>
        </div>
    );
}