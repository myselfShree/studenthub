'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StudentHubLogo from '@/components/StudentHubLogo';
import { Lock, Mail, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11120D] text-[#FFFBF4] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Subtle Warm Radial Glow */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(86,84,73,0.15) 0%, rgba(17,18,13,0.8) 70%, #11120D 100%)',
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full sh-glass-strong rounded-2xl p-8 border border-[#36362F] relative z-10 space-y-6 shadow-2xl"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-2">
            <StudentHubLogo size={42} textSize="text-base font-semibold" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#FFFBF4] font-display">Create Account</h1>
          <p className="text-xs text-[#8D8777]">Join Student Hub and organize your academic workspace</p>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="sh-alert-danger"
          >
            <AlertCircle size={15} className="shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#D8CFBC]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8D8777] absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Sharma"
                className="sh-input pl-10 pr-4 py-2.5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#D8CFBC]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8D8777] absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="sh-input pl-10 pr-4 py-2.5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#D8CFBC]">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8D8777] absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••• (min 6 characters)"
                className="sh-input pl-10 pr-4 py-2.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sh-btn-primary py-2.5 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#11120D]" strokeWidth={2} />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 text-xs text-[#8D8777]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#8E9B7A] hover:text-[#FFFBF4] font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
