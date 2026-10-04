'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = {};
      if (name !== user?.name) payload.name = name;
      if (email !== user?.email) payload.email = email;
      if (newPassword) {
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
        payload.password = newPassword;
      }
      if (Object.keys(payload).length === 0) { setError('No changes to save.'); setLoading(false); return; }
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

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#FFFBF4] font-display">Profile Settings</h1>
          <p className="text-xs text-[#8D8777] mt-1">Update your name, email address, and password.</p>
        </div>

        <form onSubmit={handleSave} className="sh-card rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-[#36362F]">
            <div className="w-14 h-14 rounded-full bg-[#24241E] border border-[#36362F] flex items-center justify-center">
              <User size={26} strokeWidth={1.5} className="text-[#8E9B7A]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#FFFBF4]">{user?.name}</p>
              <p className="text-xs text-[#8D8777]">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#D8CFBC] block">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="sh-input" placeholder="Your full name" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#D8CFBC] block">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="sh-input" placeholder="your@email.com" />
          </div>

          <div className="pt-2 border-t border-[#36362F] space-y-4">
            <div>
              <p className="text-xs font-semibold text-[#D8CFBC]">Change Password</p>
              <p className="text-[11px] text-[#8D8777] mt-0.5">Leave blank to keep your current password.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D8CFBC] block">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="sh-input pr-9" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D8777] hover:text-[#D8CFBC]">
                  {showNew ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#D8CFBC] block">Confirm New Password</label>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="sh-input pr-9" placeholder="Confirm new password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8D8777] hover:text-[#D8CFBC]">
                  {showConfirm ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="sh-alert-danger"><AlertCircle size={14} strokeWidth={1.75} />{error}</div>}
          {success && <div className="sh-alert-success"><Check size={14} strokeWidth={2} />{success}</div>}

          <button type="submit" disabled={loading} className="sh-btn-primary w-full py-2.5 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
