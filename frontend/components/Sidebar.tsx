'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Flame,
  QrCode,
  Bookmark,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/notes', label: 'Notes & AI', icon: BookOpen },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/habits', label: 'Habits & Routine', icon: Flame },
  { href: '/files', label: 'QR File Share', icon: QrCode },
  { href: '/resources', label: 'Resources', icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-[#30363d] p-3 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-3.5rem)] transition-colors">
      <div className="space-y-1">
        <p className="px-3 py-2 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#21262d]'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#30363d]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">System Ready</span>
        </div>
        <p className="text-[10px] text-slate-600 dark:text-slate-400">StudentHub v1.0 Active</p>
      </div>
    </aside>
  );
}
