'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '../../lib/context/AppContext';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAppContext();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login('token', identifier);
    }, 1000);
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
      </div>
    </div>
  );
}