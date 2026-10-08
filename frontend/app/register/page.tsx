'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, ShieldCheck, Mail, Phone, ArrowLeft, RefreshCw } from 'lucide-react';

export default function RegisterPage() {
  const { register, setSession } = useAuth();
  
  // Step: 'form' | 'verify_otp'
  const [step, setStep] = useState<'form' | 'verify_otp'>('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP State
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verify_otp' && resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((v) => v - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

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

  const validatePhone = (val: string): string | null => {
    if (!val || !val.trim()) return null; // Optional but recommended
    const cleaned = val.trim().replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
      return 'Please provide a valid 10-15 digit mobile number (e.g. +919876543210 or 9876543210).';
    }
    return null;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 1. Validate username
    const usernameError = validateUsername(name);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    // 2. Validate phone number
    const phoneError = validatePhone(phoneNumber);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    // 3. Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 4. Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, phoneNumber.trim() || undefined);
      setStep('verify_otp');
      setResendCooldown(60);
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailOtp.trim()) {
      setError('Please enter the 6-digit email verification code.');
      return;
    }

    if (phoneNumber && !phoneOtp.trim()) {
      setError('Please enter the 6-digit mobile verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyRegistrationOTP({
        email: email.trim(),
        email_otp: emailOtp.trim(),
        phone_otp: phoneOtp.trim() || undefined,
      });

      if (res.access_token && res.user) {
        setSession(res.access_token, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setResendMessage('');
    setError('');
    try {
      await api.resendOTP({ email: email.trim(), otp_type: 'all' });
      setResendMessage('A new verification code has been dispatched.');
      setResendCooldown(60);
      setTimeout(() => setResendMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
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
          <p className="mt-1 text-sm text-[var(--color-text-muted,#8D8777)]">
            {step === 'verify_otp' ? 'Secure OTP Verification' : 'Create your academic account'}
          </p>
        </div>

        <div className="bg-[var(--color-bg-surface,#1C1C17)] rounded-2xl border border-[var(--color-border,#36362F)] p-6 sm:p-8 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-[rgba(199,106,94,0.12)] border border-[rgba(199,106,94,0.3)] text-[#C76A5E] text-xs leading-relaxed animate-fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          {/* Resend Success Banner */}
          {resendMessage && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#282F24] border border-[#8E9B7A]/40 text-[#8E9B7A] text-xs leading-relaxed animate-fade-in">
              <CheckCircle2 size={15} className="shrink-0" strokeWidth={2} />
              <span>{resendMessage}</span>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 'form' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">

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

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <span className="text-[10px] text-[#8E9B7A]">For SMS OTP</span>
                </div>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="+91 98765 43210"
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
                    <span>Sending verification code…</span>
                  </>
                ) : (
                  'Continue with Verification'
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification Screen */}
          {step === 'verify_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-[#282F24] border border-[#8E9B7A]/40 flex items-center justify-center mx-auto mb-3 text-[#8E9B7A]">
                  <ShieldCheck size={24} strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-[#FFFBF4]">Enter Verification Codes</h3>
                <p className="text-xs text-[#8D8777] mt-1 leading-relaxed">
                  We sent a 6-digit OTP code to <strong className="text-[#D8CFBC]">{email}</strong>
                  {phoneNumber ? <span> and <strong className="text-[#D8CFBC]">{phoneNumber}</strong></span> : ''}.
                </p>
              </div>

              {/* Email OTP Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={13} className="text-[#8E9B7A]" />
                  <span>Email Verification Code (6-digits)</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5
                             text-center text-lg font-mono tracking-widest text-[var(--color-text-primary,#FFFBF4)] placeholder:text-[var(--color-text-muted,#57564F)]
                             focus:outline-none focus:border-[#8E9B7A] transition-colors"
                />
              </div>

              {/* Mobile OTP Input (if phone registered) */}
              {phoneNumber && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)] uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={13} className="text-[#8E9B7A]" />
                    <span>Mobile SMS Code (6-digits)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="654321"
                    className="w-full bg-[var(--color-bg-primary,#11120D)] border border-[var(--color-border,#36362F)] rounded-lg px-3.5 py-2.5
                               text-center text-lg font-mono tracking-widest text-[var(--color-text-primary,#FFFBF4)] placeholder:text-[var(--color-text-muted,#57564F)]
                               focus:outline-none focus:border-[#8E9B7A] transition-colors"
                  />
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-4
                           bg-[#8E9B7A] hover:bg-[#A1AF8C] text-[#11120D]
                           text-xs font-bold rounded-lg py-2.5 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  'Verify & Activate Account'
                )}
              </button>

              {/* Resend and Back Controls */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex items-center gap-1 text-[var(--color-text-muted,#8D8777)] hover:text-[#FFFBF4] transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Change info</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resending}
                  className="flex items-center gap-1 text-[#8E9B7A] hover:underline disabled:opacity-50 disabled:no-underline font-medium"
                >
                  <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                  <span>
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </span>
                </button>
              </div>
            </form>
          )}

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

