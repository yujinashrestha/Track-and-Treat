'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, ApiError } from '@/lib/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await register({ email, username, password });
      sessionStorage.setItem('regUsername', res.username);
      router.push('/verify-otp');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-lime-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(5,150,105,0.1)] p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">🥗</span>
          <h2 className="text-3xl font-extrabold mt-4 text-emerald-800">Create Account</h2>
          <p className="text-emerald-600/70 mt-2 font-medium">
            Existing user? <Link href="/login" className="text-emerald-600 hover:underline font-bold">Login</Link>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-4 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-emerald-50/30"
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            pattern="^[a-zA-Z0-9_]+$"
            title="Letters, numbers, and underscores only"
            className="w-full p-4 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-emerald-50/30"
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full p-4 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none bg-emerald-50/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-bold hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Join the Journey →'}
          </button>
        </form>
      </div>
    </div>
  );
}
