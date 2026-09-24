'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StudentHubLogo from './StudentHubLogo';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-14 sh-glass border-b border-[rgba(216,207,188,0.08)] px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="transition-opacity hover:opacity-90">
          <StudentHubLogo size={28} textSize="text-sm font-semibold tracking-wide" />
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {user && (
          <>
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#24241E] border border-[#36362F]">
              <div className="w-5 h-5 rounded-full bg-[#36362F] flex items-center justify-center text-[#D8CFBC]">
                <User size={12} strokeWidth={1.75} />
              </div>
              <span className="text-xs font-medium text-[#D8CFBC] truncate max-w-[140px]">
                {user.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="sh-btn-secondary px-3 py-1.5 text-xs gap-1.5"
              title="Sign Out"
            >
              <LogOut size={13} strokeWidth={1.75} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
