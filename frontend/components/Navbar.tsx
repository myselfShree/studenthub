'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import StudentHubLogo from './StudentHubLogo';
import ProfileModal from './ProfileModal';
import { 
  LogOut, 
  User, 
  Sun, 
  Moon, 
  ChevronDown, 
  Settings, 
  Menu, 
  X,
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  CheckSquare,
  Flame,
  QrCode,
  Bookmark
} from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/ai-assistant', label: 'AI Assistant',     icon: BrainCircuit },
  { href: '/notes',        label: 'Notes & AI',       icon: BookOpen },
  { href: '/tasks',        label: 'Tasks',            icon: CheckSquare },
  { href: '/habits',       label: 'Habits & Routine', icon: Flame },
  { href: '/files',        label: 'File Sharing',     icon: QrCode },
  { href: '/resources',    label: 'Resources',        icon: Bookmark },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sh-glass border-b border-[var(--color-border,#36362F)] px-3 sm:px-6 flex items-center justify-between transition-colors">
        
        {/* Left: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {user && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary,#D8CFBC)] hover:text-[var(--color-text-primary,#FFFBF4)] hover:bg-[var(--color-bg-elevated,#24241E)] transition-colors"
              aria-label="Open workspace menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          <Link href="/dashboard" className="transition-opacity hover:opacity-90 flex items-center gap-2">
            <StudentHubLogo size={26} textSize="text-sm font-semibold tracking-wide font-display" />
          </Link>
        </div>

        {/* Right: Theme Toggle + Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)] hover:bg-[var(--color-bg-elevated,#24241E)] transition-colors border border-transparent hover:border-[var(--color-border,#36362F)]"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={15} strokeWidth={1.75} className="text-[#C4975A]" />
            ) : (
              <Moon size={15} strokeWidth={1.75} className="text-[#8E9B7A]" />
            )}
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
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#C76A5E] hover:bg-[rgba(199,106,94,0.1)] transition-colors border-t border-[var(--color-border,#36362F)] text-left"
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

      {/* ── MOBILE WORKSPACE DRAWER (shown on small screens) ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-72 max-w-[85vw] h-full bg-[var(--color-bg-surface,#1C1C17)] border-r border-[var(--color-border,#36362F)] flex flex-col justify-between p-4 shadow-2xl animate-slide-right">
            
            <div className="space-y-4">
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border,#36362F)]">
                <div className="flex items-center gap-2">
                  <StudentHubLogo size={24} textSize="text-xs font-semibold font-display" />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* User overview */}
              {user && (
                <div className="p-3 rounded-lg bg-[var(--color-bg-elevated,#24241E)] border border-[var(--color-border,#36362F)]">
                  <p className="text-xs font-semibold text-[var(--color-text-primary,#FFFBF4)] truncate">{user.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted,#8D8777)] truncate">{user.email}</p>
                </div>
              )}

              {/* Navigation links */}
              <div className="space-y-1">
                <p className="px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted,#8D8777)] uppercase font-mono tracking-wider">
                  Workspace
                </p>
                {MOBILE_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#282F24] text-[#8E9B7A] border border-[#8E9B7A]/40 font-semibold'
                          : 'text-[var(--color-text-secondary,#D8CFBC)] hover:bg-[var(--color-bg-elevated,#24241E)]'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.75} className={isActive ? 'text-[#8E9B7A]' : 'text-[var(--color-text-muted,#8D8777)]'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[var(--color-border,#36362F)] space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[var(--color-text-secondary,#D8CFBC)] hover:bg-[var(--color-bg-elevated,#24241E)] transition-colors text-left"
              >
                <Settings size={15} className="text-[#8E9B7A]" />
                <span>Edit Profile & Password</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#C76A5E] hover:bg-[rgba(199,106,94,0.1)] transition-colors text-left"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <ProfileModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
