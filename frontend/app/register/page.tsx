'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Please sign in below.');
      } else {
        setError(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11120D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand header */}
        <div className="mb-8 text-center">
          <span className="text-[#FFFBF4] text-2xl font-bold tracking-tight">
            Student Hub
          </span>
          <p className="mt-1 text-sm text-[#8D8777]">Create your account</p>
        </div>

        <div className="bg-[#1C1C17] rounded-2xl border border-[#36362F] p-8 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[rgba(199,106,94,0.1)] border border-[rgba(199,106,94,0.25)] text-[#C76A5E] text-sm">
              <AlertCircle size={15} className="shrink-0" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#8D8777] uppercase tracking-widest">
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Sharma"
                className="w-full bg-[#11120D] border border-[#36362F] rounded-lg px-4 py-3
                           text-[#FFFBF4] text-sm placeholder:text-[#57564F]
                           focus:outline-none focus:border-[#8E9B7A] transition-colors"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#8D8777] uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#11120D] border border-[#36362F] rounded-lg px-4 py-3
                           text-[#FFFBF4] text-sm placeholder:text-[#57564F]
                           focus:outline-none focus:border-[#8E9B7A] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#8D8777] uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-[#11120D] border border-[#36362F] rounded-lg px-4 py-3 pr-11
                             text-[#FFFBF4] text-sm placeholder:text-[#57564F]
                             focus:outline-none focus:border-[#8E9B7A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-[#57564F] hover:text-[#8D8777] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-2
                         bg-[#FFFBF4] hover:bg-[#D8CFBC] text-[#11120D]
                         text-sm font-semibold rounded-lg py-3
                         border border-[#FFFBF4] hover:border-[#D8CFBC]
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#57564F]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#8E9B7A] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
