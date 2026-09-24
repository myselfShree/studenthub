'use client';

import React from 'react';

interface SkeletonCardProps {
  lines?: number;
  height?: string;
}

export function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={`sh-skeleton ${width} ${height} rounded`} />;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div className="sh-card p-4 space-y-3 animate-pulse">
      <SkeletonLine width="w-1/3" height="h-2" />
      <SkeletonLine width="w-1/2" height="h-7" />
      <SkeletonLine width="w-2/3" height="h-2" />
    </div>
  );
}

export function SkeletonScorecard() {
  return (
    <div className="sh-glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-24" height="h-2" />
        <div className="sh-skeleton w-4 h-4 rounded" />
      </div>
      <SkeletonLine width="w-16" height="h-7" />
      <SkeletonLine width="w-20" height="h-2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="sh-card p-3 flex items-center gap-3">
      <div className="sh-skeleton w-5 h-5 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonLine width="w-3/4" height="h-2.5" />
        <SkeletonLine width="w-1/2" height="h-2" />
      </div>
      <div className="sh-skeleton w-12 h-5 rounded" />
    </div>
  );
}

export function SkeletonTextBlock() {
  return (
    <div className="space-y-2">
      <SkeletonLine width="w-full" height="h-3" />
      <SkeletonLine width="w-5/6" height="h-3" />
      <SkeletonLine width="w-4/6" height="h-3" />
    </div>
  );
}

export default SkeletonCard;
