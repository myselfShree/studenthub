'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function LoginPage() {
  const { login, setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA / MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaOtp, setMfaOtp] = useState('');
  const [mfaMessage, setMfaMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res && res.mfa_required) {
        setMfaRequired(true);
        setMfaToken(res.mfa_token || '');
        setMfaMessage(res.message || 'Two-Factor Authentication is enabled. Please enter the verification code sent to your email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMFA(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaOtp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.verifyLoginMFA({
        mfa_token: mfaToken,
        otp: mfaOtp.trim(),
      });
      if (res.access_token && res.user) {
        setSession(res.access_token, res.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired 2FA code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary,#11120D)] flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80">
            <span className="text-[var(--color-text-primary,#FFFBF4)] text-2xl font-bold tracking-tight font-display">
              Student Hub
            </span>
          </Link>
          <p className="mt-1 text-sm text-[var(--color-text-muted,#8D8777)]">
            {mfaRequired ? 'Two-Factor Security Check' : 'Sign in to continue'}
          </p>
        </div>

        <div className="bg-[var(--color-bg-surface,#1C1C17)] rounded-2xl border border-[var(--color-border,#36362F)] p-8 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-[rgba(199,106,94,0.12)] border border-[rgba(199,106,94,0.3)] text-[#C76A5E] text-xs leading-relaxed animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          {!mfaRequired ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-muted,#8D8777)] uppercase tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-4 py-3
                             text-[var(--color-text-primary,#FFFBF4)] text-sm placeholder:text-[var(--color-text-muted,#57564F)]
                             focus:outline-none focus:border-[#8E9B7A] transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--color-text-muted,#8D8777)] uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-4 py-3 pr-11
                               text-[var(--color-text-primary,#FFFBF4)] text-sm placeholder:text-[var(--color-text-muted,#57564F)]
                               focus:outline-none focus:border-[#8E9B7A] transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-[var(--color-text-muted,#57564F)] hover:text-[#8D8777] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[var(--color-text-muted,#8D8777)] hover:text-[#8E9B7A] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="sh-btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              <p className="text-center text-xs text-[var(--color-text-muted,#57564F)] pt-1">
                No account?{' '}
                <Link href="/register" className="text-[#8E9B7A] hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </form>
          ) : (
            /* 2FA MFA OTP Screen */
            <form onSubmit={handleVerifyMFA} className="space-y-4">
              <div className="text-center pb-1">
                <div className="w-12 h-12 rounded-full bg-[#282F24] border border-[#8E9B7A]/40 flex items-center justify-center mx-auto mb-3 text-[#8E9B7A]">
                  <ShieldCheck size={24} strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-[#FFFBF4]">Two-Factor Authentication</h3>
                <p className="text-xs text-[#8D8777] mt-1 leading-relaxed">
                  {mfaMessage}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={mfaOtp}
                  onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-4 py-3
                             text-center text-xl font-mono tracking-widest text-[var(--color-text-primary,#FFFBF4)] placeholder:text-[var(--color-text-muted,#57564F)]
                             focus:outline-none focus:border-[#8E9B7A] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="sh-btn-sage w-full py-3 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  'Verify & Log In'
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false);
                    setMfaOtp('');
                    setError('');
                  }}
                  className="text-xs text-[var(--color-text-muted,#8D8777)] hover:text-[#FFFBF4] flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Back to login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

