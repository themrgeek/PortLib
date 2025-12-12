/**
 * EmptyState component for displaying empty states
 */

import React from "react";
import { Book } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4 text-slate-400">
        {icon || <Book className="w-16 h-16" />}
      </div>
      <h3 className="text-slate-900 font-semibold text-h4 mb-2 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-slate-700 text-body mb-6 text-center max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-white font-semibold text-body py-sm px-md rounded-lg hover:bg-primary/90 transition-colors"
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
