import React from 'react';

/**
 * Minimal loading spinner for React.lazy() Suspense fallback.
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-400 font-medium">Chargement…</span>
      </div>
    </div>
  );
}
