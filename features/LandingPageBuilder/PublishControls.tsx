import React, { useEffect } from 'react';
import type { LandingPage } from '../../types';

interface PublishControlsProps {
  page: LandingPage;
  onPublish: () => Promise<void>;
  onUnpublish: () => Promise<void>;
  saving: boolean;
  saved: boolean;
}

export const PublishControls: React.FC<PublishControlsProps> = ({
  page,
  onPublish,
  onUnpublish,
  saving,
  saved,
}) => {
  return (
    <div className="flex items-center gap-3">
      {saving && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
          <span>Enregistrement…</span>
        </div>
      )}
      {!saving && saved && (
        <span className="text-xs text-green-600 font-medium">✓ Enregistré</span>
      )}

      {page.isPublished ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            En ligne
          </span>
          <button
            onClick={onUnpublish}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Dépublier
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
            Brouillon
          </span>
          <button
            onClick={onPublish}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Publier
          </button>
        </div>
      )}
    </div>
  );
};
