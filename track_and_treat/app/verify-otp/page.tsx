'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOtp, resendOtp, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function VerifyOTP() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [username, setUsername] = useState('');
    const router = useRouter();
    const { loginWithTokens } = useAuth();

    useEffect(() => {
        const stored = sessionStorage.getItem('regUsername');
        if (!stored) {
            router.push('/register');
        } else {
            setUsername(stored);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const tokens = await verifyOtp({ username, code: otp });
            loginWithTokens(tokens);
            sessionStorage.removeItem('regUsername');
            router.push('/profile-setup');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Verification failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        setMessage('');

        try {
            await resendOtp({ username });
            setMessage('OTP resent! Check your email.');
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('Failed to resend OTP.');
            }
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50 to-lime-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(5,150,105,0.1)] p-8">
                <div className="text-center mb-8">
                    <span className="text-5xl">📧</span>
                    <h2 className="text-3xl font-extrabold mt-4 text-emerald-800">Verify OTP</h2>
                    <p className="text-emerald-600/70 mt-2 font-medium">Check your email for the 6-digit code</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
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

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full mt-4 text-emerald-600 font-medium text-sm hover:underline disabled:opacity-50"
                >
                    {resending ? 'Resending...' : "Didn't receive the code? Resend"}
                </button>
            </div>
        </div>
    );
}
