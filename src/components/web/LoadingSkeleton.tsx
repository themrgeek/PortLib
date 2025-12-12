/**
 * Loading skeleton components with shimmer effect
 */

import React from "react";

const shimmerAnimation = "animate-pulse";

export const BookCardSkeleton: React.FC = () => {
  return (
    <div
      className={`bg-surface rounded-lg p-md flex items-center space-x-md ${shimmerAnimation}`}
    >
      <div className="w-20 h-28 bg-slate-200 rounded-md" />
      <div className="flex-1 space-y-xs">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-1/3" />
      </div>
    </div>
  );
};

export const OverdueCardSkeleton: React.FC = () => {
  return (
    <div className={`bg-error rounded-lg p-md shadow-md ${shimmerAnimation}`}>
      <div className="flex items-center space-x-sm mb-xs">
        <div className="w-5 h-5 bg-white/30 rounded" />
        <div className="h-4 bg-white/30 rounded w-32" />
      </div>
      <div className="h-6 bg-white/30 rounded w-40 mb-xs" />
      <div className="h-4 bg-white/30 rounded w-48 mb-lg" />
      <div className="h-10 bg-white/30 rounded" />
    </div>
  );
};

export const SearchBarSkeleton: React.FC = () => {
  return (
    <div
      className={`bg-surface rounded-lg py-sm px-md shadow-sm flex items-center space-x-md ${shimmerAnimation}`}
    >
      <div className="w-5 h-5 bg-slate-200 rounded" />
      <div className="flex-1 h-5 bg-slate-200 rounded" />
    </div>
  );
};
