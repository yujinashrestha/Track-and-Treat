'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ApiError, resendOtp } from '@/lib/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.message.toLowerCase();
        if (err.status === 403 || msg.includes('verif') || msg.includes('otp')) {
          setNeedsVerification(true);
          setError('Your account is not verified yet.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    try {
      await resendOtp({ username });
      sessionStorage.setItem('regUsername', username);
      router.push('/verify-otp');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-lime-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(5,150,105,0.1)] p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">🔐</span>
          <h2 className="text-3xl font-extrabold mt-4 text-emerald-800">Welcome Back</h2>
          <p className="text-emerald-600/70 mt-2 font-medium">
            New here? <Link href="/register" className="text-emerald-600 hover:underline font-bold">Sign up</Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-4 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-emerald-50/30"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-4 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-emerald-50/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Enter Dashboard →'}
          </button>
        </form>

        {needsVerification && (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resending}
            className="w-full mt-4 bg-amber-500 text-white p-4 rounded-2xl font-bold hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {resending ? 'Sending OTP...' : 'Verify Account → Resend OTP'}
          </button>
        )}
      </div>
    </div>
  );
}
