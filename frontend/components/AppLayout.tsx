'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import GlobalChatbot from './GlobalChatbot';
import { Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary,#11120D)]">
        <Loader2 className="animate-spin text-[#8E9B7A]" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary,#11120D)] text-[var(--color-text-primary,#FFFBF4)] transition-colors">
      
      {/* ── Guest Preview Top Banner ── */}
      {!user && (
        <div className="bg-[#282F24] border-b border-[#8E9B7A]/30 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 z-40 text-xs text-[#FFFBF4]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8E9B7A] animate-pulse shrink-0" />
            <span className="font-medium text-[#D8CFBC]">
              👀 <strong>Guest Preview Mode:</strong> You are exploring Student Hub. Create a free account to save your notes, tasks, and habits.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="text-xs font-medium text-[#D8CFBC] hover:text-[#FFFBF4] px-2.5 py-1 rounded transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="sh-btn-sage text-[11px] py-1 px-3 font-semibold gap-1"
            >
              <span>Get Started Free</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
          <footer className="shrink-0 border-t border-[var(--color-border,#1E1E18)] px-6 py-3 bg-[var(--color-bg-surface,#1C1C17)]">
            <p className="text-[11px] text-[var(--color-text-muted,#57564F)] text-center leading-relaxed">
              A college project by{' '}
              <a href="https://www.linkedin.com/in/shrikant-nagesh-yadwad-5b3075252/" target="_blank" rel="noopener noreferrer" className="text-[#8E9B7A] hover:underline transition-colors underline-offset-2">Shrikant Yadwad</a>
              {' '}&amp;{' '}
              <a href="https://www.linkedin.com/in/piyush-adhav-b5323a360/" target="_blank" rel="noopener noreferrer" className="text-[#8E9B7A] hover:underline transition-colors underline-offset-2">Piyush Adhav</a>
              {' '}&middot; Indira University
            </p>
          </footer>
        </div>
      </div>
      <GlobalChatbot />
    </div>
  );
}
