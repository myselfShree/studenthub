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
  { href: '/files', label: 'File Sharing', icon: QrCode },
  { href: '/resources', label: 'Resources', icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#1C1C17] border-r border-[#36362F] p-3 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-3.5rem)] transition-colors">
      <div className="space-y-1">
        <p className="px-3 py-2 text-[10px] font-semibold text-[#8D8777] uppercase tracking-wider font-mono">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#24241E] text-[#FFFBF4] border border-[#565449]'
                  : 'text-[#D8CFBC] hover:text-[#FFFBF4] hover:bg-[#24241E]/60 border border-transparent'
              }`}
            >
              <Icon 
                size={15} 
                className={isActive ? 'text-[#8E9B7A]' : 'text-[#8D8777]'} 
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-3 rounded-md bg-[#11120D] border border-[#36362F]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#8E9B7A]" />
          <span className="text-[11px] font-medium text-[#D8CFBC]">Student Hub Active</span>
        </div>
        <p className="text-[10px] text-[#8D8777]">Minimal Academic System</p>
      </div>
    </aside>
  );
}
