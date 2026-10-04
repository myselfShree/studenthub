'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import StudentHubLogo from './StudentHubLogo';
import ProfileModal from './ProfileModal';
import { LogOut, User, Sun, Moon, ChevronDown, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sh-glass border-b border-[var(--color-border,#36362F)] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="transition-opacity hover:opacity-90">
            <StudentHubLogo size={28} textSize="text-sm font-semibold tracking-wide" />
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)] hover:bg-[var(--color-bg-elevated,#24241E)] transition-colors border border-transparent hover:border-[var(--color-border,#36362F)]"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} strokeWidth={1.75} className="text-[#C4975A]" /> : <Moon size={15} strokeWidth={1.75} className="text-[#8E9B7A]" />}
          </button>

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[var(--color-bg-elevated,#24241E)] border border-[var(--color-border,#36362F)] hover:border-[#8E9B7A] transition-colors"
                title="Account Settings"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--color-bg-surface,#36362F)] flex items-center justify-center text-[var(--color-text-secondary,#D8CFBC)]">
                  <User size={12} strokeWidth={1.75} />
                </div>
                <span className="hidden sm:block text-xs font-medium text-[var(--color-text-secondary,#D8CFBC)] truncate max-w-[120px]">
                  {user.name}
                </span>
                <ChevronDown size={12} strokeWidth={2} className={`text-[var(--color-text-muted,#8D8777)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border border-[var(--color-border,#36362F)] bg-[var(--color-bg-surface,#1C1C17)] shadow-xl z-50 overflow-hidden animate-scale-up">
                  <div className="px-3.5 py-2.5 border-b border-[var(--color-border,#36362F)]">
                    <p className="text-xs font-semibold text-[var(--color-text-primary,#FFFBF4)] truncate">{user.name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted,#8D8777)] truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[var(--color-text-secondary,#D8CFBC)] hover:bg-[var(--color-bg-elevated,#24241E)] transition-colors text-left"
                  >
                    <Settings size={13} strokeWidth={1.75} className="text-[#8E9B7A]" />
                    Edit Profile & Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#C76A5E] hover:bg-[rgba(199,106,94,0.1)] transition-colors border-t border-[var(--color-border,#36362F)]"
                  >
                    <LogOut size={13} strokeWidth={1.75} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Profile Edit Modal */}
      <ProfileModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
