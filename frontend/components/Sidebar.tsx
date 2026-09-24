'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
  { href: '/notes',     label: 'Notes & AI', icon: BookOpen },
  { href: '/tasks',     label: 'Tasks',      icon: CheckSquare },
  { href: '/habits',    label: 'Habits & Routine', icon: Flame },
  { href: '/files',     label: 'File Sharing', icon: QrCode },
  { href: '/resources', label: 'Resources',  icon: Bookmark },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#1C1C17] border-r border-[#36362F] p-3 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-0.5">
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
              className="relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors group"
              style={{ color: isActive ? '#FFFBF4' : '#D8CFBC' }}
            >
              {/* Animated active pill via layoutId */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-[#24241E] border border-[#565449] rounded-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              {!isActive && (
                <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 bg-[#24241E]/60 transition-opacity duration-150" />
              )}
              <span className="relative z-10">
                <Icon
                  size={15}
                  strokeWidth={1.75}
                  className={isActive ? 'text-[#8E9B7A]' : 'text-[#8D8777] group-hover:text-[#D8CFBC] transition-colors'}
                />
              </span>
              <span className="relative z-10">{item.label}</span>
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
