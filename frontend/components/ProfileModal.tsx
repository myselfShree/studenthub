'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { X, User as UserIcon, Mail, Lock, Check, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    const payload: { name?: string; email?: string; password?: string } = {};

    if (name.trim() !== user.name) {
      payload.name = name.trim();
    }
    if (email.trim().toLowerCase() !== user.email.toLowerCase()) {
      payload.email = email.trim().toLowerCase();
    }

    if (password) {
      if (password.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
      payload.password = password;
    }

    if (Object.keys(payload).length === 0) {
      setError('No changes were made.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await api.updateProfile(payload);
      if (setUser) {
        setUser(updatedUser);
      }
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-[var(--color-bg-surface,#1C1C17)] border border-[var(--color-border,#36362F)] rounded-xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border,#36362F)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated,#24241E)] border border-[var(--color-border,#36362F)] flex items-center justify-center text-[#8E9B7A]">
              <UserIcon size={16} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary,#FFFBF4)]">Account Settings</h2>
              <p className="text-[11px] text-[var(--color-text-muted,#8D8777)]">Edit personal details and password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)] hover:bg-[var(--color-bg-elevated,#24241E)] transition-colors"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-md bg-[rgba(199,106,94,0.12)] border border-[rgba(199,106,94,0.3)] text-[#C76A5E] flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-md bg-[rgba(142,155,122,0.15)] border border-[rgba(142,155,122,0.4)] text-[#8E9B7A] flex items-center gap-2">
              <Check size={14} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--color-text-secondary,#D8CFBC)] flex items-center gap-1.5">
              <UserIcon size={12} className="text-[#8E9B7A]" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shrikant Yadwad"
              className="sh-input text-xs"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--color-text-secondary,#D8CFBC)] flex items-center gap-1.5">
              <Mail size={12} className="text-[#8E9B7A]" />
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              className="sh-input text-xs"
            />
          </div>

          {/* Divider */}
          <div className="pt-2 border-t border-[var(--color-border,#36362F)] space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-[var(--color-text-secondary,#D8CFBC)]">Change Password</p>
              <p className="text-[10px] text-[var(--color-text-muted,#8D8777)]">Leave empty if you do not want to change your password.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--color-text-secondary,#D8CFBC)] flex items-center gap-1.5">
                <Lock size={12} className="text-[#8E9B7A]" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="sh-input text-xs pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)]"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {password && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--color-text-secondary,#D8CFBC)]">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="sh-input text-xs"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--color-border,#36362F)]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="sh-btn-secondary px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="sh-btn-primary px-4 py-1.5 text-xs gap-1.5"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
