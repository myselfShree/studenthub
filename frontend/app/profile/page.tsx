'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Check, AlertCircle, Eye, EyeOff, Loader2, Phone, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // 2FA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phone_number || '');
      setMfaEnabled(Boolean(user.mfa_enabled));
    }
  }, [user]);

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
    if (!val || !val.trim()) return null;
    const cleaned = val.trim().replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
      return 'Please provide a valid 10-15 digit mobile number (e.g. +919876543210).';
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const trimmedName = name.trim();
    const userErr = validateUsername(trimmedName);
    if (userErr) {
      setError(userErr);
      setLoading(false);
      return;
    }

    const phoneErr = validatePhone(phoneNumber);
    if (phoneErr) {
      setError(phoneErr);
      setLoading(false);
      return;
    }

    try {
      const payload: any = {};
      if (trimmedName !== user?.name) payload.name = trimmedName;
      if (email.trim().toLowerCase() !== user?.email.toLowerCase()) payload.email = email.trim().toLowerCase();
      if (phoneNumber.trim() !== (user?.phone_number || '')) payload.phone_number = phoneNumber.trim() || undefined;
      
      if (password) {
        const pwErr = validatePassword(password);
        if (pwErr) {
          setError(pwErr);
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        payload.password = password;
      }

      if (Object.keys(payload).length === 0) {
        setError('No changes to save.');
        setLoading(false);
        return;
      }

      const updated = await api.put('/auth/me', payload);
      if (setUser) setUser(updated);
      setSuccess('Profile updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMFA = async () => {
    setMfaLoading(true);
    setError('');
    setSuccess('');
    try {
      const targetState = !mfaEnabled;
      const updated = await api.toggleMFA({ mfa_enabled: targetState });
      setMfaEnabled(targetState);
      if (setUser) setUser(updated);
      setSuccess(targetState ? 'Two-Factor Authentication (2FA) is now ENABLED.' : 'Two-Factor Authentication has been disabled.');
    } catch (err: any) {
      setError(err.message || 'Failed to update 2FA setting.');
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary,#FFFBF4)] font-display">Profile Settings</h1>
          <p className="text-xs text-[var(--color-text-muted,#8D8777)] mt-1">Manage personal details, mobile contact, and multi-factor security.</p>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="sh-card rounded-xl p-5 sm:p-6 space-y-5 border border-[var(--color-border,#36362F)]">
          <div className="flex items-center gap-4 pb-4 border-b border-[var(--color-border,#36362F)]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--color-bg-elevated,#24241E)] border border-[var(--color-border,#36362F)] flex items-center justify-center">
              <User size={24} strokeWidth={1.5} className="text-[#8E9B7A]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary,#FFFBF4)]">{user?.name}</p>
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-[var(--color-text-muted,#8D8777)]">{user?.email}</span>
                {user?.is_email_verified && (
                  <span className="px-1.5 py-0.5 rounded bg-[#282F24] text-[#8E9B7A] text-[10px] font-semibold flex items-center gap-1">
                    <Check size={10} strokeWidth={2.5} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--color-text-secondary,#D8CFBC)] block">Username</label>
              <span className="text-[10px] text-[var(--color-text-muted,#8D8777)]">Letters only (2-30)</span>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="sh-input text-xs"
              placeholder="e.g. Shrikant"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--color-text-secondary,#D8CFBC)] block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className="sh-input text-xs"
              placeholder="your@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--color-text-secondary,#D8CFBC)] block">Mobile Number (SMS OTP)</label>
              {user?.is_phone_verified && (
                <span className="text-[10px] text-[#8E9B7A] font-medium">Verified for OTP</span>
              )}
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => {
                setPhoneNumber(e.target.value);
                if (error) setError('');
              }}
              className="sh-input text-xs"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="pt-2 border-t border-[var(--color-border,#36362F)] space-y-4">
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary,#D8CFBC)]">Change Password</p>
              <p className="text-[11px] text-[var(--color-text-muted,#8D8777)] mt-0.5">Leave blank to keep your current password.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary,#D8CFBC)] block">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="sh-input text-xs pr-9"
                  placeholder="Min. 8 chars (upper, lower, number, symbol)"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)]"
                >
                  {showNew ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary,#D8CFBC)] block">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="sh-input text-xs pr-9"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)]"
                >
                  {showConfirm ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="sh-alert-danger"><AlertCircle size={14} strokeWidth={1.75} />{error}</div>}
          {success && <div className="sh-alert-success"><Check size={14} strokeWidth={2} />{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="sh-btn-primary w-full py-2.5 text-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        {/* Two-Factor Authentication (2FA) Security Card */}
        <div className="sh-card rounded-xl p-5 sm:p-6 border border-[var(--color-border,#36362F)] space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#282F24] border border-[#8E9B7A]/40 flex items-center justify-center shrink-0 text-[#8E9B7A]">
                <ShieldCheck size={20} strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[var(--color-text-primary,#FFFBF4)] font-display flex items-center gap-2">
                  <span>Two-Factor Authentication (2FA / MFA)</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    mfaEnabled ? 'bg-[#282F24] text-[#8E9B7A] border border-[#8E9B7A]/30' : 'bg-[#11120D] text-[var(--color-text-muted,#8D8777)]'
                  }`}>
                    {mfaEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted,#8D8777)] leading-relaxed">
                  Require a 6-digit numeric OTP code sent to your verified email and mobile every time you log in.
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={handleToggleMFA}
              disabled={mfaLoading}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                mfaEnabled
                  ? 'bg-[rgba(199,106,94,0.15)] text-[#C76A5E] hover:bg-[rgba(199,106,94,0.25)] border border-[rgba(199,106,94,0.3)]'
                  : 'bg-[#8E9B7A] text-[#11120D] hover:bg-[#A1AF8C] shadow-sm'
              }`}
            >
              {mfaLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : mfaEnabled ? (
                'Disable 2FA'
              ) : (
                'Enable 2FA'
              )}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

