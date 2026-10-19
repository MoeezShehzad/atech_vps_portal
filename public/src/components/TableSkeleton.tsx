import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 4, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full space-y-3.5 p-6 animate-pulse">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-2.5 border-b border-slate-100/80 dark:border-slate-800/60">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 bg-slate-200/80 dark:bg-slate-800/70 rounded-md ${
                cIdx === 0 ? 'w-1/4' : cIdx === 1 ? 'w-1/3' : 'flex-1'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
      <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
    </div>
  );
}

export default TableSkeleton;
