'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-[#1C1C17] border border-[#36362F] flex items-center justify-center mb-4">
        <Icon size={20} className="text-[#8D8777]" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-[#FFFBF4] mb-1">{title}</p>
      {description && (
        <p className="text-xs text-[#8D8777] max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 sh-btn-secondary text-xs"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
