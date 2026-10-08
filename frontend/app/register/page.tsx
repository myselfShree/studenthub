'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation functions
  const validateUsername = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Username is required.';
    if (trimmed.length < 2) return 'Username must be at least 2 characters long.';
    if (trimmed.length > 30) return 'Username cannot exceed 30 characters.';
    if (!/^[A-Za-z]+$/.test(trimmed)) {
      if (/\d/.test(trimmed)) return 'Username must contain alphabets only. Numbers are not allowed.';
      if (/\s/.test(trimmed)) return 'Username must contain alphabets only. Spaces are not allowed.';
      return 'Username must contain alphabets only. Special characters are not allowed.';
    }
    return null;
  };

  const validatePassword = (val: string): string | null => {
    if (val.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(val)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(val)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(val)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/`~;']/.test(val)) {
      return 'Password must contain at least one special character.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Validate username
    const usernameError = validateUsername(name);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    // 2. Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 3. Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Please sign in below.');
      } else {
        setError(msg || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary,#11120D)] flex items-center justify-center px-4 py-12 transition-colors">
      <div className="w-full max-w-sm">

        {/* Brand header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <span className="text-[var(--color-text-primary,#FFFBF4)] text-2xl font-bold tracking-tight font-display">
              Student Hub
            </span>
          </Link>
          <p className="mt-1 text-sm text-[var(--color-text-muted,#8D8777)]">Create your academic account</p>
        </div>

        <div className="bg-[var(--color-bg-surface,#1C1C17)] rounded-2xl border border-[var(--color-border,#36362F)] p-6 sm:p-8 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-[rgba(199,106,94,0.12)] border border-[rgba(199,106,94,0.3)] text-[#C76A5E] text-xs leading-relaxed animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username / Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider">
                  Username
                </label>
                <span className="text-[10px] text-[var(--color-text-muted,#8D8777)]">Letters only (2-30)</span>
              </div>
              <input
                type="text"
                autoComplete="username"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Shrikant"
                className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5
                           text-[var(--color-text-primary,#FFFBF4)] text-xs placeholder:text-[var(--color-text-muted,#57564F)]
                           focus:outline-none focus:border-[#8E9B7A] transition-colors"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="shree@university.edu"
                className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5
                           text-[var(--color-text-primary,#FFFBF4)] text-xs placeholder:text-[var(--color-text-muted,#57564F)]
                           focus:outline-none focus:border-[#8E9B7A] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[10px] text-[var(--color-text-muted,#8D8777)]">Min. 8 chars</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. Shree@123"
                  className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5 pr-10
                             text-[var(--color-text-primary,#FFFBF4)] text-xs placeholder:text-[var(--color-text-muted,#57564F)]
                             focus:outline-none focus:border-[#8E9B7A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted,#57564F)] hover:text-[var(--color-text-secondary,#8D8777)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted,#8D8777)] leading-tight pt-0.5">
                Must include uppercase, lowercase, number, and special character.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Re-enter your password"
                  className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5 pr-10
                             text-[var(--color-text-primary,#FFFBF4)] text-xs placeholder:text-[var(--color-text-muted,#57564F)]
                             focus:outline-none focus:border-[#8E9B7A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted,#57564F)] hover:text-[var(--color-text-secondary,#8D8777)] transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-3
                         bg-[var(--color-text-primary,#FFFBF4)] hover:bg-[#D8CFBC] text-[var(--color-bg-primary,#11120D)]
                         text-xs font-semibold rounded-lg py-2.5
                         border border-[var(--color-text-primary,#FFFBF4)] hover:border-[#D8CFBC]
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-muted,#57564F)] pt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-[#8E9B7A] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
