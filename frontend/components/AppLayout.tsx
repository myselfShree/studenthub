'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary,#11120D)]">
        <Loader2 className="animate-spin text-[#8E9B7A]" size={28} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-primary,#11120D)] text-[var(--color-text-primary,#FFFBF4)] transition-colors">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
          <footer className="shrink-0 border-t border-[var(--color-border,#1E1E18)] px-6 py-3">
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
    </div>
  );
}
