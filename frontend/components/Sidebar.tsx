'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Flame, 
  QrCode, 
  Bookmark,
  Sparkles,
  Settings
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Smart Notes', href: '/notes', icon: FileText },
  { name: 'Assignments', href: '/tasks', icon: CheckSquare },
  { name: 'Habit Tracker', href: '/habits', icon: Flame },
  { name: 'QR File Sharing', href: '/files', icon: QrCode },
  { name: 'Resource Hub', href: '/resources', icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0c1220]/60 backdrop-blur-md flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3">
            Academic Workspace
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  )}
                >
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-indigo-400' : 'text-slate-400')} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* AI Assistant Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-b from-purple-950/40 to-slate-900/60 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold">Gemini AI Assistant</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Summarize lecture notes, extract key concepts, and generate practice quizzes inside Smart Notes.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between px-2 text-[11px] text-slate-400">
        <span>Student Hub v1.0</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          API Online
        </span>
      </div>
    </aside>
  );
}
