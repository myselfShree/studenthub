'use client';

import React from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight, Lock } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  title = "Create an account to continue",
  description = "Sign up or log in to save your study notes, track daily habits, manage tasks, and access AI assistance."
}: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[var(--color-bg-surface,#1C1C17)] border border-[var(--color-border,#36362F)] rounded-2xl p-6 sm:p-8 shadow-2xl animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted,#8D8777)] hover:text-[var(--color-text-primary,#FFFBF4)] hover:bg-[var(--color-bg-elevated,#24241E)] transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Icon & Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#282F24] border border-[#8E9B7A]/40 flex items-center justify-center text-[#8E9B7A]">
            <Lock size={20} strokeWidth={1.75} />
          </div>
          <span className="sh-badge-sage text-[11px] font-semibold">
            <Sparkles size={12} className="inline mr-1" /> Student Hub Account
          </span>
        </div>

        {/* Content */}
        <h2 className="text-lg font-bold text-[var(--color-text-primary,#FFFBF4)] tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-[var(--color-text-muted,#8D8777)] mt-2 leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/register"
            className="sh-btn-primary w-full sm:flex-1 py-2.5 text-xs font-semibold justify-center gap-2 shadow-lg"
          >
            <span>Create Free Account</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/login"
            className="sh-btn-secondary w-full sm:w-auto py-2.5 px-4 text-xs font-medium justify-center"
          >
            <span>Sign In</span>
          </Link>
        </div>

        <p className="text-[11px] text-[var(--color-text-muted,#57564F)] text-center mt-4">
          Takes less than 30 seconds &middot; No credit card needed
        </p>
      </div>
    </div>
  );
}
