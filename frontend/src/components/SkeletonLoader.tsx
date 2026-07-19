import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-white dark:bg-slate-800 shadow-sm animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
    </div>
  );
};

export const SkeletonDashboardStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-xl w-12 h-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full"></div>
      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
      <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>
    </div>
  );
};
