'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  GraduationCap, 
  Sparkles, 
  FileText, 
  CheckSquare, 
  Flame, 
  QrCode, 
  Bookmark, 
  ArrowRight,
  ShieldCheck,
  Zap,
  BrainCircuit
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Student Hub</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Gemini AI & Next.js Architecture
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          The all-in-one productivity platform for <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-violet-400 bg-clip-text text-transparent">high-achieving students</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Replace disjointed tools with a single unified academic workspace. Organize notes, track daily habit streaks, manage assignment deadlines, and generate AI study quizzes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            Launch Your Hub
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition-all"
          >
            Sign In to Existing Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-16 text-left">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3.5">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Smart Academic Notes</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Notion-style note editing structured by course subject with full-text search.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3.5">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Gemini AI Study Assistant</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Summarize lectures, extract key concepts, and generate practice MCQ quizzes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3.5">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Daily Habit Tracker</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track study consistency with dynamic streak calculations and 30-day logs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3.5">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Assignment Manager</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Prioritize assignments (Urgent, High, Medium, Low) with deadline alerts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3.5">
              <QrCode className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">QR-Based File Sharing</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload study files and generate instant scannable QR codes with expiring links.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3.5">
              <Bookmark className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white mb-1">Resource Repository</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bookmark and organize documentation, YouTube playlists, and GitHub repos.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-400">
        Student Hub — Engineered for higher education productivity.
      </footer>
    </div>
  );
}
